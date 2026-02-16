import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../apps/web/.env') });

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL
}).$extends(withAccelerate());

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

    try {
        for (const line of lines) {
            const parts = line.trim().split(':');
            if (parts.length < 4) {
                skipped++;
                continue;
            }

            const [email, password, refreshToken, clientId] = parts;

            try {
                // @ts-ignore - extensions can sometimes have type lags
                await prisma.outlookAccount.upsert({
                    where: { userEmail: email },
                    update: {
                        refreshToken,
                        clientId,
                        status: 'connected',
                        updatedAt: new Date()
                    },
                    create: {
                        userEmail: email,
                        refreshToken,
                        clientId,
                        status: 'connected'
                    }
                });

                imported++;
                process.stdout.write(`\r✓ Processed: ${imported} accounts`);
            } catch (error: any) {
                console.error(`\n✗ Failed to import ${email}:`, error.message);
                skipped++;
            }
        }
    } finally {
        // Prisma Client extensions don't always expose $disconnect on the extended instance in all versions
        // but it's generally good practice if available.
        if ('$disconnect' in prisma) {
            // @ts-ignore
            await prisma.$disconnect();
        }
    }

    console.log(`\n\n✅ Import complete!`);
    console.log(`   Processed: ${imported}`);
    console.log(`   Skipped: ${skipped}\n`);
}

importAccounts().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
