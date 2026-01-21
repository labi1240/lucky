import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function importAccounts() {
    const accountsFile = path.join(process.cwd(), 'accounts.txt');

    if (!fs.existsSync(accountsFile)) {
        console.error('❌ accounts.txt not found in current directory');
        process.exit(1);
    }

    const content = fs.readFileSync(accountsFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    console.log(`\nFound ${lines.length} accounts to import...\n`);

    let imported = 0;
    let skipped = 0;

    const client = await pool.connect();

    try {
        for (const line of lines) {
            const parts = line.trim().split(':');
            if (parts.length < 4) {
                skipped++;
                continue;
            }

            const [email, password, refreshToken, clientId] = parts;

            try {
                await client.query(
                    `INSERT INTO outlook_accounts (id, user_email, client_id, refresh_token, status, last_synced, created_at, updated_at)
                     VALUES (gen_random_uuid()::text, $1, $2, $3, 'connected', NOW(), NOW(), NOW())
                     ON CONFLICT (user_email) DO NOTHING`,
                    [email, clientId, refreshToken]
                );

                imported++;
                process.stdout.write(`\r✓ Imported: ${imported} accounts`);
            } catch (error: any) {
                console.error(`\n✗ Failed to import ${email}:`, error.message);
                skipped++;
            }
        }
    } finally {
        client.release();
    }

    console.log(`\n\n✅ Import complete!`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped: ${skipped}\n`);

    await pool.end();
}

importAccounts().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
