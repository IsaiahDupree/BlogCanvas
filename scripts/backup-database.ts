#!/usr/bin/env tsx
/**
 * Database Backup Script
 * VENDOR-WC-106: Automated DB backups with retention
 *
 * Usage:
 *   npm run db:backup
 *   npm run db:backup -- --env=staging
 *   npm run db:backup -- --retention=30
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface BackupConfig {
    environment: 'production' | 'staging' | 'development';
    retentionDays: number;
    backupPath: string;
}

const DEFAULT_CONFIG: BackupConfig = {
    environment: 'production',
    retentionDays: 30,
    backupPath: path.join(process.cwd(), 'backups'),
};

/**
 * Parse command line arguments
 */
function parseArgs(): Partial<BackupConfig> {
    const args = process.argv.slice(2);
    const config: Partial<BackupConfig> = {};

    args.forEach((arg) => {
        if (arg.startsWith('--env=')) {
            config.environment = arg.split('=')[1] as BackupConfig['environment'];
        } else if (arg.startsWith('--retention=')) {
            config.retentionDays = parseInt(arg.split('=')[1], 10);
        } else if (arg.startsWith('--path=')) {
            config.backupPath = arg.split('=')[1];
        }
    });

    return config;
}

/**
 * Get environment variables based on environment
 */
function getEnvVars(env: string) {
    // Load environment-specific .env file
    const envFile = env === 'production' ? '.env.production.local' : `.env.${env}.local`;
    const envPath = path.join(process.cwd(), envFile);

    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
    } else {
        require('dotenv').config();
    }

    return {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        databaseUrl: process.env.DATABASE_URL,
    };
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDirectory(backupPath: string): void {
    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
        console.log(`📁 Created backup directory: ${backupPath}`);
    }
}

/**
 * Generate backup filename with timestamp
 */
function generateBackupFilename(environment: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `blogcanvas-${environment}-${timestamp}.sql`;
}

/**
 * Perform database backup using pg_dump
 */
async function performBackup(config: BackupConfig): Promise<string> {
    const env = getEnvVars(config.environment);

    if (!env.databaseUrl) {
        throw new Error('DATABASE_URL not found in environment variables');
    }

    ensureBackupDirectory(config.backupPath);

    const filename = generateBackupFilename(config.environment);
    const filepath = path.join(config.backupPath, filename);

    console.log(`🔄 Starting backup for ${config.environment} environment...`);
    console.log(`📝 Backup file: ${filepath}`);

    try {
        // Use pg_dump to create backup
        execSync(`pg_dump "${env.databaseUrl}" > "${filepath}"`, {
            stdio: 'inherit',
        });

        console.log(`✅ Backup completed successfully`);

        // Compress the backup
        console.log(`🗜️  Compressing backup...`);
        execSync(`gzip "${filepath}"`, { stdio: 'inherit' });

        const compressedPath = `${filepath}.gz`;
        const stats = fs.statSync(compressedPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`✅ Backup compressed: ${sizeMB} MB`);

        return compressedPath;
    } catch (error) {
        console.error(`❌ Backup failed:`, error);
        throw error;
    }
}

/**
 * Clean up old backups based on retention policy
 */
function cleanupOldBackups(backupPath: string, retentionDays: number): void {
    console.log(`🧹 Cleaning up backups older than ${retentionDays} days...`);

    const files = fs.readdirSync(backupPath);
    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    files.forEach((file) => {
        if (!file.endsWith('.sql.gz')) return;

        const filepath = path.join(backupPath, file);
        const stats = fs.statSync(filepath);
        const age = now - stats.mtimeMs;

        if (age > retentionMs) {
            fs.unlinkSync(filepath);
            deletedCount++;
            console.log(`  🗑️  Deleted: ${file}`);
        }
    });

    if (deletedCount === 0) {
        console.log(`  ℹ️  No old backups to delete`);
    } else {
        console.log(`✅ Deleted ${deletedCount} old backup(s)`);
    }
}

/**
 * Upload backup to Supabase Storage (optional)
 */
async function uploadToStorage(
    filepath: string,
    env: ReturnType<typeof getEnvVars>
): Promise<void> {
    console.log(`☁️  Uploading backup to Supabase Storage...`);

    const supabase = createClient(env.supabaseUrl, env.supabaseKey);

    const filename = path.basename(filepath);
    const fileContent = fs.readFileSync(filepath);

    const { data, error } = await supabase.storage
        .from('backups')
        .upload(`database/${filename}`, fileContent, {
            contentType: 'application/gzip',
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error(`❌ Upload failed:`, error);
        throw error;
    }

    console.log(`✅ Backup uploaded to storage: ${data.path}`);
}

/**
 * Main backup function
 */
async function main() {
    console.log(`🔐 BlogCanvas Database Backup Tool`);
    console.log(`==================================\n`);

    const args = parseArgs();
    const config: BackupConfig = { ...DEFAULT_CONFIG, ...args };

    console.log(`Environment: ${config.environment}`);
    console.log(`Retention:   ${config.retentionDays} days`);
    console.log(`Path:        ${config.backupPath}\n`);

    try {
        // Perform backup
        const backupFile = await performBackup(config);

        // Upload to storage (optional)
        if (process.env.UPLOAD_TO_STORAGE === 'true') {
            const env = getEnvVars(config.environment);
            await uploadToStorage(backupFile, env);
        }

        // Clean up old backups
        cleanupOldBackups(config.backupPath, config.retentionDays);

        console.log(`\n✅ Backup process completed successfully`);
        console.log(`📁 Backup saved: ${backupFile}`);

        process.exit(0);
    } catch (error) {
        console.error(`\n❌ Backup process failed:`, error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

export { performBackup, cleanupOldBackups };
