'use server';

import db from '@/lib/db';
import { headers } from 'next/headers';
import { checkAdminAuth } from '@/app/actions/admin';
import { getCurrentUser } from '@/app/actions/line';

export interface OfficeSurveyInput {
  q1_liked: string;
  q2_improve: string;
  q3_additions: string;
  q4_priority: string;
  q5_suggestions?: string;
  userAgent?: string;
  bypassDeadline?: boolean;
}

/**
 * Check if the survey is currently past the 16:30 cutoff in Asia/Bangkok time
 */
export async function checkOfficeSurveyStatus(): Promise<{
  isClosed: boolean;
  closingTimeStr: string;
  currentBangkokTimeStr: string;
}> {
  const now = new Date();
  const bangkokDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  
  const hours = bangkokDate.getHours();
  const minutes = bangkokDate.getMinutes();
  
  const isClosed = (hours > 16 || (hours === 16 && minutes >= 30));
  
  const formattedCurrentTime = bangkokDate.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return {
    isClosed,
    closingTimeStr: '16:30 น.',
    currentBangkokTimeStr: `${formattedCurrentTime} น.`,
  };
}

/**
 * Submit an anonymous survey response
 */
export async function submitOfficeSurvey(data: OfficeSurveyInput) {
  try {
    // 1. Check deadline unless bypassed
    const status = await checkOfficeSurveyStatus();
    if (status.isClosed && !data.bypassDeadline) {
      return {
        success: false,
        error: 'ขออภัยค่ะ ระบบปิดรับความคิดเห็นสำหรับวันนี้แล้วเมื่อเวลา 16:30 น.',
        isClosed: true,
      };
    }

    // 2. Validate required fields (q1 to q4)
    const q1 = data.q1_liked ? data.q1_liked.trim() : '';
    const q2 = data.q2_improve ? data.q2_improve.trim() : '';
    const q3 = data.q3_additions ? data.q3_additions.trim() : '';
    const q4 = data.q4_priority ? data.q4_priority.trim() : '';
    const q5 = data.q5_suggestions ? data.q5_suggestions.trim() : null;

    if (!q1) {
      return { success: false, error: 'กรุณากรอกข้อ 1: สิ่งที่ชอบและอยากให้คงไว้' };
    }
    if (!q2) {
      return { success: false, error: 'กรุณากรอกข้อ 2: สิ่งที่อยากให้ปรับปรุงหรือแก้ไข' };
    }
    if (!q3) {
      return { success: false, error: 'กรุณากรอกข้อ 3: สิ่งที่อยากให้มีเพิ่มเข้ามา' };
    }
    if (!q4) {
      return { success: false, error: 'กรุณากรอกข้อ 4: เรื่องที่อยากให้เปลี่ยนเป็นอันดับแรก' };
    }

    // 3. Client metadata
    let ipAddress = 'unknown';
    let userAgent = data.userAgent || 'unknown';

    try {
      const headersList = await headers();
      ipAddress =
        headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') ||
        'unknown';
      if (!data.userAgent) {
        userAgent = headersList.get('user-agent') || 'unknown';
      }
    } catch {
      // Standalone execution or non-request context fallback
    }

    // 4. Save to database safely
    const record = await db.officeSurveyResponse.create({
      data: {
        q1_liked: q1,
        q2_improve: q2,
        q3_additions: q3,
        q4_priority: q4,
        q5_suggestions: q5 || null,
        ipAddress,
        userAgent,
      },
    });

    return {
      success: true,
      id: record.id,
      createdAt: record.createdAt.toISOString(),
    };
  } catch (error: any) {
    console.error('Error submitting office survey:', error);
    return {
      success: false,
      error: error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง',
    };
  }
}

/**
 * Fetch all office survey responses (Admin only)
 */
export async function getOfficeSurveySubmissions() {
  try {
    const isAuthed = await checkAdminAuth();
    const user = await getCurrentUser();

    if (!isAuthed && !user) {
      return { success: false, error: 'Unauthorized', submissions: [] };
    }

    const submissions = await db.officeSurveyResponse.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      submissions: submissions.map(sub => ({
        ...sub,
        createdAt: sub.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error('Error fetching office survey submissions:', error);
    return { success: false, error: error?.message, submissions: [] };
  }
}

/**
 * Delete a submission (Admin only, e.g. for spam/tests)
 */
export async function deleteOfficeSurveySubmission(id: string) {
  try {
    const isAuthed = await checkAdminAuth();
    const user = await getCurrentUser();

    if (!isAuthed && !user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.officeSurveyResponse.delete({
      where: { id },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting office survey submission:', error);
    return { success: false, error: error?.message };
  }
}
