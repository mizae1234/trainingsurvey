import { checkAdminAuth } from '@/app/actions/admin';
import { getCurrentUser } from '@/app/actions/line';
import { redirect } from 'next/navigation';
import { getOfficeSurveySubmissions } from '@/app/actions/officeSurvey';
import AdminOfficeSurveyContent from './AdminOfficeSurveyContent';

export const dynamic = 'force-dynamic';

export default async function AdminOfficeSurveyPage() {
  const isAuthed = await checkAdminAuth();
  const currentUser = await getCurrentUser();

  if (!isAuthed && !currentUser) {
    redirect('/admin/login');
  }

  const result = await getOfficeSurveySubmissions();
  const initialSubmissions = result.success && result.submissions ? result.submissions : [];

  return (
    <AdminOfficeSurveyContent
      initialSubmissions={initialSubmissions}
      currentUser={currentUser}
    />
  );
}
