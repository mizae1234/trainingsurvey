'use server';

import db from '@/lib/db';
import { headers } from 'next/headers';

export async function submitSurvey(data: any) {
  try {
    // Basic validation
    if (!data.branch1 || !data.branch2) {
      return { success: false, error: 'กรุณาเลือกสาขาให้ครบถ้วน' };
    }

    // Capture client metadata
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
      || headersList.get('x-real-ip')
      || 'unknown';
    const userAgent = data.userAgent || headersList.get('user-agent') || 'unknown';

    const parsedData = {
      ipAddress,
      userAgent,
      branch1: data.branch1,
      branch1TrainingStart: new Date(data.branch1TrainingStart),
      branch1TrainingEnd: new Date(data.branch1TrainingEnd),
      branch1Duration: parseInt(data.branch1Duration) || 0,
      
      branch2: data.branch2,
      branch2TrainingStart: new Date(data.branch2TrainingStart),
      branch2TrainingEnd: new Date(data.branch2TrainingEnd),
      branch2Duration: parseInt(data.branch2Duration) || 0,
      
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
