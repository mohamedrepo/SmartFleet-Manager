const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let serverProcess;

function setupPaths() {
  const isPackaged = app.isPackaged;
  const baseDir = isPackaged ? path.dirname(app.getPath('exe')) : app.getPath('userData');

  const dbDir = path.join(baseDir, 'db');
  const tempDir = path.join(baseDir, 'temp');

  const dbPath = path.join(dbDir, 'custom.db');

  fs.mkdirSync(dbDir, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });

  if (!fs.existsSync(dbPath)) {
    // For packaged app, copy the default db if it exists
    const defaultDbPath = path.join(process.resourcesPath, 'app', '.next', 'standalone', 'db', 'custom.db');
    if (fs.existsSync(defaultDbPath)) {
      fs.copyFileSync(defaultDbPath, dbPath);
    } else {
      fs.writeFileSync(dbPath, '');
    }
  }

  const dbUrl = `file:${dbPath.replace(/\\/g, '/')}`;
  process.env.DATABASE_URL = dbUrl;

  process.env.TEMP_DIR = tempDir;

  console.log('[SmartFleet] DATABASE_URL set to', dbUrl);
  console.log('[SmartFleet] DB:', dbPath);
  console.log('[SmartFleet] Is Packaged:', isPackaged);
}

function resolveServerPath() {
  const candidates = [
    path.join(process.resourcesPath, 'app', 'server.js'),
    path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'server.js'),
    path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone', 'server.js'),
    path.join(process.cwd(), '.next', 'standalone', 'server.js'),
    path.join(process.cwd(), 'server.js'),
    path.join(__dirname, '..', 'server.js'),
    path.join(__dirname, '..', '..', 'server.js'),
    path.join(process.cwd(), 'electron', 'server.js')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('server.js not found in any known path. Checked: ' + candidates.join(', '));
}

function startServer() {
  const serverPath = resolveServerPath();

  // Use the system node binary; process.execPath in packaged app may point to app exe.
  const nodeExec = process.env.NODE || process.env.NODE_PATH || 'node';

  serverProcess = spawn(nodeExec, [serverPath], {
    cwd: path.dirname(serverPath),
    env: process.env,
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', d =>
    console.log('[Server]', d.toString())
  );

  serverProcess.stderr.on('data', d =>
    console.error('[Server Error]', d.toString())
  );

  serverProcess.on('error', err => {
    console.error('[Server spawn error]', err);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL('http://127.0.0.1:3456');
}

app.whenReady().then(() => {
  setupPaths();
  process.env.PORT = '3456';
  startServer();
  createWindow();
});

app.on('will-quit', () => {
  if (serverProcess) serverProcess.kill();
});