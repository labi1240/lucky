
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing DB connection...');
  try {
    const columns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'outlook_accounts'`;
    console.log('Columns:', columns);

    const testId = 'cm77f3e8b000008ld2z355000'; // Example ID from logs if any
    const firstAccount = await prisma.$queryRaw`SELECT id, user_email, casinos FROM outlook_accounts LIMIT 1`;
    console.log('First account:', firstAccount);

    if (Array.isArray(firstAccount) && firstAccount.length > 0) {
      const id = firstAccount[0].id;
      console.log('Testing update for ID:', id);
      await prisma.$executeRaw`UPDATE outlook_accounts SET casinos = 'test-casino' WHERE id = ${id}`;
      console.log('Update successful');
      
      const refreshed = await prisma.$queryRaw`SELECT casinos FROM outlook_accounts WHERE id = ${id}`;
      console.log('Refreshed casinos:', refreshed);
      
      // Revert
      await prisma.$executeRaw`UPDATE outlook_accounts SET casinos = ${firstAccount[0].casinos || ''} WHERE id = ${id}`;
      console.log('Revert successful');
    }
  } catch (error) {
    console.error('DB Test Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
