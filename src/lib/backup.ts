import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync } from 'fs';
import { join } from 'path';

const DB_PATH = '/home/z/my-project/db/custom.db';
const BACKUP_DIR = '/home/z/my-project/download/backups';
const MAX_AUTO_BACKUPS = 30;

export function createBackupSync(prefix = 'smartfleet-backup'): { success: boolean; fileName: string; error?: string } {
  try {
    if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
    if (!existsSync(DB_PATH)) return { success: false, fileName: '', error: 'قاعدة البيانات غير موجودة' };

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${prefix}-${timestamp}.db`;
    const backupPath = join(BACKUP_DIR, fileName);

    copyFileSync(DB_PATH, backupPath);

    return { success: true, fileName };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'خطأ مجهول';
    return { success: false, fileName: '', error: msg };
  }
}

export function listBackups(): { fileName: string; size: number; createdAt: string; isAuto: boolean }[] {
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
