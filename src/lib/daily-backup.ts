import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const BACKUP_DIR = '/home/z/my-project/download/backups';
const DB_PATH = '/home/z/my-project/db/custom.db';
const MAX_BACKUPS = 30;

export default async function dailyBackup() {
  try {
    if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
    if (!existsSync(DB_PATH)) {
      console.log('[Backup] Database not found, skipping...');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const backupPath = join(BACKUP_DIR, `smartfleet-auto-${dateStr}.db`);

    // Skip if today's backup already exists
    if (existsSync(backupPath)) {
      console.log(`[Backup] Today's backup already exists: ${backupPath}`);
      return;
    }

    // Create backup
    execSync(`sqlite3 "${DB_PATH}" <<EOF\n.backup "${backupPath}"\nEOF`, { timeout: 30000 });

    if (existsSync(backupPath)) {
      const size = statSync(backupPath).size;
      console.log(`[Backup] Daily backup created: ${backupPath} (${(size / 1024).toFixed(1)} KB)`);

      // Cleanup old backups (keep last MAX_BACKUPS auto backups)
      const autoBackups = readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('smartfleet-auto-'))
        .map(f => ({ name: f, time: statSync(join(BACKUP_DIR, f)).mtimeMs }))
        .sort((a, b) => b.time - a.time);

      if (autoBackups.length > MAX_BACKUPS) {
        const toDelete = autoBackups.slice(MAX_BACKUPS);
        for (const f of toDelete) {
          execSync(`rm "${join(BACKUP_DIR, f.name)}"`);
          console.log(`[Backup] Deleted old backup: ${f.name}`);
        }
      }
    } else {
      console.log('[Backup] Failed to create backup');
    }
  } catch (error) {
    console.error('[Backup] Error:', error);
  }
}
