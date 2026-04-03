const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const net = require('net');
const fs = require('fs');
const http = require('http');
const os = require('os');

// ============================================================
// SmartFleet Manager v6.1 - Production Electron Main Process
// ============================================================
// CRITICAL: This file must be COMPLETELY SELF-CONTAINED.
// No external electron/*.js dependencies - everything inlined.
// ============================================================

const PORT = 3456;
let mainWindow = null;
let serverProcess = null;
let isQuitting = false;

// ===== PREVENT MULTIPLE INSTANCES =====
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  console.log('[SmartFleet] Another instance is already running. Exiting.');
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ===== INLINE DATABASE SETUP (no external db.js dependency) =====
function setupDatabase() {
  try {
    const userData = app.getPath('userData');
    const dbDir = path.join(userData, 'db');
    const dbPath = path.join(dbDir, 'custom.db');

    // Create directory if needed
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('[SmartFleet] Created DB directory:', dbDir);
    }

    // Create empty DB file if needed
    if (!fs.existsSync(dbPath)) {
      try {
        fs.writeFileSync(dbPath, '');
        console.log('[SmartFleet] Created empty DB file:', dbPath);
      } catch (err) {
        console.error('[SmartFleet] Could not create DB file:', err.message);
      }
    }

    // Set DATABASE_URL for Prisma
    const dbUrl = 'file:///' + dbPath.replace(/\\/g, '/');
    process.env.DATABASE_URL = dbUrl;

    console.log('[SmartFleet] DB path:', dbPath);
    console.log('[SmartFleet] DB exists:', fs.existsSync(dbPath));
    if (fs.existsSync(dbPath)) {
      console.log('[SmartFleet] DB size:', fs.statSync(dbPath).size, 'bytes');
    }

    return { dbDir, dbPath, dbUrl };
  } catch (err) {
    console.error('[SmartFleet] Database setup failed:', err.message);
    // Fallback: try using a temp location
    const fallbackDir = path.join(os.tmpdir(), 'smartfleet-db');
    const fallbackPath = path.join(fallbackDir, 'custom.db');
    try {
      if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
      if (!fs.existsSync(fallbackPath)) fs.writeFileSync(fallbackPath, '');
      const fallbackUrl = 'file:///' + fallbackPath.replace(/\\/g, '/');
      process.env.DATABASE_URL = fallbackUrl;
      console.log('[SmartFleet] Using fallback DB:', fallbackPath);
      return { dbDir: fallbackDir, dbPath: fallbackPath, dbUrl: fallbackUrl };
    } catch (fallbackErr) {
      console.error('[SmartFleet] Fallback DB also failed:', fallbackErr.message);
      return null;
    }
  }
}

// ===== PATH DETECTION =====
function findServerFile() {
  const exeDir = path.dirname(app.getPath('exe'));
  const appPath = app.getAppPath();

  console.log('[SmartFleet] exe dir:', exeDir);
  console.log('[SmartFleet] app path:', appPath);
  console.log('[SmartFleet] __dirname:', __dirname);
  console.log('[SmartFleet] isPackaged:', app.isPackaged);

  const strategies = [
    // Strategy 1: Standard electron-builder packaged path
    path.join(exeDir, 'resources', 'app', 'server.js'),
    // Strategy 2: Manual packaging - server.js at app root
    path.join(appPath, 'server.js'),
    // Strategy 3: Manual packaging - server.js in standalone
    path.join(appPath, '.next', 'standalone', 'server.js'),
    // Strategy 4: Relative to electron dir (up one level)
    path.join(__dirname, '..', 'server.js'),
    // Strategy 5: Relative to electron dir (up two levels)
    path.join(__dirname, '..', '..', 'server.js'),
    // Strategy 6: Next to exe (flat structure)
    path.join(exeDir, 'server.js'),
  ];

  for (let i = 0; i < strategies.length; i++) {
    const p = strategies[i];
    try {
      if (fs.existsSync(p)) {
        console.log(`[SmartFleet] Found server.js at strategy ${i + 1}:`, p);
        return { serverPath: p, serverCwd: path.dirname(p) };
      }
    } catch (e) {
      // Ignore path check errors
    }
  }

  console.error('[SmartFleet] server.js NOT FOUND in any location!');
  return { serverPath: null, serverCwd: null };
}

