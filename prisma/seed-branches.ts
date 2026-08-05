import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import XLSX from 'xlsx';
import path from 'path';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Read Excel file
    const filePath = path.resolve(process.cwd(), 'Restaurant Lists - TH.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json<{ Code: number | string; Name: string }>(sheet);

    const branches = rawData
      .filter((row) => row.Code && row.Name)
      .map((row) => ({
        code: String(row.Code).replace(/\.00$/, '').trim(),
        name: String(row.Name).trim(),
      }));

    console.log(`📋 Found ${branches.length} branches in Excel file`);

    // Upsert each branch
    let created = 0;
    let updated = 0;

    for (const branch of branches) {
      const existing = await prisma.branch.findUnique({
        where: { code: branch.code },
      });

      if (existing) {
        await prisma.branch.update({
          where: { code: branch.code },
          data: { name: branch.name },
        });
        updated++;
      } else {
        await prisma.branch.create({
          data: branch,
        });
        created++;
      }
    }

    console.log(`✅ Seed completed: ${created} created, ${updated} updated`);
  } catch (error) {
    console.error('❌ Error seeding branches:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
