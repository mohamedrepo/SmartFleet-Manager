import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[DB Setup] Starting database setup...');

    const dbUrl = process.env.DATABASE_URL || '';
    console.log('[DB Setup] DATABASE_URL:', dbUrl.substring(0, 50) + '...');

    // Ensure database directory exists
    if (dbUrl.startsWith('file:///')) {
      const filePath = dbUrl.replace('file:///', '');
      const dbDir = dirname(filePath);
      console.log('[DB Setup] Ensuring DB directory exists:', dbDir);

      try {
        if (!existsSync(dbDir)) {
          mkdirSync(dbDir, { recursive: true });
          console.log('[DB Setup] Created database directory:', dbDir);
        } else {
          console.log('[DB Setup] Database directory exists:', dbDir);
        }
      } catch (dirErr: any) {
        console.error('[DB Setup] ERROR creating DB directory:', dirErr.message);
      }
    }

    // Find schema file
    const possibleSchemaPaths = [
      process.cwd() + '/prisma/schema.prisma',
    ];

    let schemaPath = '';
    for (const p of possibleSchemaPaths) {
      if (existsSync(p)) {
        schemaPath = p;
        break;
      }
    }

    console.log('[DB Setup] Schema:', schemaPath || 'NOT FOUND');

    if (schemaPath) {
      try {
        console.log('[DB Setup] Running prisma db push...');
        const npxPath = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        execSync(`${npxPath} prisma db push --skip-generate --accept-data-loss 2>&1`, {
          cwd: dirname(schemaPath),
          timeout: 60000,
          stdio: 'pipe',
          env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
        });
        console.log('[DB Setup] Schema pushed successfully');
      } catch (pushErr: any) {
        const errMsg = pushErr.stdout?.toString() || pushErr.message || '';
        console.log('[DB Setup] db push output:', errMsg);
      }
    }

    // Verify with a simple query
    let verifySuccess = false;
    try {
      const { db } = await import('@/lib/db');
      const count = await db.vehicle.count();
      console.log('[DB Setup] Verified! Vehicle count:', count);
      verifySuccess = true;
    } catch (verifyErr: any) {
      console.error('[DB Setup] Verification failed:', verifyErr.message);
    }

    return NextResponse.json({
      success: verifySuccess,
      message: verifySuccess ? 'Database ready' : 'Setup completed, verification failed',
    });
  } catch (error: any) {
    console.error('[DB Setup] FAILED:', error.message);
    return NextResponse.json({ success: false, message: error.message });
  }
}
