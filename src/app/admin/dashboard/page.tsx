import { redirect } from 'next/navigation';
import { checkAdminAuth } from '@/app/actions/admin';
import db from '@/lib/db';
import DashboardContent from './DashboardContent';
import { SurveyResponse } from '@prisma/client';

// Force dynamic rendering to fetch fresh data on load
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const isAuthenticated = await checkAdminAuth();
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  // Fetch all responses ordered by creation date
  let responses: SurveyResponse[] = [];
  try {
    responses = await db.surveyResponse.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Failed to load survey responses:', error);
  }

  // Serialize dates to ISO strings before passing to client components
  const serializedResponses = responses.map(response => ({
    ...response,
    createdAt: response.createdAt.toISOString(),
    branch1TrainingStart: response.branch1TrainingStart.toISOString(),
    branch1TrainingEnd: response.branch1TrainingEnd.toISOString(),
    branch2TrainingStart: response.branch2TrainingStart.toISOString(),
    branch2TrainingEnd: response.branch2TrainingEnd.toISOString(),
  }));

  return <DashboardContent initialResponses={serializedResponses} />;
}
