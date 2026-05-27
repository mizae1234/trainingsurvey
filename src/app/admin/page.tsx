import { redirect } from 'next/navigation';
import { checkAdminAuth } from '@/app/actions/admin';

export default async function AdminPage() {
  const isAuthenticated = await checkAdminAuth();
  if (isAuthenticated) {
    redirect('/admin/dashboard');
  } else {
    redirect('/admin/login');
  }
}
