import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/line';
import ChatClient from './ChatClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/admin/login');
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
