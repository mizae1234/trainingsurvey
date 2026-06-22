'use client';

import React, { useState } from 'react';
import { completeBuddyTask } from '@/app/actions/line';
import { CheckCircle, Clock, User, Calendar, ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';

interface TaskData {
  id: number;
  createdAt: string;
  lineUserId: string;
  displayName: string | null;
  lineGroupId: string | null;
  groupName: string | null;
  assignee: string | null;
  description: string;
  status: string;
}

export default function TaskDetailClient({ task: initialTask }: { task: TaskData }) {
  const [task, setTask] = useState<TaskData>(initialTask);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleComplete = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await completeBuddyTask(task.id);
      if (res.success) {
        setSuccessMsg('บันทึกงานเสร็จสิ้นสำเร็จแล้ว! 🎉');
        setTask(prev => ({ ...prev, status: 'COMPLETED' }));
      } else {
        setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการอัปเดตงาน');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '16px', backgroundColor: '#F1F5F9' }}>
      <div className="theme-header-bar" />

      <div className="login-card" style={{ maxWidth: '550px', width: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <div className="survey-header" style={{ padding: '24px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', position: 'relative' }}>
          <Link href="/admin/dashboard" style={{ position: 'absolute', left: '20px', top: '24px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> แดชบอร์ด
          </Link>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
            <ClipboardList size={22} color="#10B981" />
            <h1 className="survey-title" style={{ fontSize: '18px', margin: 0 }}>รายละเอียดงานมอบหมาย (Task)</h1>
          </div>
          <p className="survey-subtitle" style={{ margin: '4px 0 0 0' }}>ระบบผู้ช่วยอัจฉริยะ บัดดี้ (Buddy)</p>
        </div>

        {/* Body Content */}
        <div style={{ padding: '32px' }}>
          {/* Status Alert */}
          {successMsg && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#FEF2F2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', border: '1px solid #FEE2E2' }}>
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          {/* Card Info */}
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                หมายเลขงาน #{task.id}
              </span>
              
              {task.status === 'COMPLETED' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  <CheckCircle size={12} /> เสร็จสิ้น (COMPLETED)
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#FFEDD5', color: '#9A3412', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  <Clock size={12} /> กำลังดำเนินการ (PENDING)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <User size={16} color="#64748B" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>ผู้รับผิดชอบ (Assignee)</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{task.assignee || 'ไม่ได้ระบุ'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <User size={16} color="#64748B" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>ผู้สั่งงาน (Creator)</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E293B' }}>
                    {task.displayName || 'LINE User'} 
                    {task.groupName ? ` (จากกลุ่ม: ${task.groupName})` : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Calendar size={16} color="#64748B" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>วันที่มอบหมาย</div>
                  <div style={{ fontSize: '14px', color: '#1E293B' }}>{formatDate(task.createdAt)}</div>
                </div>
              </div>

              <div style={{ marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>รายละเอียดงาน</div>
                <div style={{ fontSize: '15px', color: '#0F172A', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontWeight: 500 }}>
                  {task.description}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {task.status !== 'COMPLETED' ? (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="btn btn-primary w-full"
              style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}
            >
              <CheckCircle size={18} />
              {isSubmitting ? 'กำลังบันทึกสถานะ...' : 'ทำเครื่องหมายว่าเสร็จสิ้น'}
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#E8F5E9', borderRadius: '8px', color: '#2E7D32', fontSize: '14px', fontWeight: 500 }}>
              ✓ งานนี้เสร็จเรียบร้อยแล้ว
            </div>
          )}

          <Link href="/admin/dashboard" className="btn btn-secondary w-full" style={{ display: 'block', textAlign: 'center', marginTop: '12px', padding: '12px' }}>
            กลับสู่แดชบอร์ด
          </Link>
        </div>
      </div>
    </div>
  );
}
