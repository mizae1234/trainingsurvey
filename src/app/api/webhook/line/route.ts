import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifySignature, replyMessage, getGroupName, createTextMessage, getUserProfile, createStatsFlexMessage, createTaskFlexMessage } from '@/lib/line';
import { askBotEngine } from '@/lib/bot-engine';

// Helper to save conversation logs
async function writeChatLog({
  lineUserId,
  displayName,
  lineGroupId,
  groupName,
  question,
  sqlQuery,
  sqlError,
  answer,
  status
}: {
  lineUserId: string;
  displayName?: string | null;
  lineGroupId?: string | null;
  groupName?: string | null;
  question: string;
  sqlQuery?: string | null;
  sqlError?: string | null;
  answer: string;
  status: string;
}) {
  try {
    await db.logChat.create({
      data: {
        lineUserId,
        displayName,
        lineGroupId,
        groupName,
        question,
        sqlQuery,
        sqlError,
        answer,
        status
      }
    });
  } catch (err) {
    console.error('Failed to write LogChat:', err);
  }
}

// Post route handler for LINE webhook
export async function POST(req: NextRequest) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

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
      const source = event.source || {};

      if (!replyToken) continue;

      // Handle Trigger Name logic:
      // - In Group Chat: must start with "buddy" or "บัดดี้"
      // - In Private Chat: trigger not required, but strip if present
      let questionText = userText;
      const triggerRegex = /^(buddy|บัดดี้)\s*,?\s*(.*)$/i;
      const match = userText.match(triggerRegex);

      if (source.type === 'group' || source.type === 'room') {
        if (!match) {
          // If in a group chat and does not mention "buddy" or "บัดดี้" as prefix, ignore it
          continue;
        }
        // Extract the actual question following the trigger name
        questionText = match[2].trim();
      } else {
        // In private chat: if they start with the trigger, strip it. Otherwise use the whole text.
        if (match) {
          questionText = match[2].trim();
        }
      }

      // Fetch User's display name and Group's name for logs
      let displayName: string | null = null;
      let groupName: string | null = null;

      try {
        if (source.userId) {
          let user = await db.user.findUnique({
            where: { lineUserId: source.userId }
          });
          
          if (!user) {
            // Automatically register new LINE user interacting with the bot
            const lineProfile = await getUserProfile(source.userId, channelAccessToken);
            const lineName = lineProfile?.displayName || 'LINE User';
            const pictureUrl = lineProfile?.pictureUrl || null;
            
            user = await db.user.create({
              data: {
                lineUserId: source.userId,
                displayName: lineName,
                pictureUrl,
                role: 'USER'
              }
            });
            console.log(`Auto-registered new user: ${lineName} (${source.userId})`);
          }
          displayName = user.displayName;
        }
        
        if (source.groupId) {
          let group = await db.group.findUnique({
            where: { lineGroupId: source.groupId }
          });
          
          if (!group) {
            // Auto-register missing group when message is received
            const fetchedName = await getGroupName(source.groupId, channelAccessToken);
            group = await db.group.create({
              data: {
                lineGroupId: source.groupId,
                groupName: fetchedName,
                notificationsEnabled: true
              }
            });
            console.log(`Auto-registered missing group on message: ${fetchedName} (${source.groupId})`);
          }
          groupName = group.groupName;
        }
      } catch (dbErr) {
        console.error('Error auto-registering user or fetching names for LogChat:', dbErr);
      }

      // If the question is empty (e.g. they just said "buddy" / "บัดดี้")
      if (!questionText) {
        const welcomeMsg = 'สวัสดีครับผม บัดดี้ (Buddy) ผู้ช่วยอัจฉริยะที่จะช่วยรายงานข้อมูลสถิติและผลคะแนนประเมินการฝึกหน้าร้านครับ 📊✨\n\nสามารถสอบถามข้อมูลที่ต้องการได้เลยครับ (เช่น "ขอคะแนนเฉลี่ยภาพรวมทั้งหมด" หรือ "สรุปสถิติคะแนนของสาขาบางนา") 💛';
        await replyMessage(replyToken, createTextMessage(welcomeMsg), channelAccessToken);
        
        await writeChatLog({
          lineUserId: source.userId || 'unknown',
          displayName,
          lineGroupId: source.groupId,
          groupName,
          question: userText,
          answer: welcomeMsg,
          status: 'NOT_IN_DB'
        });
        continue;
      }

      // Special Keyword Check: "ลงทะเบียน" or "register"
      if (questionText.trim() === 'ลงทะเบียน' || questionText.trim().toLowerCase() === 'register') {
        const regMsg = 'ลงทะเบียนสิทธิ์ใช้งานขั้นต้นสำเร็จแล้วครับ! 🎉\n\nบัดดี้ได้เพิ่มประวัติผู้ใช้งานของคุณในระบบเรียบร้อยแล้ว (สิทธิ์ระดับ USER) ในกรณีที่คุณต้องการเข้าใช้งานหน้าเว็บผู้ดูแลระบบ กรุณาติดต่อผู้ดูแลระบบหลักเพื่อปรับระดับสิทธิ์การเข้าใช้งานครับ 💛';
        await replyMessage(replyToken, createTextMessage(regMsg), channelAccessToken);

        await writeChatLog({
          lineUserId: source.userId || 'unknown',
          displayName,
          lineGroupId: source.groupId,
          groupName,
          question: questionText,
          answer: regMsg,
          status: 'NOT_IN_DB'
        });
        continue;
      }

      // Check if it matches "note : <content>" (case insensitive)
      const noteMatch = questionText.match(/^note\s*:\s*(.*)$/i);
      if (noteMatch) {
        const noteContent = noteMatch[1].trim();
        
        // Extract assignee (e.g. @name)
        const assigneeMatch = noteContent.match(/@(\S+)/);
        const assignee = assigneeMatch ? `@${assigneeMatch[1]}` : null;
        
        try {
          // Create BuddyTask in DB
          const createdTask = await db.buddyTask.create({
            data: {
              lineUserId: source.userId || 'unknown',
              displayName,
              lineGroupId: source.groupId || null,
              groupName,
              assignee,
              description: noteContent,
              status: 'PENDING'
            }
          });

          // Generate Flex Card response
          const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '';
          const flexMsg = createTaskFlexMessage({
            id: createdTask.id,
            assignee: createdTask.assignee,
            description: createdTask.description,
            displayName: createdTask.displayName
          }, liffId);

          // Reply back to LINE
          await replyMessage(replyToken, flexMsg, channelAccessToken);

          // Save log inside LogChat DB
          await writeChatLog({
            lineUserId: source.userId || 'unknown',
            displayName,
            lineGroupId: source.groupId,
            groupName,
            question: userText,
            answer: `บันทึกงานมอบหมายสำเร็จ หมายเลข #${createdTask.id}`,
            status: 'TASK_ASSIGNED'
          });
          
          continue;
        } catch (taskErr: any) {
          console.error('Error creating buddy task:', taskErr);
          const errorReply = 'ขออภัยครับ ไม่สามารถบันทึกงานมอบหมายได้ในขณะนี้';
          await replyMessage(replyToken, createTextMessage(errorReply), channelAccessToken);
          continue;
        }
      }


      // Fetch conversation history context (last 8 turns in same channel)
      let historyText = '';
      try {
        if (source.userId) {
          const historyLogs = await db.logChat.findMany({
            where: source.groupId
              ? { lineGroupId: source.groupId }
              : { lineUserId: source.userId, lineGroupId: null },
            orderBy: { createdAt: 'desc' },
            take: 8
          });

          historyText = historyLogs
            .reverse()
            .map(log => `User: "${log.question}"\n${log.sqlQuery ? `Generated SQL: ${log.sqlQuery}\n` : ''}Bot: "${log.answer}"`)
            .join('\n');
        }
      } catch (histErr) {
        console.error('Error fetching context history logs:', histErr);
      }

      // Call unified bot engine
      const botRes = await askBotEngine(questionText, historyText || undefined);

      let replyPayload: any = createTextMessage(botRes.answer);
      
      // Append beautiful Flex Card if it's a successful database statistics query
      if (botRes.status === 'SUCCESS' && process.env.NEXT_PUBLIC_LIFF_ID) {
        try {
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const todayCount = await db.surveyResponse.count({
            where: {
              createdAt: {
                gte: startOfToday
              }
            }
          });
          const totalCount = await db.surveyResponse.count();
          
          const flexMsg = createStatsFlexMessage(todayCount, totalCount, process.env.NEXT_PUBLIC_LIFF_ID);
          replyPayload = [replyPayload, flexMsg];
        } catch (flexErr) {
          console.error('Error generating Flex Message:', flexErr);
        }
      }

      // Reply back to LINE
      await replyMessage(replyToken, replyPayload, channelAccessToken);

      // Save log inside LogChat DB
      await writeChatLog({
        lineUserId: source.userId || 'unknown',
        displayName,
        lineGroupId: source.groupId,
        groupName,
        question: questionText,
        sqlQuery: botRes.sqlQuery || null,
        sqlError: botRes.sqlError || null,
        answer: botRes.answer,
        status: botRes.status
      });
    }
  }

  return new NextResponse('OK', { status: 200 });
}
