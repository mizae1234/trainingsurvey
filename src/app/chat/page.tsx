import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/line';
import ChatClient from './ChatClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/admin/login');
  }

  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
    redirect('/admin/dashboard');
  }

  const serializedUser = {
    id: currentUser.id,
    displayName: currentUser.displayName,
    role: currentUser.role,
    pictureUrl: currentUser.pictureUrl || null,
    lineUserId: currentUser.lineUserId
  };

  return <ChatClient currentUser={serializedUser} />;
}
