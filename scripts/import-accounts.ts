import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function importAccounts() {
    const accountsFile = path.join(process.cwd(), 'accounts.txt');
    const content = fs.readFileSync(accountsFile, 'utf-8');

    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    console.log(`\nFound ${lines.length} accounts to import...\n`);

    let imported = 0;
    let skipped = 0;

    for (const line of lines) {
        const parts = line.trim().split(':');
        if (parts.length < 4) {
            skipped++;
            continue;
        }

        const [email, password, refreshToken, clientId] = parts;

        try {
            await prisma.outlookAccount.create({
                data: {
                    userEmail: email,
                    clientId: clientId,
                    refreshToken: refreshToken,
                    status: 'connected',
                    lastSynced: new Date()
                    // lastAccessed is null, so they'll be in "Inactive"
                }
            });

            imported++;
            process.stdout.write(`\r✓ Imported: ${imported} accounts`);
        } catch (error: any) {
            if (error.code === 'P2002') {
                // Unique constraint violation - already exists
                skipped++;
            } else {
                console.error(`\n✗ Failed to import ${email}:`, error.message);
                skipped++;
            }
        }
    }

    console.log(`\n\n✅ Import complete!`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped (duplicates): ${skipped}\n`);

    await prisma.$disconnect();
}

importAccounts().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
