import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/line';
import db from '@/lib/db';
import DashboardContent from './DashboardContent';
import { SurveyResponse } from '@prisma/client';

// Force dynamic rendering to fetch fresh data on load
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await getCurrentUser();
  const params = await searchParams;
  const taskId = params.id;
  if (taskId && typeof taskId === 'string') {
    redirect(`/admin/tasks?id=${taskId}`);
  }

  if (!currentUser) {
    const urlParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (typeof val === 'string') {
        urlParams.append(key, val);
      }
    }
    const queryString = urlParams.toString();
    redirect(`/admin/login${queryString ? `?${queryString}` : ''}`);
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

  const serializedUser = {
    id: currentUser.id,
    displayName: currentUser.displayName,
    role: currentUser.role,
    pictureUrl: currentUser.pictureUrl || null,
    lineUserId: currentUser.lineUserId
  };

  return <DashboardContent initialResponses={serializedResponses} currentUser={serializedUser} />;
}
