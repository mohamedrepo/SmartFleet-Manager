const { app } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Production-grade database setup.
 * Uses Electron's userData path (writable on all systems) instead of resources/.
 * 
 * Resolves to: C:\Users\<USER>\AppData\Roaming\SmartFleet Manager\db\custom.db
 */
function setupDatabase() {
  const userData = app.getPath('userData');
  const dbDir = path.join(userData, 'db');
  const dbPath = path.join(dbDir, 'custom.db');

  // Create directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('[DB] Created database directory:', dbDir);
  }

  // Create empty DB file if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    try {
      fs.writeFileSync(dbPath, '');
      console.log('[DB] Created empty database file:', dbPath);
    } catch (err) {
      console.error('[DB] Could not create DB file:', err.message);
    }
  }

  // Set DATABASE_URL for Prisma
  const dbUrl = 'file:///' + dbPath.replace(/\\/g, '/');
  process.env.DATABASE_URL = dbUrl;

  console.log('[DB] Database path:', dbPath);
  console.log('[DB] DATABASE_URL:', dbUrl);
  console.log('[DB] File exists:', fs.existsSync(dbPath));
  console.log('[DB] File size:', fs.statSync(dbPath).size, 'bytes');

  return { dbDir, dbPath, dbUrl };
}

module.exports = { setupDatabase };