function findPrismaEngines(serverCwd) {
  if (!serverCwd) return null;

  const strategies = [
    path.join(serverCwd, 'node_modules', '.prisma', 'client'),
    path.join(serverCwd, '.next', 'standalone', 'node_modules', '.prisma', 'client'),
    path.join(path.dirname(app.getPath('exe')), 'resources', 'app', 'node_modules', '.prisma', 'client'),
    path.join(path.dirname(app.getPath('exe')), 'resources', 'app', '.next', 'standalone', 'node_modules', '.prisma', 'client'),
  ];

  for (const p of strategies) {
    try {
      if (fs.existsSync(p)) {
        const files = fs.readdirSync(p);
        const hasEngine = files.some(f =>
          f.includes('query_engine') || f.endsWith('.dll.node') || f.endsWith('.node')
        );
        if (hasEngine) {
          console.log('[SmartFleet] Found Prisma engines at:', p);
          return p;
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  console.warn('[SmartFleet] Prisma engines not found, relying on default resolution');
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
            console.log('[SmartFleet] Killing PID', pid, 'on port', port);
            try { spawn('taskkill', ['/F', '/PID', pid], { shell: true, windowsHide: true }); } catch (e) {}
          }
        }
        setTimeout(resolve, 1000);
      });
    } else {
      try {
        const proc = spawn('lsof', ['-ti', `:${port}`]);
        let output = '';
        proc.stdout.on('data', (d) => { output += d.toString(); });
        proc.on('close', () => {
          for (const pid of output.trim().split('\n')) {
            if (pid) { try { process.kill(parseInt(pid), 'SIGKILL'); } catch (e) {} }
          }
          setTimeout(resolve, 1000);
        });
      } catch (e) { resolve(); }
    }
  });
}

// ===== SERVER MANAGEMENT =====
function waitForServer(port, maxRetries = 60) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const tryConnect = () => {
      const req = http.get(`http://127.0.0.1:${port}/api/db-setup`, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (++retries >= maxRetries) {
          reject(new Error(`Server did not respond after ${maxRetries} seconds`));
        } else {
          setTimeout(tryConnect, 1000);
        }
      });
      req.setTimeout(5000, () => {
        req.destroy();
        if (++retries >= maxRetries) {
          reject(new Error(`Server connection timed out after ${maxRetries} seconds`));
        } else {
          setTimeout(tryConnect, 1000);
        }
      });
    };
    tryConnect();
  });
}

function callDbSetup() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('[SmartFleet] DB setup timed out, continuing...');
      resolve(false);
    }, 30000);

    const req = http.get(`http://127.0.0.1:${PORT}/api/db-setup`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          const json = JSON.parse(data);
          console.log('[SmartFleet] DB setup result:', json.success ? 'OK' : json.message);
          resolve(json.success === true);
        } catch (e) {
          console.log('[SmartFleet] DB setup raw response:', data.substring(0, 200));
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      console.log('[SmartFleet] DB setup request failed:', err.message);
      resolve(false);
    });

    req.setTimeout(25000, () => {
      clearTimeout(timeout);
      req.destroy();
      console.log('[SmartFleet] DB setup request timed out');
      resolve(false);
    });
  });
}

function startServer(serverPath, serverCwd, prismaEnginesPath) {
  // Set Prisma engine path if found
  if (prismaEnginesPath) {
    process.env.PRISMA_ENGINES_PATH = prismaEnginesPath;
    const engineFiles = fs.readdirSync(prismaEnginesPath);
    const winEngine = engineFiles.find(f => f.includes('windows') && f.endsWith('.node'));
    if (winEngine) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(prismaEnginesPath, winEngine);
      console.log('[SmartFleet] Query engine:', process.env.PRISMA_QUERY_ENGINE_LIBRARY);
    }
  }

  const nodeModulesPath = path.join(serverCwd, 'node_modules');

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(PORT),
    HOSTNAME: '127.0.0.1',
    ELECTRON_RUN_AS_NODE: '1',
    NODE_PATH: nodeModulesPath,
    SMARTFLEET_TMP: os.tmpdir(),
    SMARTFLEET_APP_DATA: app.getPath('userData'),
  };

  console.log('[SmartFleet] ══════════════════════════════════');
  console.log('[SmartFleet] Starting Next.js server...');
  console.log('[SmartFleet] Server path:', serverPath);
  console.log('[SmartFleet] Working dir:', serverCwd);
  console.log('[SmartFleet] DATABASE_URL:', process.env.DATABASE_URL);
  console.log('[SmartFleet] NODE_PATH:', nodeModulesPath);
  console.log('[SmartFleet] execPath:', process.execPath);
  console.log('[SmartFleet] ══════════════════════════════════');

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: serverCwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  // Log server output
  serverProcess.stdout.on('data', (data) => {
    for (const line of data.toString().split('\n')) {
      if (line.trim()) console.log('[Server]', line.trim());
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const str = data.toString();
    for (const line of str.split('\n')) {
      if (line.trim()) console.error('[Server:ERR]', line.trim());
    }
  });

  serverProcess.on('exit', (code, signal) => {
    console.log('[SmartFleet] Server process exited. Code:', code, 'Signal:', signal);
    serverProcess = null;
    // Don't restart - if server dies, just keep the window open showing the error
  });

  serverProcess.on('error', (err) => {
    console.error('[SmartFleet] Server process error:', err.message);
    serverProcess = null;
  });
}

