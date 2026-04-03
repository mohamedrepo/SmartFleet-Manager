const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const http = require('http');
const os = require('os');
const { setupDatabase } = require('./db');

const PORT = 3456;

let mainWindow = null;
let serverProcess = null;

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  console.log('[SmartFleet] Another instance is running. Exiting.');
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ===== PATH DETECTION =====
function findServerFile() {
  const exeDir = path.dirname(app.getPath('exe'));
  const strategies = [
    // Strategy 1: resources/app/server.js (packaged)
    path.join(exeDir, 'resources', 'app', 'server.js'),
    // Strategy 2: relative to __dirname (../server.js)
    path.join(__dirname, '..', 'server.js'),
    // Strategy 3: relative to __dirname (../../server.js)
    path.join(__dirname, '..', '..', 'server.js'),
  ];
  for (const p of strategies) {
    if (fs.existsSync(p)) {
      console.log('[SmartFleet] Found server at:', p);
      return { serverPath: p, serverCwd: path.dirname(p) };
    }
  }
  return { serverPath: null, serverCwd: null };
}

function findPrismaEngines(serverCwd) {
  const strategies = [
    path.join(serverCwd, 'node_modules', '.prisma', 'client'),
    path.join(serverCwd, '..', 'node_modules', '.prisma', 'client'),
  ];
  for (const p of strategies) {
    if (fs.existsSync(p)) {
      const hasEngine = fs.readdirSync(p).some(f =>
        f.includes('query_engine') || f.includes('windows')
      );
      if (hasEngine) {
        console.log('[SmartFleet] Found Prisma engines at:', p);
        return p;
      }
    }
  }
  return null;
}

// ===== PORT MANAGEMENT =====
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port, '127.0.0.1');
  });
}

function killPortProcess(port) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const proc = spawn('cmd.exe', ['/c', `netstat -ano | findstr :${port} | findstr LISTENING`], {
        shell: true, windowsHide: true
      });
      let output = '';
      proc.stdout.on('data', (d) => { output += d.toString(); });
      proc.on('close', () => {
        for (const line of output.trim().split('\n')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            console.log('[SmartFleet] Killing process', pid, 'on port', port);
            spawn('taskkill', ['/F', '/PID', pid], { shell: true, windowsHide: true });
          }
        }
        setTimeout(resolve, 1000);
      });
    } else {
      const proc = spawn('lsof', ['-ti', `:${port}`]);
      let output = '';
      proc.stdout.on('data', (d) => { output += d.toString(); });
      proc.on('close', () => {
        for (const pid of output.trim().split('\n')) {
          if (pid) { try { process.kill(parseInt(pid), 'SIGKILL'); } catch (e) {} }
        }
        setTimeout(resolve, 1000);
      });
    }
  });
}

// ===== SERVER MANAGEMENT =====
function waitForServer(port, maxRetries = 60) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const tryConnect = () => {
      http.get(`http://127.0.0.1:${port}/api/dashboard`, (res) => {
        res.resume();
        resolve(true);
      }).on('error', () => {
        if (++retries >= maxRetries) reject(new Error('Server timeout'));
        else setTimeout(tryConnect, 1000);
      });
    };
    tryConnect();
  });
}

function callDbSetup() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('[SmartFleet] DB setup timed out');
      resolve({});
    }, 30000);

    http.get(`http://127.0.0.1:${PORT}/api/db-setup`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          const json = JSON.parse(data);
          console.log('[SmartFleet] DB setup:', json.success ? 'OK' : json.message);
        } catch (e) {
          console.log('[SmartFleet] DB setup raw:', data.substring(0, 200));
        }
        resolve({});
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      console.log('[SmartFleet] DB setup error:', err.message);
      resolve({});
    });
  });
}

