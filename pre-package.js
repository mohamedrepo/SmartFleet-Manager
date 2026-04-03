const fs = require('fs');
const path = require('path');

// Pre-package script: creates a clean directory structure for packaging
const rootDir = __dirname;
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const packDir = path.join(rootDir, 'dist-pack');

console.log('[pre-package] Creating clean packaging directory...');

// Remove old pack dir
if (fs.existsSync(packDir)) {
  fs.rmSync(packDir, { recursive: true });
}

// Create directory structure
const electronDir = path.join(packDir, 'electron');
fs.mkdirSync(electronDir, { recursive: true });

// Copy ALL electron files (main.js, preload.js, db.js)
const electronFiles = ['main.js', 'preload.js', 'db.js'];
for (const file of electronFiles) {
  const src = path.join(rootDir, 'electron', file);
  const dest = path.join(electronDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`[pre-package] Copied electron/${file}`);
  } else {
    console.warn(`[pre-package] WARNING: electron/${file} not found (skipping)`);
  }
}

// Copy package.json (minimal, just for electron-builder metadata)
const pkg = require('./package.json');
const minimalPkg = {
  name: pkg.name,
  version: pkg.version,
  description: 'SmartFleet Manager - Fleet Management System',
  author: 'SmartFleet',
  main: 'electron/main.js',
};
fs.writeFileSync(
  path.join(packDir, 'package.json'),
  JSON.stringify(minimalPkg, null, 2)
);

// Copy afterPack.js
if (fs.existsSync(path.join(rootDir, 'afterPack.js'))) {
  fs.copyFileSync(
    path.join(rootDir, 'afterPack.js'),
    path.join(packDir, 'afterPack.js')
  );
}

// Copy standalone build
const standaloneDest = path.join(packDir, 'standalone');

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
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('[pre-package] Copying standalone build...');
copyDirRecursive(standaloneDir, standaloneDest);

// Verify critical files
const criticalPaths = [
  'electron/main.js',
  'electron/preload.js',
  'electron/db.js',
  'standalone/server.js',
  'standalone/.next/server/app/page.js',
  'standalone/.next/server/app/api/db-setup/route.js',
  'standalone/node_modules/.prisma/client/schema.prisma',
  'standalone/prisma/schema.prisma',
];

let allOk = true;
let warnings = 0;

for (const cp of criticalPaths) {
  const fullPath = path.join(packDir, cp);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`[pre-package] ✓ ${cp} (${stats.size} bytes)`);
  } else {
    console.log(`[pre-package] ✗ MISSING: ${cp}`);
    // db.js is now inlined in main.js, so it's a warning, not a hard failure
    if (cp.includes('db.js')) {
      console.log(`[pre-package]   (Note: db.js is inlined in main.js - this is a warning only)`);
      warnings++;
    } else if (cp.includes('query_engine') || cp.includes('windows.dll')) {
      console.log(`[pre-package]   (Note: Prisma engine may use WASM fallback)`);
      warnings++;
    } else {
      allOk = false;
    }
  }
}

// Check for Prisma engine files
const prismaClientDir = path.join(packDir, 'standalone', 'node_modules', '.prisma', 'client');
if (fs.existsSync(prismaClientDir)) {
  const engineFiles = fs.readdirSync(prismaClientDir).filter(f =>
    f.includes('engine') || f.endsWith('.dll.node') || f.endsWith('.node') || f.endsWith('.wasm')
  );
  console.log(`[pre-package] Prisma engine files (${engineFiles.length}):`, engineFiles.join(', '));
}

console.log('\n[pre-package] ' + (allOk ? 'All critical files verified!' : 'Some critical files are MISSING!'));
if (warnings > 0) console.log(`[pre-package] ${warnings} warning(s)`);
console.log('[pre-package] Pack directory:', packDir);

if (!allOk) {
  console.error('[pre-package] ABORTING: Critical files missing!');
  process.exit(1);
}
