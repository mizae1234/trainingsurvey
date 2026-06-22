'use server';

import db from '@/lib/db';
import { cookies } from 'next/headers';
import { askBotEngine } from '@/lib/bot-engine';

const SESSION_COOKIE_NAME = 'admin_session';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * Fetch currently logged in administrator details and role
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    if (session?.value !== 'authenticated') return null;

    const userId = cookieStore.get('admin_user_id')?.value;
    if (!userId) {
      // Fallback admin (logged in via password) gets SUPER_ADMIN in development, but restricted HR_VIEWER in production
      const isDev = process.env.NODE_ENV === 'development';
      return {
        id: 'fallback-admin',
        displayName: 'Fallback Admin',
        pictureUrl: null,
        role: isDev ? 'SUPER_ADMIN' : 'HR_VIEWER',
        lineUserId: 'fallback'
      };
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    });
    return user;
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    return null;
  }
}

/**
 * Handles LINE Login for administrators
 */
export async function loginWithLine(profile: LineProfile) {
  if (!profile.userId) {
    return { success: false, error: 'ไม่พบข้อมูลผู้ใช้งาน LINE' };
  }

  try {
    // 1. Find or create user
    let user = await db.user.findUnique({
      where: { lineUserId: profile.userId }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          lineUserId: profile.userId,
          displayName: profile.displayName || 'LINE User',
          pictureUrl: profile.pictureUrl || null,
          role: 'ADMIN' // Default new web login users to ADMIN
        }
      });
    } else {
      // Update profile info if changed
      user = await db.user.update({
        where: { id: user.id },
        data: {
          displayName: profile.displayName || user.displayName,
          pictureUrl: profile.pictureUrl || user.pictureUrl
        }
      });
    }

    // Promote existing USER to ADMIN to grant instant access for web logins
    if (user.role === 'USER') {
      user = await db.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
      console.log(`Promoted user ${user.displayName} to ADMIN on web login.`);
    }

    // 2. Validate role
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      const cookieStore = await cookies();
      const isProd = process.env.NODE_ENV === 'production';
      cookieStore.set(SESSION_COOKIE_NAME, 'authenticated', {
        httpOnly: true,
        secure: isProd, // True in production (HTTPS), false in development (HTTP)
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      });
      cookieStore.set('admin_user_id', user.id, {
        httpOnly: true,
        secure: isProd, // True in production (HTTPS), false in development (HTTP)
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/'
      });
      return { success: true, role: user.role };
    }

    return { 
      success: false, 
      error: 'คุณไม่มีสิทธิ์ในการเข้าใช้งานหน้าผู้ดูแลระบบ กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์' 
    };

  } catch (error: any) {
    console.error('Error logging in with LINE:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' };
  }
}

/**
 * Fetch all registered LINE users
 */
export async function getLineUsers() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, users: users.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })) };
  } catch (error: any) {
    console.error('Error getting LINE users:', error);
    return { success: false, error: 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้', users: [] };
  }
}

/**
 * Update user role (USER, ADMIN, or SUPER_ADMIN)
 * Restricted to SUPER_ADMIN users
 */
export async function updateUserRole(userId: string, role: string) {
  try {
    if (role !== 'ADMIN' && role !== 'USER' && role !== 'SUPER_ADMIN') {
      return { success: false, error: 'บทบาทไม่ถูกต้อง' };
    }

    const operator = await getCurrentUser();
    if (!operator || operator.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'คุณไม่มีสิทธิ์แก้ไขบทบาทผู้ใช้งาน (ต้องการสิทธิ์ Super Admin)' };
    }

    await db.user.update({
      where: { id: userId },
      data: { role }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'ไม่สามารถแก้ไขสิทธิ์ผู้ใช้งานได้' };
  }
}

/**
 * Fetch all groups the bot is in
 */
export async function getLineGroups() {
  try {
    const groups = await db.group.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, groups: groups.map(g => ({
      ...g,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    })) };
  } catch (error: any) {
    console.error('Error getting LINE groups:', error);
    return { success: false, error: 'ไม่สามารถดึงข้อมูลกลุ่มได้', groups: [] };
  }
}