// ===== WINDOW MANAGEMENT =====
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
      sandbox: false,
    },
    show: false, // Don't show until ready
  });

  // Show window when content is loaded
  mainWindow.once('ready-to-show', () => {
    console.log('[SmartFleet] Window ready-to-show, displaying...');
    mainWindow.show();
  });

  // Load the app
  mainWindow.loadURL(`http://127.0.0.1:${PORT}`).catch((err) => {
    console.error('[SmartFleet] Failed to load URL:', err.message);
    // Show error page instead of blank window
    showErrorInWindow(mainWindow, 'Failed to Load Application',
      'Could not connect to the application server.<br>Please restart the application.');
  });

  // Handle navigation errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[SmartFleet] Page failed to load:', errorCode, errorDescription);
    if (errorCode !== -3) { // -3 is aborted, ignore
      showErrorInWindow(mainWindow, 'Page Load Error',
        `Error ${errorCode}: ${errorDescription}<br><br>The server might still be starting. Please wait...`);
    }
  });

  // Handle renderer process crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[SmartFleet] Renderer process crashed:', details.reason);
  });

  // When window is closed by user
  mainWindow.on('closed', () => {
    console.log('[SmartFleet] Main window closed by user');
    mainWindow = null;
  });
}

function showErrorInWindow(win, title, message) {
  if (!win || win.isDestroyed()) return;
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          direction: rtl;
        }
        .container {
          text-align: center;
          padding: 40px;
          max-width: 500px;
        }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h2 { color: #f87171; font-size: 24px; margin-bottom: 15px; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.8; }
        .btn {
          display: inline-block;
          margin-top: 25px;
          padding: 10px 30px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn:hover { background: #2563eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">&#9888;</div>
        <h2>${title}</h2>
        <p>${message}</p>
        <button class="btn" onclick="location.reload()">&#8635; إعادة المحاولة</button>
      </div>
    </body>
    </html>
  `)}`).catch(() => {});
}

function showFatalError(title, message, detail) {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    title: 'SmartFleet - خطأ',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          direction: rtl;
        }
        .container { text-align: center; padding: 40px; max-width: 500px; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h2 { color: #f87171; font-size: 22px; margin-bottom: 15px; }
        .msg { color: #fbbf24; font-size: 14px; line-height: 1.8; margin-bottom: 15px; }
        .detail { color: #64748b; font-size: 12px; line-height: 1.6; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">&#10060;</div>
        <h2>${title}</h2>
        <p class="msg">${message}</p>
        <p class="detail">${detail}</p>
      </div>
    </body>
    </html>
  `)}`).catch(() => {});
}

// ===== CLEANUP =====
function cleanupServer() {
  if (serverProcess) {
    console.log('[SmartFleet] Cleaning up server process...');
    try {
      serverProcess.kill('SIGTERM');
    } catch (e) {
      try {
        serverProcess.kill();
      } catch (e2) {}
    }
    serverProcess = null;
  }
}

// ===== APP LIFECYCLE =====
app.on('window-all-closed', () => {
  console.log('[SmartFleet] All windows closed, quitting...');
  cleanupServer();
  app.quit();
});

app.on('before-quit', (event) => {
  isQuitting = true;
  cleanupServer();
});

// On macOS, re-create window when dock icon is clicked and no windows exist
app.on('activate', () => {
  // On macOS only - don't auto-create windows on Windows/Linux
  if (process.platform === 'darwin' && !mainWindow) {
    createWindow();
  }
});

// ===== MAIN STARTUP =====
app.whenReady().then(async () => {
  console.log('[SmartFleet] ══════════════════════════════════════════');
  console.log('[SmartFleet] SmartFleet Manager v6.1 Starting...');
  console.log('[SmartFleet] Platform:', process.platform);
  console.log('[SmartFleet] Arch:', process.arch);
  console.log('[SmartFleet] Electron:', process.versions.electron);
  console.log('[SmartFleet] Node:', process.versions.node);
  console.log('[SmartFleet] userData:', app.getPath('userData'));
  console.log('[SmartFleet] ══════════════════════════════════════════');

  try {
    // Step 1: Setup database (inline - no external dependency)
    console.log('[SmartFleet] Step 1/6: Setting up database...');
    const dbInfo = setupDatabase();
    if (!dbInfo) {
      showFatalError('Database Setup Failed',
        'Could not initialize the database.',
        'The application cannot store data. Please check your permissions and try again.');
      return;
    }

    // Step 2: Check and free port
    console.log('[SmartFleet] Step 2/6: Checking port', PORT, '...');
    const portFree = await checkPort(PORT);
    if (!portFree) {
      console.log('[SmartFleet] Port', PORT, 'is in use, attempting to free it...');
      await killPortProcess(PORT);
      await new Promise(r => setTimeout(r, 1500));

      const stillBusy = await checkPort(PORT);
      if (stillBusy) {
        showFatalError('Port Conflict',
          `Port ${PORT} is already in use by another application.`,
          `Please close the application using port ${PORT} and try again.`);
        return;
      }
    }

    // Step 3: Find server files
    console.log('[SmartFleet] Step 3/6: Locating server files...');
    const { serverPath, serverCwd } = findServerFile();
    if (!serverPath) {
      showFatalError('Server Files Not Found',
        'Could not find the application server files.',
        'The installation may be corrupted. Please reinstall SmartFleet Manager.');
      return;
    }

    // Step 4: Find Prisma engines
    console.log('[SmartFleet] Step 4/6: Locating database engine...');
    const prismaEnginesPath = findPrismaEngines(serverCwd);

    // Step 5: Start the server
    console.log('[SmartFleet] Step 5/6: Starting server...');
    startServer(serverPath, serverCwd, prismaEnginesPath);

    // Step 6: Wait for server and create window
    console.log('[SmartFleet] Step 6/6: Waiting for server to be ready...');
    try {
      await waitForServer(PORT, 60);
      console.log('[SmartFleet] Server is responding!');

      // Run database schema setup
      console.log('[SmartFleet] Running database schema setup...');
      await callDbSetup();

      // Create and show the main window
      console.log('[SmartFleet] Creating main window...');
      createWindow();
      console.log('[SmartFleet] Application started successfully!');

    } catch (serverErr) {
      console.error('[SmartFleet] Server failed to start:', serverErr.message);
      showFatalError('Server Startup Failed',
        'The application server could not be started.',
        `${serverErr.message}<br><br>Please restart the application or reinstall if the problem persists.`);
    }
  } catch (fatalErr) {
    console.error('[SmartFleet] FATAL ERROR during startup:', fatalErr);
    showFatalError('Application Error',
      'An unexpected error occurred during startup.',
      fatalErr.message || String(fatalErr));
  }
}).catch((err) => {
  console.error('[SmartFleet] app.whenReady() failed:', err);
  // Last resort: show a dialog
  setTimeout(() => {
    try {
      dialog.showErrorBox('SmartFleet Manager - Fatal Error',
        'The application failed to start:\n\n' + (err.message || String(err)) +
        '\n\nPlease reinstall the application.');
    } catch (e) {}
    app.quit();
  }, 1000);
});

// ===== GLOBAL ERROR HANDLERS =====
process.on('uncaughtException', (err) => {
  console.error('[SmartFleet] Uncaught Exception:', err.message || err);
  // Don't let the process crash - log and continue
  // But if we haven't created a window yet, show error
  if (!mainWindow && !isQuitting) {
    try {
      showFatalError('Unexpected Error',
        'An unexpected error occurred.',
        err.message || String(err));
    } catch (e) {
      try {
        dialog.showErrorBox('SmartFleet Error', err.message || String(err));
      } catch (e2) {}
    }
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('[SmartFleet] Unhandled Promise Rejection:', reason);
  // Don't crash - just log it
});
