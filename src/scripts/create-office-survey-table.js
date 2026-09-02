const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

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

let databaseUrl = dbUrlLine.replace('DATABASE_URL=', '').trim();
if ((databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) || 
    (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))) {
  databaseUrl = databaseUrl.slice(1, -1);
}

console.log('Connecting to PostgreSQL database...');
const pool = new Pool({ connectionString: databaseUrl });

async function initOfficeSurveyTable() {
  try {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS "OfficeSurveyResponse" (
        "id" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "q1_liked" TEXT NOT NULL,
        "q2_improve" TEXT NOT NULL,
        "q3_additions" TEXT NOT NULL,
        "q4_priority" TEXT NOT NULL,
        "q5_suggestions" TEXT,

        CONSTRAINT "OfficeSurveyResponse_pkey" PRIMARY KEY ("id")
      );
    `;

    console.log('Running safe CREATE TABLE IF NOT EXISTS...');
    await pool.query(createTableSql);
    console.log('Table "OfficeSurveyResponse" created or verified successfully!');

    // Check all tables in public schema
    const checkRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Current existing public tables in DB:');
    checkRes.rows.forEach(r => console.log(' -', r.table_name));

  } catch (error) {
    console.error('Failed to create table:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initOfficeSurveyTable();
