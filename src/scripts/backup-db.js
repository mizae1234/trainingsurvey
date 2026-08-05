const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Read .env file manually
const envPath = path.join(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));

if (!dbUrlLine) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

// Clean and extract URL
let databaseUrl = dbUrlLine.replace('DATABASE_URL=', '').trim();
if ((databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) || 
    (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))) {
  databaseUrl = databaseUrl.slice(1, -1);
}

console.log('Connecting to database...');
const pool = new Pool({ connectionString: databaseUrl });

async function backupDatabase() {
  try {
    // 1. Get all public tables
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tables = tableRes.rows.map(r => r.table_name);
    const backupData = {
      timestamp: new Date().toISOString(),
      database: 'tn_survey',
      tables: {}
    };

    console.log('Starting backup...');
    for (const table of tables) {
      if (table === '_prisma_migrations') {
        console.log(`Skipping migration metadata table: ${table}`);
        continue;
      }
      try {
        console.log(`Backing up table: ${table}...`);
        const rowsRes = await pool.query(`SELECT * FROM "${table}"`);
        backupData.tables[table] = rowsRes.rows;
      } catch (e) {
        console.warn(`Warning: Could not back up table ${table}:`, e.message);
      }
    }

    const backupFilePath = path.join(__dirname, '../../db_backup.json');
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`\n🎉 Backup successful! Saved to: ${backupFilePath}`);
    console.log(`Summary of backed up records:`);
    Object.keys(backupData.tables).forEach(tbl => {
      console.log(`- ${tbl}: ${backupData.tables[tbl].length} rows`);
    });
    console.log('\nKeep this file safe as a restore point.');

  } catch (error) {
    console.error('Failed to backup database:', error);
  } finally {
    await pool.end();
  }
}

backupDatabase();
