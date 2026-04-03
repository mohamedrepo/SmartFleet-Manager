/**
 * Cross-platform build script for SmartFleet Manager
 * Replaces Unix-only `cp -r` commands in package.json build script
 * Works on Linux, macOS, AND Windows (cmd.exe / PowerShell)
 */
const path = require('path');
const fs = require('fs');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`[build] ERROR: Source not found: ${src}`);
    process.exit(1);
  }
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      copyRecursive(path.join(src, entry.name), path.join(dest, entry.name));
    }
  } else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

const root = __dirname;
const standalone = path.join(root, '.next', 'standalone');

console.log('[build] Copying assets to standalone directory...');

const copies = [
  { src: path.join(root, '.next', 'static'), dest: path.join(standalone, '.next', 'static'), label: '.next/static' },
  { src: path.join(root, 'public'), dest: path.join(standalone, 'public'), label: 'public/' },
  { src: path.join(root, 'prisma'), dest: path.join(standalone, 'prisma'), label: 'prisma/' },
  { src: path.join(root, 'electron', 'main.js'), dest: path.join(standalone, 'electron', 'main.js'), label: 'electron/main.js' },
  { src: path.join(root, 'electron', 'preload.js'), dest: path.join(standalone, 'electron', 'preload.js'), label: 'electron/preload.js' },
  { src: path.join(root, 'electron', 'db.js'), dest: path.join(standalone, 'electron', 'db.js'), label: 'electron/db.js' },
  { src: path.join(root, 'node_modules', '.prisma'), dest: path.join(standalone, 'node_modules', '.prisma'), label: 'node_modules/.prisma' },
];

for (const { src, dest, label } of copies) {
  try {
    copyRecursive(src, dest);
    const stat = fs.statSync(dest);
    console.log(`[build] ✓ ${label} (${stat.isDirectory() ? 'dir' : stat.size + 'B'})`);
  } catch (err) {
    console.error(`[build] ✗ ${label}: ${err.message}`);
  }
}

// Verify critical files
console.log('\n[build] Verifying critical files...');
const critical = [
  path.join(standalone, 'server.js'),
  path.join(standalone, 'electron', 'main.js'),
  path.join(standalone, 'prisma', 'schema.prisma'),
  path.join(standalone, 'node_modules', '.prisma', 'client', 'schema.prisma'),
];

let ok = true;
for (const f of critical) {
  if (fs.existsSync(f)) {
    console.log(`[build] ✓ ${path.relative(standalone, f)}`);
  } else {
    console.error(`[build] ✗ MISSING: ${path.relative(standalone, f)}`);
    ok = false;
  }
}

if (ok) {
  console.log('\n[build] Build complete!');
} else {
  console.error('\n[build] Build has errors!');
  process.exit(1);
}
