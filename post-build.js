const path = require('path');
const fs = require('fs');

// Post-build script: copies Prisma engine files into the standalone build
// This ensures the query-engine binary is available in the packaged app

const standaloneModules = path.join(__dirname, '.next', 'standalone', 'node_modules', '.prisma', 'client');
const sourceModules = path.join(__dirname, 'node_modules', '.prisma', 'client');

const standalonePrisma = path.join(__dirname, '.next', 'standalone', 'node_modules', '@prisma');
const sourcePrisma = path.join(__dirname, 'node_modules', '@prisma');

console.log('[post-build] Source Prisma modules:', sourceModules);
console.log('[post-build] Target Prisma modules:', standaloneModules);
console.log('[post-build] Source @prisma:', sourcePrisma);
console.log('[post-build] Target @prisma:', standalonePrisma);

if (!fs.existsSync(sourceModules)) {
  console.error('[post-build] ERROR: Source Prisma modules not found!');
  process.exit(1);
}

if (!fs.existsSync(sourcePrisma)) {
  console.error('[post-build] ERROR: Source @prisma not found!');
  process.exit(1);
}

// Ensure target directory exists
if (!fs.existsSync(standaloneModules)) {
  fs.mkdirSync(standaloneModules, { recursive: true });
  console.log('[post-build] Created target directory for .prisma');
}

if (!fs.existsSync(standalonePrisma)) {
  fs.mkdirSync(standalonePrisma, { recursive: true });
  console.log('[post-build] Created target directory for @prisma');
}

// Copy .prisma/client files
const files = fs.readdirSync(sourceModules);
let copiedCount = 0;

for (const file of files) {
  const src = path.join(sourceModules, file);
  const dest = path.join(standaloneModules, file);

  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const subFiles = fs.readdirSync(src);
    for (const subFile of subFiles) {
      const subSrc = path.join(src, subFile);
      const subDest = path.join(dest, subFile);
      fs.copyFileSync(subSrc, subDest);
      copiedCount++;
    }
  } else {
    fs.copyFileSync(src, dest);
    copiedCount++;
  }
}

// Copy @prisma files
const prismaFiles = fs.readdirSync(sourcePrisma);
for (const file of prismaFiles) {
  const src = path.join(sourcePrisma, file);
  const dest = path.join(standalonePrisma, file);

  try {
    if (fs.statSync(src).isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const subFiles = fs.readdirSync(src);
      for (const subFile of subFiles) {
        const subSrc = path.join(src, subFile);
        const subDest = path.join(dest, subFile);
        try {
          fs.copyFileSync(subSrc, subDest);
          copiedCount++;
        } catch (e) {
          console.log(`[post-build] Skipped ${subFile}: ${e.message}`);
        }
      }
    } else {
      fs.copyFileSync(src, dest);
      copiedCount++;
    }
  } catch (e) {
    console.log(`[post-build] Skipped ${file}: ${e.message}`);
  }
}

console.log(`[post-build] Copied ${copiedCount} files/dirs to standalone`);
console.log('[post-build] Done!');
