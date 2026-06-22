import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/line';
import db from '@/lib/db';
import TaskDetailClient from './TaskDetailClient';

export const dynamic = 'force-dynamic';

export default async function TaskDetailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await getCurrentUser();
  const params = await searchParams;
  const taskIdStr = params.id;

  if (!taskIdStr || typeof taskIdStr !== 'string') {
    redirect('/admin/dashboard');
  }

  if (!currentUser) {
    redirect(`/admin/login?id=${taskIdStr}`);
  }

  const taskId = parseInt(taskIdStr, 10);
  if (isNaN(taskId)) {
    redirect('/admin/dashboard');
  }

  const task = await db.buddyTask.findUnique({
    where: { id: taskId }
  });

  if (!task) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '16px', backgroundColor: '#F1F5F9' }}>
        <div className="login-card" style={{ maxWidth: '450px', width: '100%', padding: '32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#E11D48', marginBottom: '12px' }}>ไม่พบข้อมูลงานมอบหมาย</h2>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>งานมอบหมายหมายเลข #{taskIdStr} อาจไม่มีอยู่จริง หรือถูกลบไปแล้ว</p>
          <a href="/admin/dashboard" className="btn btn-secondary" style={{ display: 'inline-block', width: '100%', padding: '12px' }}>
            กลับสู่หน้าแดชบอร์ด
          </a>
        </div>
      </div>
    );
  }

  const serializedTask = {
    id: task.id,
    createdAt: task.createdAt.toISOString(),
    lineUserId: task.lineUserId,
    displayName: task.displayName,
    lineGroupId: task.lineGroupId,
    groupName: task.groupName,
    assignee: task.assignee,
    description: task.description,
    status: task.status
  };

  return <TaskDetailClient task={serializedTask} />;
}
