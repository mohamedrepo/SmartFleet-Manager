const path = require('path');
const fs = require('fs');

module.exports = async function afterPack(context) {
  const appOutDir = context.appOutDir;
  console.log('[afterPack] Starting afterPack hook...');
  console.log('[afterPack] appOutDir:', appOutDir);

  // Ensure the db directory exists in resources
  const dbDir = path.join(appOutDir, 'resources', 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('[afterPack] Created db directory:', dbDir);
  }

  // Ensure tmp directory exists for imports
  const tmpDir = path.join(appOutDir, 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log('[afterPack] Created tmp directory:', tmpDir);
  }

  // The .prisma/client with the query engine should already be in
  // resources/app/.next/standalone/node_modules/.prisma/client
  // from the post-build step. Verify it exists.
  const standaloneModules = path.join(
    appOutDir,
    'resources',
    'app',
    '.next',
    'standalone',
    'node_modules',
    '.prisma',
    'client'
  );

  if (fs.existsSync(standaloneModules)) {
    const files = fs.readdirSync(standaloneModules);
    console.log('[afterPack] Prisma client files in standalone (' + files.length + '):');

    // Check for Windows engine
    const hasWindowsEngine = files.some(f => f.includes('windows'));
    console.log('[afterPack] Has Windows engine:', hasWindowsEngine);

    if (!hasWindowsEngine) {
      console.log('[afterPack] WARNING: No Windows query engine found!');
    }

    // Check for WASM fallback
    const hasWasm = files.some(f => f.endsWith('.wasm'));
    console.log('[afterPack] Has WASM engine:', hasWasm);
  } else {
    console.log('[afterPack] WARNING: Prisma client not found in standalone at:', standaloneModules);
  }

  // Also check if there's a separate node_modules at app level
  const appModules = path.join(
    appOutDir,
    'resources',
    'app',
    'node_modules',
    '.prisma',
    'client'
  );

  if (fs.existsSync(appModules)) {
    const files = fs.readdirSync(appModules);
    console.log('[afterPack] Prisma client files in app node_modules (' + files.length + ')');

    // If standalone doesn't have the Windows engine but app does, copy it
    if (fs.existsSync(standaloneModules)) {
      const hasWindows = fs.readdirSync(standaloneModules).some(f => f.includes('windows'));
      if (!hasWindows) {
        const appFiles = fs.readdirSync(appModules);
        const winEngine = appFiles.find(f => f.includes('windows'));
        if (winEngine) {
          const src = path.join(appModules, winEngine);
          const dest = path.join(standaloneModules, winEngine);
          fs.copyFileSync(src, dest);
          console.log('[afterPack] Copied Windows engine from app modules to standalone');
        }
      }
    }
  }

  console.log('[afterPack] afterPack hook completed');
};
