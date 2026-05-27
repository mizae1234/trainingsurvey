'use server';

import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'admin_session';

export async function adminLogin(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Default fallback

  if (password === adminPassword) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });
    return { success: true };
  }

  return { success: false, error: 'รหัสผ่านไม่ถูกต้อง' };
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { success: true };
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value === 'authenticated';
}
