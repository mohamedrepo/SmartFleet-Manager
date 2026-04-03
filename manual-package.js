const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Manual packaging script for Electron app (bypasses electron-builder signing issues on Linux)
const packDir = path.join(__dirname, 'dist-pack');
const electronModule = path.join(packDir, 'node_modules', 'electron');
const distDir = path.join(__dirname, 'SmartFleet-Manager-v5');

console.log('[package] Starting manual packaging...');
console.log('[package] Pack dir:', packDir);
console.log('[package] Output dir:', distDir);

// Clean output
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Find Electron binary path
let electronPath = '';
if (fs.existsSync(path.join(electronModule, 'dist', 'electron.exe'))) {
  electronPath = path.join(electronModule, 'dist');
} else if (fs.existsSync(path.join(electronModule, 'dist', 'electron'))) {
  electronPath = path.join(electronModule, 'dist');
} else {
  // Download Electron for Windows
  console.log('[package] Downloading Electron for Windows...');
  const version = '28.3.3';
  const url = `https://github.com/electron/electron/releases/download/v${version}/electron-v${version}-win32-x64.zip`;
  const zipPath = path.join(__dirname, 'electron-win.zip');

  if (!fs.existsSync(zipPath)) {
    execSync(`curl -L -o "${zipPath}" "${url}"`, { stdio: 'inherit' });
  }

  // Extract
  const extractDir = path.join(__dirname, 'electron-win-extract');
  if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true });
  fs.mkdirSync(extractDir);
  execSync(`unzip -o "${zipPath}" -d "${extractDir}"`, { stdio: 'inherit' });

  electronPath = extractDir;
}

console.log('[package] Electron path:', electronPath);

// Copy Electron files to output directory
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (!entry.isSymbolicLink()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('[package] Copying Electron runtime...');
copyDirRecursive(electronPath, distDir);

// Create resources/app directory with the standalone build
const appDir = path.join(distDir, 'resources', 'app');
fs.mkdirSync(appDir, { recursive: true });

console.log('[package] Copying standalone build...');
const standaloneDir = path.join(packDir, 'standalone');
copyDirRecursive(standaloneDir, appDir);

// Create db directory
const dbDir = path.join(distDir, 'resources', 'db');
fs.mkdirSync(dbDir, { recursive: true });
console.log('[package] Created db directory:', dbDir);

// Create tmp directory
const tmpDir = path.join(distDir, 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });
console.log('[package] Created tmp directory:', tmpDir);

// Rename electron.exe to "SmartFleet Manager.exe"
const exeSrc = path.join(distDir, 'electron.exe');
const exeDest = path.join(distDir, 'SmartFleet Manager.exe');
if (fs.existsSync(exeSrc) && !fs.existsSync(exeDest)) {
  fs.copyFileSync(exeSrc, exeDest);
  console.log('[package] Created SmartFleet Manager.exe');
}

// Verify critical files
const checks = [
  ['SmartFleet Manager.exe', distDir],
  ['resources/app/server.js', appDir + '/../app/server.js'],
  ['resources/app/electron/main.js', appDir + '/../app/electron/main.js'],
  ['resources/app/electron/preload.js', appDir + '/../app/electron/preload.js'],
  ['resources/app/.next/server/app/api/db-setup/route.js', appDir + '/../app/.next/server/app/api/db-setup/route.js'],
  ['resources/app/node_modules/.prisma/client/query_engine-windows.dll.node', appDir + '/../app/node_modules/.prisma/client/query_engine-windows.dll.node'],
  ['resources/app/node_modules/.prisma/client/query_engine_bg.wasm', appDir + '/../app/node_modules/.prisma/client/query_engine_bg.wasm'],
  ['resources/app/prisma/schema.prisma', appDir + '/../app/prisma/schema.prisma'],
  ['resources/db (dir)', dbDir],
  ['tmp (dir)', tmpDir],
];

console.log('\n[package] === Verification ===');
let allOk = true;
for (const [name, p] of checks) {
  const exists = fs.existsSync(p);
  if (exists) {
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      console.log(`[package] OK: ${name} (directory)`);
    } else {
      console.log(`[package] OK: ${name} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
    }
  } else {
    console.log(`[package] MISSING: ${name} at ${p}`);
    allOk = false;
  }
}

if (allOk) {
  console.log('\n[package] All checks passed!');
  
  // Calculate total size
  const totalSize = getDirSize(distDir);
  console.log(`[package] Total package size: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log('[package] Package ready at:', distDir);
} else {
  console.error('\n[package] Some files are missing!');
  process.exit(1);
}

function getDirSize(dir) {
  let size = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      size += getDirSize(p);
    } else if (entry.isFile()) {
      size += fs.statSync(p).size;
    }
  }
  return size;
}
