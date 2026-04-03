import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import os from 'os';

// Get DB path from runtime env (set by Electron main.js)
// Falls back to a local path for dev mode
function getDbPath(): string {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('file:///')) {
    return dbUrl.replace('file:///', '');
  }
  // Dev fallback
  return join(process.cwd(), 'db', 'custom.db');
}

// Get backup directory - use userData path if available (Electron),
// otherwise use OS temp directory
function getBackupDir(): string {
  // If we're in Electron, app data dir is available
  if (process.env.SMARTFLEET_APP_DATA) {
    return join(process.env.SMARTFLEET_APP_DATA, 'backups');
  }
  // Fallback: use temp dir
  return join(os.tmpdir(), 'smartfleet-backups');
}

const MAX_AUTO_BACKUPS = 30;

export function createBackupSync(prefix = 'smartfleet-backup'): { success: boolean; fileName: string; error?: string } {
  try {
    const BACKUP_DIR = getBackupDir();
    const DB_PATH = getDbPath();

    if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
    if (!existsSync(DB_PATH)) return { success: false, fileName: '', error: 'Database file not found' };

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${prefix}-${timestamp}.db`;
    const backupPath = join(BACKUP_DIR, fileName);

    copyFileSync(DB_PATH, backupPath);

    return { success: true, fileName };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, fileName: '', error: msg };
  }
}

export function listBackups(): { fileName: string; size: number; createdAt: string; isAuto: boolean }[] {
  const BACKUP_DIR = getBackupDir();
  if (!existsSync(BACKUP_DIR)) return [];

  return readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => {
      const stat = statSync(join(BACKUP_DIR, f));
      return {
        fileName: f,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
        isAuto: f.startsWith('smartfleet-auto-'),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteBackup(fileName: string): boolean {
  try {
    const BACKUP_DIR = getBackupDir();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '');
    if (!safeName) return false;
    const filePath = join(BACKUP_DIR, safeName);
    if (!existsSync(filePath)) return false;
    unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}

export function cleanupOldBackups(): number {
  try {
    const BACKUP_DIR = getBackupDir();
    if (!existsSync(BACKUP_DIR)) return 0;
    const autoBackups = readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('smartfleet-auto-'))
      .map(f => ({ name: f, time: statSync(join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    let deleted = 0;
    if (autoBackups.length > MAX_AUTO_BACKUPS) {
      for (const f of autoBackups.slice(MAX_AUTO_BACKUPS)) {
        unlinkSync(join(BACKUP_DIR, f.name));
        deleted++;
      }
    }
    return deleted;
  } catch {
    return 0;
  }
}

export function getBackupDirPath(): string {
  return getBackupDir();
}
