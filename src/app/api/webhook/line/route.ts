import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// Helper to verify LINE signature
function verifySignature(body: string, signature: string, channelSecret: string): boolean {
  if (!signature || !channelSecret) return false;
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

// Helper to reply message via LINE API
async function replyMessage(replyToken: string, text: string, channelAccessToken: string) {
  try {
    const url = 'https://api.line.me/v2/bot/message/reply';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Failed to send LINE reply:', errBody);
    }
  } catch (err) {
    console.error('Error in replyMessage:', err);
  }
}

// Helper to fetch group name if token is available
async function getGroupName(groupId: string, channelAccessToken: string): Promise<string> {
  try {
    const url = `https://api.line.me/v2/bot/group/${groupId}/summary`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.groupName || 'กลุ่มไลน์ (LINE Group)';
    }
  } catch (e) {
    console.error('Could not fetch group name from LINE API:', e);
  }
  return 'กลุ่มไลน์ (LINE Group)';
}

// Helper to ask Gemini to generate SQL or direct response
async function queryGemini(prompt: string, apiKey: string): Promise<string> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1 // Low temperature for precise SQL generation
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return '';
    }

    const resData = await response.json();
    return resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err) {
    console.error('Error querying Gemini:', err);
    return '';
  }
}

// Post route handler for LINE webhook
export async function POST(req: NextRequest) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const readonlyDbUrl = process.env.READONLY_DATABASE_URL || process.env.DATABASE_URL || '';

  const signature = req.headers.get('x-line-signature') || '';
  const bodyText = await req.text();

  // 1. Verify LINE Webhook Signature
  if (channelSecret && !verifySignature(bodyText, signature, channelSecret)) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let events: any[] = [];
  try {
    const payload = JSON.parse(bodyText);
    events = payload.events || [];
  } catch (err) {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  for (const event of events) {
    // 2. Track Bot Joining Groups
    if (event.type === 'join' || event.type === 'memberJoined') {
      const source = event.source || {};
      if (source.type === 'group' && source.groupId) {
        const groupName = await getGroupName(source.groupId, channelAccessToken);
        try {
          await db.group.upsert({
            where: { lineGroupId: source.groupId },
            update: { groupName },
            create: {
              lineGroupId: source.groupId,
              groupName,
              notificationsEnabled: true
            }
          });
          console.log(`Bot joined group: ${groupName} (${source.groupId})`);
        } catch (dbErr) {
          console.error('Failed to save group details in DB:', dbErr);
        }
      }
    }

    // 3. Track Bot Leaving Groups
    if (event.type === 'leave' || event.type === 'memberLeft') {
      const source = event.source || {};
      if (source.type === 'group' && source.groupId) {
        try {
          // Instead of hard deleting, we disable notifications or delete
          await db.group.deleteMany({
            where: { lineGroupId: source.groupId }
          });
          console.log(`Bot left group: ${source.groupId}`);
        } catch (dbErr) {
          console.error('Failed to remove group details from DB:', dbErr);
        }
      }
    }

    // 4. Handle Incoming Messages (Text-to-SQL bot logic)
    if (event.type === 'message' && event.message?.type === 'text') {
      const userText = event.message.text.trim();
      const replyToken = event.replyToken;

      if (!replyToken) continue;

      // We read our prompt rules and schema definition from sql_bot.md
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
        await replyMessage(replyToken, 'ระบบขัดข้อง: ไม่พบคำอธิบายโครงสร้างฐานข้อมูล (sql_bot.md)', channelAccessToken);
        continue;
      }

      // Instruct Gemini to evaluate if the query can be answered, or if it asks for non-existent information
      const analysisPrompt = `
You are a Text-to-SQL translator and Database analyst.
Here is the database reference document (containing schema, connection details, and descriptions of what is NOT in the database):
---
${sqlBotContext}
---

User Question: "${userText}"

Tasks:
1. Identify if the user's question asks for information that is NOT in the database (e.g. trainee names, employee IDs, trainer names, phone numbers, branch addresses).
2. If it is NOT in the database, return a response starting with "NOT_IN_DB: " followed by a brief explanation in Thai about what information is missing.
3. If it can be answered using the database:
   - Generate a single, clean PostgreSQL SQL query.
   - The query must use proper double quotes for table names like "SurveyResponse" or "Holiday" since they contain capital letters.
   - Return ONLY the raw SQL query. Do not wrap it in code blocks (markdown blocks \`\`\`sql) or add comments. Just output the query starting with "SELECT".

Output your response now:
`;

      const geminiResponse = await queryGemini(analysisPrompt, geminiKey);
      const cleanResponse = geminiResponse.trim();

      if (!cleanResponse) {
        await replyMessage(replyToken, 'ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผลคำถาม', channelAccessToken);
        continue;
      }

      // Check if it's NOT in the database
      if (cleanResponse.startsWith('NOT_IN_DB:')) {
        const explanation = cleanResponse.replace('NOT_IN_DB:', '').trim();
        await replyMessage(replyToken, explanation, channelAccessToken);
        continue;
      }

      // If it generated a SQL query, execute it
      if (cleanResponse.toUpperCase().startsWith('SELECT')) {
        console.log('Executing generated SQL query:', cleanResponse);
        
        const pgClient = new Client({
          connectionString: readonlyDbUrl,
          ssl: false
        });

        let queryResults = null;
        let queryError = null;

        try {
          await pgClient.connect();
          const dbRes = await pgClient.query(cleanResponse);
          queryResults = dbRes.rows;
        } catch (dbErr: any) {
          queryError = dbErr.message;
          console.error('Failed to execute generated SQL:', dbErr);
        } finally {
          await pgClient.end();
        }

        if (queryError) {
          await replyMessage(
            replyToken,
            `ขออภัยครับ เกิดข้อผิดพลาดในระบบฐานข้อมูลตอนประมวลผลคำถาม\n(Error: ${queryError})`,
            channelAccessToken
          );
          continue;
        }

        // Send results back to Gemini to write a natural summary response in Thai
        const summaryPrompt = `
You are a helpful data analyst bot.
The user asked: "${userText}"
You generated and successfully ran this SQL query: "${cleanResponse}"
The query returned these results from the database:
${JSON.stringify(queryResults, null, 2)}

Write a polite, concise, and clear summary response in Thai to answer the user's question based on the database results.
If there are no results, explain it politely. Keep numbers and averages easy to read.
`;

        const finalAnswer = await queryGemini(summaryPrompt, geminiKey);
        await replyMessage(replyToken, finalAnswer.trim() || 'คิวรีข้อมูลสำเร็จ แต่ไม่สามารถแปลคำตอบได้', channelAccessToken);
      } else {
        // Fallback message
        await replyMessage(replyToken, 'ขออภัยครับ ผมยังไม่เข้าใจคำถามนี้ หรือหัวข้อนี้ไม่มีข้อมูลรองรับในฐานข้อมูล', channelAccessToken);
      }
    }
  }

  return new NextResponse('OK', { status: 200 });
}
