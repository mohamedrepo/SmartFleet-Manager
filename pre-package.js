const fs = require('fs');
const path = require('path');

// Pre-package script: creates a clean directory structure for electron-builder
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

// Copy electron files
fs.copyFileSync(
  path.join(rootDir, 'electron', 'main.js'),
  path.join(electronDir, 'main.js')
);
fs.copyFileSync(
  path.join(rootDir, 'electron', 'preload.js'),
  path.join(electronDir, 'preload.js')
);

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
fs.copyFileSync(
  path.join(rootDir, 'afterPack.js'),
  path.join(packDir, 'afterPack.js')
);

// Copy standalone build to standalone subdirectory (will be used by extraResources)
// We need to make sure node_modules/.prisma is included
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
  'standalone/server.js',
  'standalone/.next/server/app/api/db-setup/route.js',
  'standalone/node_modules/.prisma/client/query_engine-windows.dll.node',
  'standalone/node_modules/.prisma/client/query_engine_bg.wasm',
  'standalone/prisma/schema.prisma',
];

let allOk = true;
for (const cp of criticalPaths) {
  const fullPath = path.join(packDir, cp);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`[pre-package] OK: ${cp} (${stats.size} bytes)`);
  } else {
    console.log(`[pre-package] MISSING: ${cp}`);
    allOk = false;
  }
}

if (allOk) {
  console.log('[pre-package] All critical files verified!');
  console.log('[pre-package] Pack directory ready at:', packDir);
} else {
  console.error('[pre-package] Some critical files are missing!');
  process.exit(1);
}
