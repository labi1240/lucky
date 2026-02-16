
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/web/.env') });

const prisma = new PrismaClient();

async function testToggle() {
    try {
        console.log('Fetching first account...');
        const accounts = await prisma.outlookAccount.findMany({ take: 1 });
        if (accounts.length === 0) {
            console.log('No accounts found');
            return;
        }

        const account = accounts[0];
        console.log(`Testing toggle for account: ${account.userEmail} (ID: ${account.id})`);
        console.log('Current casinos:', account.casinos);

        const casinoName = 'luckydays';
        let casinos = account.casinos ? account.casinos.split(',').filter(c => c.trim() !== '') : [];
        
        if (casinos.includes(casinoName)) {
            casinos = casinos.filter(c => c !== casinoName);
        } else {
            casinos.push(casinoName);
        }

        console.log('Updating casinos to:', casinos.join(','));

        const updated = await prisma.outlookAccount.update({
            where: { id: account.id },
            data: {
                casinos: casinos.join(',')
            }
        });

        console.log('Update successful. New casinos:', updated.casinos);
    } catch (error) {
        console.error('ERROR during testToggle:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testToggle();
