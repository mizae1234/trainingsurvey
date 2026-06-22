import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI client lazily to ensure apiKey is dynamically read if needed
const getGenAI = (apiKey: string) => new GoogleGenerativeAI(apiKey);

export interface DateContext {
  bkkDayName: string;
  bkkDateStr: string;
  bkkTimeStr?: string;
}

/**
 * Ask Gemini a direct text prompt
 */
export async function queryGemini(
  prompt: string,
  apiKey: string,
  model: string,
  temperature: number = 0.7
): Promise<string> {
  try {
    const genAI = getGenAI(apiKey);
    const clientModel = genAI.getGenerativeModel({
      model,
      generationConfig: { temperature }
    });
    const result = await clientModel.generateContent(prompt);
    const response = await result.response;
    return response.text() || '';
  } catch (err) {
    console.error('Error querying Gemini:', err);
    return '';
  }
}

/**
 * Prompts Gemini to translate natural language question into SQL query or direct answer
 */
export async function generateSQLQuery(
  questionText: string,
  sqlBotContext: string,
  dateContext: DateContext,
  apiKey: string,
  model: string,
  historyText?: string
): Promise<string> {
  const analysisPrompt = `
You are a Text-to-SQL translator and Database analyst.
Here is the database reference document (containing schema, connection details, and descriptions of what is NOT in the database):
---
${sqlBotContext}
---

${historyText ? `## ประวัติการถามตอบในแชทนี้ล่าสุด (เพื่อช่วยอ้างอิงบริบทของหัวเรื่องที่กำลังถามต่อเนื่องอยู่):\n${historyText}\n---\n` : ''}

## วันเวลาปัจจุบันของระบบ (สำคัญมากสำหรับใช้คำนวณหรือคิวรีเงื่อนไขเวลา)
- วันนี้คือ: ${dateContext.bkkDayName}
- วันที่ปัจจุบัน (ค.ศ. / AD): ${dateContext.bkkDateStr}
- เวลาปัจจุบัน: ${dateContext.bkkTimeStr || ''}

User Question: "${questionText}"

Tasks:
1. Identify if the user's question asks for information that is NOT in the database (e.g. trainee names, employee IDs, trainer names, phone numbers, branch addresses).
2. If it is NOT in the database, return a response starting with "NOT_IN_DB: " followed by a brief explanation in Thai about what information is missing.
3. If it can be answered using the database:
   - Generate a single, clean PostgreSQL SQL query.
   - The query must use proper double quotes for table names like "SurveyResponse" or "Holiday" since they contain capital letters.
   - Return ONLY the raw SQL query. Do not wrap it in code blocks (markdown blocks \`\`\`sql) or add comments. Just output the query starting with "SELECT".

Output your response now:
`;
  // Low temperature of 0.1 for precise SQL generation
  return queryGemini(analysisPrompt, apiKey, model, 0.1);
}

/**
 * Prompts Gemini to summarize SQL database results in Thai
 */
export async function generateThaiSummary(
  questionText: string,
  sqlQuery: string,
  queryResults: any[],
  dateContext: DateContext,
  apiKey: string,
  model: string,
  historyText?: string
): Promise<string> {
  const summaryPrompt = `
You are a helpful data analyst bot.
The user asked: "${questionText}"
You generated and successfully ran this SQL query: "${sqlQuery}"
The query returned these results from the database:
${JSON.stringify(queryResults, null, 2)}

${historyText ? `## ประวัติการคุยล่าสุดเพื่อประกอบการตอบคำถามต่อเนื่อง:\n${historyText}\n---\n` : ''}

## ข้อมูลวันเวลาสำหรับการสรุปคำตอบ
- วันนี้คือ: ${dateContext.bkkDayName}
- วันที่: ${dateContext.bkkDateStr}

Write a polite, concise, and clear summary response in Thai to answer the user's question based on the database results.
If there are no results, explain it politely. Keep numbers and averages easy to read.
`;
  return queryGemini(summaryPrompt, apiKey, model, 0.7);
}