/**
 * Toggle notifications on/off for a group
 */
export async function toggleGroupNotifications(groupId: string, enabled: boolean) {
  try {
    await db.group.update({
      where: { id: groupId },
      data: { notificationsEnabled: enabled }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling group notifications:', error);
    return { success: false, error: 'ไม่สามารถแก้ไขการแจ้งเตือนของกลุ่มได้' };
  }
}

/**
 * Fetch bot conversation log chats
 * Restricted to SUPER_ADMIN users
 */
export async function getLogChats() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้ (ต้องการสิทธิ์ Super Admin)', logs: [] };
    }

    const logs = await db.logChat.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      logs: logs.map(l => ({
        ...l,
        createdAt: l.createdAt.toISOString()
      }))
    };
  } catch (error: any) {
    console.error('Error getting chat logs:', error);
    return { success: false, error: 'ไม่สามารถดึงข้อมูลประวัติการสนทนาได้', logs: [] };
  }
}

/**
 * Ask the Text-to-SQL bot directly from the Web chat test page
 */
export async function askBotWebAction(userMessage: string) {
  try {
    const operator = await getCurrentUser();
    if (!operator) {
      return { success: false, error: 'กรุณาล็อกอินก่อนใช้งาน' };
    }

    const message = userMessage.trim();
    if (!message) {
      return { success: false, error: 'กรุณาใส่คำถาม' };
    }

    // Fetch web user's conversation history context (last 8 turns in same channel)
    let historyText = '';
    try {
      const historyLogs = await db.logChat.findMany({
        where: { lineUserId: operator.id, lineGroupId: null },
        orderBy: { createdAt: 'desc' },
        take: 8
      });

      historyText = historyLogs
        .reverse()
        .map(log => `User: "${log.question}"\n${log.sqlQuery ? `Generated SQL: ${log.sqlQuery}\n` : ''}Bot: "${log.answer}"`)
        .join('\n');
    } catch (histErr) {
      console.error('Error fetching web chat context history logs:', histErr);
    }

    // Call unified bot engine
    const botRes = await askBotEngine(message, historyText || undefined);

    // Save log inside LogChat DB
    try {
      await db.logChat.create({
        data: {
          lineUserId: operator.id,
          displayName: operator.displayName || 'Web Admin',
          lineGroupId: null,
          groupName: null,
          question: message,
          sqlQuery: botRes.sqlQuery || null,
          sqlError: botRes.sqlError || null,
          answer: botRes.answer,
          status: botRes.status
        }
      });
    } catch (dbErr) {
      console.error('Failed to log web chat in DB:', dbErr);
    }

    return {
      success: true,
      answer: botRes.answer,
      sqlQuery: botRes.sqlQuery || null,
      sqlError: botRes.sqlError || null,
      status: botRes.status
    };
  } catch (error: any) {
    console.error('Error in askBotWebAction:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการตอบคำถาม: ' + error.message };
  }
}

/**
 * Fetch all Buddy Tasks
 * Accessible to ADMIN and SUPER_ADMIN roles
 */
export async function getBuddyTasks() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้', tasks: [] };
    }

    const tasks = await db.buddyTask.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      tasks: tasks.map(t => ({
        ...t,
        createdAt: t.createdAt.toISOString()
      }))
    };
  } catch (error: any) {
    console.error('Error getting buddy tasks:', error);
    return { success: false, error: 'ไม่สามารถดึงข้อมูลงานมอบหมายได้', tasks: [] };
  }
}

/**
 * Mark a Buddy Task as completed
 */
export async function completeBuddyTask(taskId: number) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'กรุณาล็อกอินก่อนดำเนินการ' };
    }

    // Verify task exists
    const task = await db.buddyTask.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return { success: false, error: 'ไม่พบงานมอบหมายดังกล่าว' };
    }

    // Update status to COMPLETED
    await db.buddyTask.update({
      where: { id: taskId },
      data: { status: 'COMPLETED' }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error completing buddy task:', error);
    return { success: false, error: 'ไม่สามารถอัปเดตสถานะงานได้: ' + error.message };
  }
}

