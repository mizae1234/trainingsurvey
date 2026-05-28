'use server';

import db from '@/lib/db';
import { headers } from 'next/headers';

// Helper function to calculate active working days (excluding weekends and holidays)
function calculateDuration(start: Date, end: Date, holidayDates: Set<string>) {
  if (end < start) return 0;
  
  let workingDays = 0;
  let current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;
    
    const isHoliday = holidayDates.has(dateKey);
    
    if (!isWeekend && !isHoliday) {
      workingDays++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

export async function submitSurvey(data: any) {
  try {
    // Basic validation
    if (!data.department || !data.branch1 || !data.branch2) {
      return { success: false, error: 'กรุณากรอกข้อมูลและเลือกสาขาให้ครบถ้วน' };
    }

    // Capture client metadata
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
      || headersList.get('x-real-ip')
      || 'unknown';
    const userAgent = data.userAgent || headersList.get('user-agent') || 'unknown';

    // Fetch holidays to verify duration
    const holidays = await db.holiday.findMany();
    const holidayDatesSet = new Set(holidays.map(h => {
      const d = new Date(h.date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }));

    const b1Start = new Date(data.branch1TrainingStart);
    const b1End = new Date(data.branch1TrainingEnd);
    const b2Start = new Date(data.branch2TrainingStart);
    const b2End = new Date(data.branch2TrainingEnd);

    const parsedData = {
      ipAddress,
      userAgent,
      department: data.department,
      branch1: data.branch1,
      branch1TrainingStart: b1Start,
      branch1TrainingEnd: b1End,
      branch1Duration: calculateDuration(b1Start, b1End, holidayDatesSet),
      
      branch2: data.branch2,
      branch2TrainingStart: b2Start,
      branch2TrainingEnd: b2End,
      branch2Duration: calculateDuration(b2Start, b2End, holidayDatesSet),
      
      q1_benefit: parseInt(data.q1_benefit) || 4,
      q2_apply_knowledge: parseInt(data.q2_apply_knowledge) || 4,
      q3_consistency: parseInt(data.q3_consistency) || 4,
      
      q4_1_duration_suitability: data.q4_1_duration_suitability || 'มีความเหมาะสม',
      q4_2_branches_suitability: data.q4_2_branches_suitability || 'มีความเหมาะสม',
      
      q5_clarity_branch1: parseInt(data.q5_clarity_branch1) || 4,
      q5_clarity_branch2: parseInt(data.q5_clarity_branch2) || 4,
      
      q6_volume_branch1: parseInt(data.q6_volume_branch1) || 4,
      q6_volume_branch2: parseInt(data.q6_volume_branch2) || 4,
      
      q7_readiness_branch1: parseInt(data.q7_readiness_branch1) || 4,
      q7_readiness_branch2: parseInt(data.q7_readiness_branch2) || 4,
      
      q8_trainer_knowledge_branch1: parseInt(data.q8_trainer_knowledge_branch1) || 4,
      q8_trainer_knowledge_branch2: parseInt(data.q8_trainer_knowledge_branch2) || 4,
      
      q9_safety_hygiene_branch1: parseInt(data.q9_safety_hygiene_branch1) || 4,
      q9_safety_hygiene_branch2: parseInt(data.q9_safety_hygiene_branch2) || 4,
      
      q10_trainer_care_branch1: parseInt(data.q10_trainer_care_branch1) || 4,
      q10_trainer_care_branch2: parseInt(data.q10_trainer_care_branch2) || 4,
      
      q11_atmosphere_branch1: parseInt(data.q11_atmosphere_branch1) || 4,
      q11_atmosphere_branch2: parseInt(data.q11_atmosphere_branch2) || 4,
      
      feedback12_challenging: data.feedback12_challenging || '',
      feedback13_ideal_setup: data.feedback13_ideal_setup || '',
      feedback14_impressions: data.feedback14_impressions || '',
      feedback15_suggestions: data.feedback15_suggestions || '',
    };
    
    const response = await db.surveyResponse.create({
      data: parsedData,
    });
    
    return { success: true, id: response.id };
  } catch (error: any) {
    console.error('Error submitting survey:', error);
    return { success: false, error: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}

export async function getHolidays() {
  try {
    const holidays = await db.holiday.findMany({
      orderBy: { date: 'asc' }
    });
    return {
      success: true,
      holidays: holidays.map(h => ({
        date: h.date.toISOString(),
        name: h.name
      }))
    };
  } catch (error: any) {
    console.error('Error fetching holidays:', error);
    return { success: false, holidays: [] };
  }
}

const HOLIDAYS_2026 = [
  { date: new Date('2026-01-01T00:00:00Z'), name: "วันขึ้นปีใหม่ (New Year's Day)" },
  { date: new Date('2026-04-06T00:00:00Z'), name: "วันจักรี (Chakri Day)" },
  { date: new Date('2026-04-13T00:00:00Z'), name: "วันสงกรานต์ (Songkran Day)" },
  { date: new Date('2026-04-14T00:00:00Z'), name: "วันสงกรานต์ (Songkran Day)" },
  { date: new Date('2026-05-01T00:00:00Z'), name: "วันแรงงานแห่งชาติ (National Labor Day)" },
  { date: new Date('2026-05-04T00:00:00Z'), name: "วันฉัตรมงคล (Coronation Day)" },
  { date: new Date('2026-06-03T00:00:00Z'), name: "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดาฯ (H.M. Queen Suthida's Birthday)" },
  { date: new Date('2026-07-28T00:00:00Z'), name: "วันเฉลิมพระชนมพรรษาสมเด็จพระเจ้าอยู่หัวฯ (H.M. King Rama 10's Birthday)" },
  { date: new Date('2026-08-12T00:00:00Z'), name: "วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ (H.M. Queen Sirikit's Birthday / Mother's Day)" },
  { date: new Date('2026-10-13T00:00:00Z'), name: "วันคล้ายวันสวรรคต ร.9 (King Bhumibol Memorial Day)" },
  { date: new Date('2026-10-23T00:00:00Z'), name: "วันปิยมหาราช (Chulalongkorn Day)" },
  { date: new Date('2026-12-07T00:00:00Z'), name: "ชดเชยวันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ (Substitution for Father's Day)" },
  { date: new Date('2026-12-31T00:00:00Z'), name: "วันสิ้นปี (New Year's Eve)" }
];

export async function seedHolidays() {
  try {
    const results = [];
    for (const h of HOLIDAYS_2026) {
      const res = await db.holiday.upsert({
        where: { date: h.date },
        update: { name: h.name },
        create: { date: h.date, name: h.name }
      });
      results.push(res);
    }
    return { success: true, count: results.length };
  } catch (error: any) {
    console.error('Error seeding holidays:', error);
    return { success: false, error: error.message };
  }
}
