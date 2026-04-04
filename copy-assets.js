const fs = require('fs-extra');
const path = require('path');

const root = __dirname;

async function copy() {
  try {
    console.log('[COPY] Starting...');

    await fs.copy(
      path.join(root, '.next/static'),
      path.join(root, '.next/standalone/.next/static')
    );

    await fs.copy(
      path.join(root, 'public'),
      path.join(root, '.next/standalone/public')
    );

    await fs.copy(
      path.join(root, 'prisma'),
      path.join(root, '.next/standalone/prisma')
    );

    await fs.copy(
      path.join(root, 'electron'),
      path.join(root, '.next/standalone/electron')
    );

    await fs.copy(
      path.join(root, 'node_modules/.prisma'),
      path.join(root, '.next/standalone/node_modules/.prisma')
    );

    console.log('[COPY] Done ✅');
  } catch (err) {
    console.error('[COPY ERROR]', err);
    process.exit(1);
  }
}

copy();