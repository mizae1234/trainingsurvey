import { checkAdminAuth } from '@/app/actions/admin';
import { redirect } from 'next/navigation';
import { getMotherDaySubmissions } from '@/app/actions/motherday';
import AdminMotherDayContent from './AdminMotherDayContent';

export const dynamic = 'force-dynamic';

export default async function AdminMotherDayPage() {
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const result = await getMotherDaySubmissions();
  const initialSubmissions = result.success && result.submissions ? result.submissions : [];

  // Map Date objects to string for client component serialization safety
  const serializedSubmissions = initialSubmissions.map((sub: any) => ({
    ...sub,
    createdAt: sub.createdAt instanceof Date ? sub.createdAt.toISOString() : sub.createdAt
  }));

  return <AdminMotherDayContent initialSubmissions={serializedSubmissions} />;
}