function startServer(serverPath, serverCwd, prismaEnginesPath) {
  // Set Prisma engine path
  if (prismaEnginesPath) {
    // Try to find the specific Windows engine
    const engineFiles = fs.readdirSync(prismaEnginesPath);
    const winEngine = engineFiles.find(f => f.includes('windows') && f.endsWith('.node'));
    if (winEngine) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(prismaEnginesPath, winEngine);
      console.log('[SmartFleet] PRISMA_QUERY_ENGINE_LIBRARY:', process.env.PRISMA_QUERY_ENGINE_LIBRARY);
    }
    process.env.PRISMA_ENGINES_PATH = prismaEnginesPath;
  }

  const nodeModulesPath = path.join(serverCwd, 'node_modules');

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(PORT),
    HOSTNAME: '127.0.0.1',
    ELECTRON_RUN_AS_NODE: '1',
    NODE_PATH: nodeModulesPath,
    // Fix temp directory for file imports
    SMARTFLEET_TMP: os.tmpdir(),
  };

  console.log('[SmartFleet] === Server Config ===');
  console.log('[SmartFleet] Server:', serverPath);
  console.log('[SmartFleet] CWD:', serverCwd);
  console.log('[SmartFleet] DATABASE_URL:', process.env.DATABASE_URL);
  console.log('[SmartFleet] NODE_PATH:', nodeModulesPath);
  console.log('[SmartFleet] TMP:', os.tmpdir());
  console.log('[SmartFleet] ======================');

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: serverCwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  serverProcess.stdout.on('data', (data) => {
    for (const line of data.toString().split('\n')) {
      if (line.trim()) console.log('[Server]', line.trim());
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const str = data.toString();
    for (const line of str.split('\n')) {
      if (line.trim()) console.error('[Server]', line.trim());
    }
    if (str.includes('Error code 14') || str.includes('PrismaClientInitializationError')) {
      console.log('[SmartFleet] Prisma error detected');
    }
  });

  serverProcess.on('exit', (code) => {
    console.log('[SmartFleet] Server exited:', code);
    serverProcess = null;
  });

  serverProcess.on('error', (err) => {
    console.error('[SmartFleet] Server error:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'SmartFleet Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
  mainWindow.on('closed', () => { mainWindow = null; });
}

function showError(title, message, detail) {
  const win = new BrowserWindow({
    width: 600, height: 350,
    title: 'SmartFleet - Error',
    webPreferences: { nodeIntegration: false }
  });
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <html><body style="font-family:Arial;text-align:center;padding:40px;direction:rtl;background:#1e293b;color:#e2e8f0;">
    <h2 style="color:#f87171;">${title}</h2>
    <p style="color:#fbbf24;">${message}</p>
    <p style="color:#94a3b8;font-size:13px;margin-top:15px;">${detail}</p>
    </body></html>
  `)}`);
}

// ===== APP LIFECYCLE =====
app.whenReady().then(async () => {
  console.log('[SmartFleet] Starting SmartFleet Manager v6...');

  // Step 1: Setup database in userData (writable path)
  const dbInfo = setupDatabase();

  // Step 2: Check port
  console.log('[SmartFleet] Checking port', PORT, '...');
  const portFree = await checkPort(PORT);
  if (!portFree) {
    console.log('[SmartFleet] Port in use, freeing...');
    await killPortProcess(PORT);
    await new Promise(r => setTimeout(r, 1500));
  }

  // Step 3: Find server files
  const { serverPath, serverCwd } = findServerFile();
  if (!serverPath) {
    showError('Server Not Found', 'Could not find server.js',
      'The application files may be corrupted. Please reinstall.');
    return;
  }

  // Step 4: Find Prisma engines
  const prismaEnginesPath = findPrismaEngines(serverCwd);
  if (!prismaEnginesPath) {
    console.warn('[SmartFleet] WARNING: Prisma engines not found, relying on default resolution');
  }

  // Step 5: Start server
  startServer(serverPath, serverCwd, prismaEnginesPath);

  // Step 6: Wait for server + DB setup
  try {
    console.log('[SmartFleet] Waiting for server...');
    await waitForServer(PORT, 60);

    console.log('[SmartFleet] Server ready! Setting up database...');
    await callDbSetup();

    console.log('[SmartFleet] Loading application...');
    createWindow();
  } catch (err) {
    showError('Server Failed', 'Could not start the server',
      err.message + '<br><br>Try restarting the application.');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) { serverProcess.kill(); serverProcess = null; }
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) { try { serverProcess.kill(); } catch (e) {} serverProcess = null; }
});

process.on('uncaughtException', (err) => console.error('[SmartFleet] Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('[SmartFleet] Rejection:', err));
