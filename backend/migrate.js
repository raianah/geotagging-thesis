import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
    const client = await pool.connect();
    
    try {
        // Create migrations table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Get list of migration files
        const migrationFiles = fs.readdirSync(path.join(__dirname, 'migrations'))
            .filter(file => file.endsWith('.sql'))
            .sort();

        // Get executed migrations
        const { rows: executedMigrations } = await client.query(
            'SELECT name FROM migrations'
        );
        const executedMigrationNames = new Set(executedMigrations.map(m => m.name));

        // Run pending migrations
        for (const file of migrationFiles) {
            if (!executedMigrationNames.has(file)) {
                console.log(`Running migration: ${file}`);
                const sql = fs.readFileSync(
                    path.join(__dirname, 'migrations', file),
                    'utf8'
                );

                await client.query('BEGIN');
                try {
                    await client.query(sql);
                    await client.query(
                        'INSERT INTO migrations (name) VALUES ($1)',
                        [file]
                    );
                    await client.query('COMMIT');
                    console.log(`Completed migration: ${file}`);
                } catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                }
            }
        }

        console.log('All migrations completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations(); 