import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { generateSQLQuery, generateThaiSummary } from '@/lib/gemini';

export interface BotResponse {
  answer: string;
  sqlQuery?: string | null;
  sqlError?: string | null;
  status: 'SUCCESS' | 'ERROR' | 'NOT_IN_DB';
}

/**
 * Core Text-to-SQL engine that runs queries and translates results to Thai
 */
export async function askBotEngine(
  questionText: string,
  historyText?: string
): Promise<BotResponse> {
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const readonlyDbUrl = process.env.READONLY_DATABASE_URL || process.env.DATABASE_URL || '';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

  // 1. Read sql_bot.md for DB structure context
  let sqlBotContext = '';
  try {
    const sqlBotMdPath = path.join(process.cwd(), 'sql_bot.md');
    if (fs.existsSync(sqlBotMdPath)) {
      sqlBotContext = fs.readFileSync(sqlBotMdPath, 'utf-8');
    }
  } catch (err) {
    console.error('Could not read sql_bot.md:', err);
  }

  if (!sqlBotContext) {
    return {
      answer: 'ระบบขัดข้อง: ไม่พบคำอธิบายโครงสร้างฐานข้อมูล (sql_bot.md)',
      status: 'ERROR'
    };
  }

  // 2. Prepare date-time context in Bangkok Timezone
  const now = new Date();
  const bkkDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  
  const bkkDayName = new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    weekday: 'long'
  }).format(now);

  const bkkTimeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);

  const dateContext = { bkkDayName, bkkDateStr, bkkTimeStr };

  // 3. Ask Gemini to analyze question and generate SQL (or identify if NOT in DB)
  const geminiResponse = await generateSQLQuery(
    questionText, 
    sqlBotContext, 
    dateContext, 
    geminiKey, 
    geminiModel, 
    historyText
  );
  const cleanResponse = geminiResponse.trim();

  if (!cleanResponse) {
    return {
      answer: 'ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผลคำถาม',
      status: 'ERROR'
    };
  }

  // 4. Handle NOT_IN_DB case
  if (cleanResponse.startsWith('NOT_IN_DB:')) {
    const explanation = cleanResponse.replace('NOT_IN_DB:', '').trim();
    return {
      answer: explanation,
      status: 'NOT_IN_DB'
    };
  }

  // 5. Handle SELECT SQL query execution
  if (cleanResponse.toUpperCase().startsWith('SELECT')) {
    console.log('Bot Engine Executing SQL Query:', cleanResponse);
    
    const pgClient = new Client({
      connectionString: readonlyDbUrl,
      ssl: false
    });

    let queryResults: any[] = [];
    let queryError = null;

    try {
      await pgClient.connect();
      const dbRes = await pgClient.query(cleanResponse);
      queryResults = dbRes.rows;
    } catch (dbErr: any) {
      queryError = dbErr.message;
      console.error('Bot Engine Database Query Error:', dbErr);
    } finally {
      await pgClient.end();
    }

    if (queryError) {
      return {
        answer: `ขออภัยครับ เกิดข้อผิดพลาดในระบบฐานข้อมูลตอนประมวลผลคำถาม\n(Error: ${queryError})`,
        sqlQuery: cleanResponse,
        sqlError: queryError,
        status: 'ERROR'
      };
    }

    // Ask Gemini to summarize database results in Thai
    const finalAnswer = await generateThaiSummary(
      questionText, 
      cleanResponse, 
      queryResults, 
      dateContext, 
      geminiKey, 
      geminiModel, 
      historyText
    );
    const trimmedAnswer = finalAnswer.trim() || 'คิวรีข้อมูลสำเร็จ แต่ไม่สามารถแปลคำตอบได้';

    return {
      answer: trimmedAnswer,
      sqlQuery: cleanResponse,
      status: 'SUCCESS'
    };
  }

  // 6. Fallback (If Gemini returns a direct conversational response, use it)
  return {
    answer: cleanResponse,
    status: 'NOT_IN_DB'
  };
}
