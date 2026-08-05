'use server';

import db from '@/lib/db';
import { r2Client } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { headers } from 'next/headers';

export async function submitMotherDay(formData: FormData) {
  try {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const nickname = formData.get('nickname') as string;
    const position = formData.get('position') as string;
    const branch = formData.get('branch') as string;
    const file = formData.get('file') as File;

    if (!firstName || !lastName || !nickname || !position || !branch || !file) {
      return { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วนและอัปโหลดรูปภาพ' };
    }

    // Clean inputs
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanNickname = nickname.trim();
    const cleanPosition = position.trim();
    const cleanBranch = branch.trim();

    // 1. Check if already submitted in DB
    const existing = await db.motherDayActivity.findUnique({
      where: {
        firstName_lastName: {
          firstName: cleanFirstName,
          lastName: cleanLastName
        }
      }
    });

    if (existing) {
      return { 
        success: false, 
        error: 'คุณได้อัปโหลดรูปภาพเข้าร่วมกิจกรรมเรียบร้อยแล้ว (จำกัดสิทธิ์ 1 คนต่อ 1 รูปภาพ)' 
      };
    }

    // 2. Prepare file name
    const originalName = file.name || 'image.jpg';
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Format name: ชื่อ_นามสกุล
    const fileName = `${cleanFirstName}_${cleanLastName}.${fileExtension}`;
    const key = `motherday/${fileName}`;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Upload to R2
    const bucketName = process.env.R2_BUCKET_NAME || 'mckpi';
    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
      })
    );

    // Construct public image URL
    const publicUrl = process.env.R2_PUBLIC_URL || `https://pub-f0b1b293775a40b4a00275996c3ebf10.r2.dev`;
    const imageUrl = `${publicUrl}/${key}`;

    // Get client metadata
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
      || headersList.get('x-real-ip')
      || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // 4. Save to database
    const newSubmission = await db.motherDayActivity.create({
      data: {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        nickname: cleanNickname,
        position: cleanPosition,
        branch: cleanBranch,
        imageUrl,
        ipAddress,
        userAgent,
      }
    });

    return { 
      success: true, 
      data: {
        id: newSubmission.id,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        nickname: cleanNickname,
        position: cleanPosition,
        branch: cleanBranch,
        imageUrl
      }
    };

  } catch (error: any) {
    console.error('Error submitting Mother\'s Day photo:', error);
    return { 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลและอัปโหลดรูปภาพ' 
    };
  }
}

export async function getMotherDaySubmissions() {
  try {
    const submissions = await db.motherDayActivity.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, submissions };
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return { success: false, error: error.message || 'ไม่สามารถดึงข้อมูลได้' };
  }
}
