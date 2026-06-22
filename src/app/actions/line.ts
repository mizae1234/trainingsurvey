'use server';

import db from '@/lib/db';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'admin_session';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
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
      // First user registered can optionally be admin, or all default to USER
      // Let's check if there are any admins in the system.
      // If no admins exist, we can make the first user an ADMIN to make setup easy.
      const adminCount = await db.user.count({
        where: { role: 'ADMIN' }
      });

      user = await db.user.create({
        data: {
          lineUserId: profile.userId,
          displayName: profile.displayName || 'LINE User',
          pictureUrl: profile.pictureUrl || null,
          role: adminCount === 0 ? 'ADMIN' : 'USER' // Auto-promote first user
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

    // 2. Validate role
    if (user.role === 'ADMIN') {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, 'authenticated', {
        httpOnly: true,
        secure: true, // We now have HTTPS set up successfully!
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
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
 * Update user role (ADMIN or USER)
 */
export async function updateUserRole(userId: string, role: string) {
  try {
    if (role !== 'ADMIN' && role !== 'USER') {
      return { success: false, error: 'บทบาทไม่ถูกต้อง' };
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
