'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { adminLogout } from '@/app/actions/admin';
import {
  deleteOfficeSurveySubmission,
  getOfficeSurveySubmissions,
} from '@/app/actions/officeSurvey';
import {
  Building2,
  Search,
  Download,
  Trash2,
  RefreshCw,
  LogOut,
  ExternalLink,
  ThumbsUp,
  Wrench,
  PlusCircle,
  Target,
  MessageSquareHeart,
  LayoutGrid,
  Table as TableIcon,
  Clock,
  Sparkles,
  Heart,
  MessageSquare,
  Settings,
  GraduationCap,
  Calendar,
  AlertTriangle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface OfficeSurveyItem {
  id: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  q1_liked: string;
  q2_improve: string;
  q3_additions: string;
  q4_priority: string;
  q5_suggestions: string | null;
}

interface AdminOfficeSurveyContentProps {
  initialSubmissions: OfficeSurveyItem[];
  currentUser?: {
    id: string;
    displayName: string;
    role: string;
    pictureUrl: string | null;
    lineUserId: string;
  } | null;
}

export default function AdminOfficeSurveyContent({
  initialSubmissions,
  currentUser,
}: AdminOfficeSurveyContentProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<OfficeSurveyItem[]>(initialSubmissions);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'topic'>('card');
  const [activeTopicTab, setActiveTopicTab] = useState<'q1' | 'q2' | 'q3' | 'q4' | 'q5'>('q4');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format Date in Thai format
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return isoString;
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await adminLogout();
    router.push('/admin/login');
  };

  // Refresh Submissions
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getOfficeSurveySubmissions();
      if (res.success && res.submissions) {
        setSubmissions(res.submissions);
      }
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Delete Submission Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const res = await deleteOfficeSurveySubmission(deleteTargetId);
      if (res.success) {
        setSubmissions((prev) => prev.filter((item) => item.id !== deleteTargetId));
        setDeleteTargetId(null);
      } else {
        alert(res.error || 'ลบข้อมูลไม่สำเร็จ');
      }
    } catch (e: any) {
      alert(e?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) return submissions;
    const term = searchTerm.toLowerCase();

    return submissions.filter((item) => {
      return (
        item.q1_liked.toLowerCase().includes(term) ||
        item.q2_improve.toLowerCase().includes(term) ||
        item.q3_additions.toLowerCase().includes(term) ||
        item.q4_priority.toLowerCase().includes(term) ||
        (item.q5_suggestions && item.q5_suggestions.toLowerCase().includes(term))
      );
    });
  }, [submissions, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const today = new Date().toDateString();
    const todayCount = submissions.filter(
      (s) => new Date(s.createdAt).toDateString() === today
    ).length;
    const latest = submissions.length > 0 ? formatDateTime(submissions[0].createdAt) : '-';
    return { total, todayCount, latest };
  }, [submissions]);

  // Export to Excel
  const handleExportExcel = () => {
    if (submissions.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const excelData = submissions.map((item, index) => ({
      ลำดับ: index + 1,
      วันเวลาที่ส่ง: formatDateTime(item.createdAt),
      '1. สิ่งที่ชอบและอยากให้คงไว้': item.q1_liked,
      '2. สิ่งที่อยากให้ปรับปรุงหรือแก้ไข': item.q2_improve,
      '3. สิ่งที่อยากให้มีเพิ่มเข้ามา': item.q3_additions,
      '4. เรื่องที่อยากให้เปลี่ยนเป็นอันดับแรก': item.q4_priority,
      '5. ข้อเสนอแนะอื่นๆ': item.q5_suggestions || '-',
      'IP Address': item.ipAddress || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto-width columns
    const colWidths = [
      { wch: 8 }, // ลำดับ
      { wch: 22 }, // วันเวลา
      { wch: 40 }, // Q1
      { wch: 40 }, // Q2
      { wch: 40 }, // Q3
      { wch: 40 }, // Q4
      { wch: 35 }, // Q5
      { wch: 16 }, // IP
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Office_Ideation');

    const nowStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `McThai_HR_Office_Ideation_${nowStr}.xlsx`);
  };

  return (
    <div className="admin-shell" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Top McThai Brand Accent */}
      <div
        style={{
          height: '6px',
          background: 'linear-gradient(90deg, #DA291C 0%, #FFBC0D 50%, #DA291C 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      />

      {/* Admin Navbar */}
      <nav className="admin-nav" style={{ marginTop: '6px' }}>
        <div className="admin-nav-container">
          <div className="admin-brand">
            <Building2 size={22} style={{ color: '#DA291C' }} />
            <span>McThai HR Office Ideation</span>
            <div style={{ fontSize: '12px', color: '#64748B' }}>รายงานแบบสำรวจปรับปรุงออฟฟิศ</div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/admin/dashboard"
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <GraduationCap size={15} /> ประเมินฝึกหน้าร้าน
            </Link>

            <Link
              href="/admin/motherday"
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Heart size={14} style={{ fill: '#e11d48', stroke: '#e11d48' }} /> กิจกรรมวันแม่
            </Link>

            <Link
              href="/admin/office-survey"
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #DA291C, #E11D48)',
                color: '#FFFFFF',
                padding: '8px 14px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} /> ไอเดียออฟฟิศ HR
            </Link>

            <Link
              href="/chat"
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <MessageSquare size={14} /> แชทบอท
            </Link>

            {currentUser?.role === 'SUPER_ADMIN' && (
              <Link
                href="/admin/super"
                className="btn btn-secondary"
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Settings size={14} /> แผงควบคุม
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LogOut size={15} /> ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Shell */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px 64px 16px' }}>
        {/* Header Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF2F2 50%, #FFFFFF 100%)',
            border: '1px solid #FDE68A',
            borderRadius: '16px',
            padding: '24px 28px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  background: '#FEF3C7',
                  color: '#92400E',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                💛 HR McThai Workplace Survey
              </span>
              <span
                style={{
                  background: '#ECFDF5',
                  color: '#065F46',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                🔒 ไม่ระบุตัวตน (Anonymous)
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              รวมไอเดียปรับปรุงออฟฟิศ McThai ทั้งหมด ✨
            </h1>
            <p style={{ color: '#64748B', fontSize: '14.5px', marginTop: '4px', margin: 0 }}>
              เสียงและความคิดเห็นจากชาว HR เพื่อสร้างบรรยากาศการทำงานที่อบอุ่น ผ่อนคลาย และมีความสุข
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/hr-survey"
              target="_blank"
              className="btn btn-secondary"
              style={{
                padding: '10px 18px',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={16} /> เปิดหน้าแบบสำรวจ
            </Link>

            <button
              onClick={handleExportExcel}
              className="btn btn-primary"
              style={{
                background: '#16A34A',
                borderColor: '#16A34A',
                color: '#FFFFFF',
                padding: '10px 18px',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(22, 163, 74, 0.2)',
              }}
            >
              <FileSpreadsheet size={16} /> ส่งออก Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
                จำนวนไอเดียทั้งหมด
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={20} />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0F172A', marginTop: '8px' }}>
              {stats.total}
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#64748B', marginLeft: '6px' }}>
                รายการ
              </span>
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
                ส่งเข้ามาในวันนี้
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#DCFCE7',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={20} />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0F172A', marginTop: '8px' }}>
              {stats.todayCount}
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#64748B', marginLeft: '6px' }}>
                รายการ
              </span>
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
                เวลาที่ส่งล่าสุด
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#DBEAFE',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={20} />
              </div>
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#0F172A',
                marginTop: '14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {stats.latest}
            </div>
          </div>
        </div>

        {/* Toolbar: Search, View Switcher, Refresh */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 300px',
              maxWidth: '450px',
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              placeholder="ค้นหาข้อความในทุกคำตอบ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 38px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* View Switcher & Refresh */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                background: '#F1F5F9',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('card')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: viewMode === 'card' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'card' ? '#0F172A' : '#64748B',
                  fontWeight: viewMode === 'card' ? 600 : 400,
                  boxShadow: viewMode === 'card' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <LayoutGrid size={15} /> การ์ด (Cards)
              </button>

              <button
                type="button"
                onClick={() => setViewMode('topic')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: viewMode === 'topic' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'topic' ? '#0F172A' : '#64748B',
                  fontWeight: viewMode === 'topic' ? 600 : 400,
                  boxShadow: viewMode === 'topic' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Target size={15} /> แยกตามหัวข้อ (Topics)
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'table' ? '#0F172A' : '#64748B',
                  fontWeight: viewMode === 'table' ? 600 : 400,
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <TableIcon size={15} /> ตาราง (Table)
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
              }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> รีเฟรช
            </button>
          </div>
        </div>

        {/* Content Display */}
        {filteredSubmissions.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
            }}
          >
            <Sparkles size={40} style={{ color: '#CBD5E1', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', color: '#475569', marginBottom: '6px' }}>
              {searchTerm ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ยังไม่มีข้อมูลการแชร์ไอเดีย'}
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>
              {searchTerm
                ? 'ลองค้นหาด้วยคำสำคัญอื่นๆ'
                : 'เมื่อมีผู้ส่งแบบสำรวจ ข้อมูลจะปรากฏขึ้นที่นี่แบบ Real-time'}
            </p>
          </div>
        ) : viewMode === 'topic' ? (
          /* Topic-Based Grouping View */
          <div>
            {/* Topic Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '18px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTopicTab('q4')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTopicTab === 'q4' ? '#FEF3C7' : '#FFFFFF',
                  color: activeTopicTab === 'q4' ? '#92400E' : '#475569',
                  borderBottom:
                    activeTopicTab === 'q4' ? '3px solid #F59E0B' : '1px solid #E2E8F0',
                  boxShadow: activeTopicTab === 'q4' ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                }}
              >
                <Target size={16} style={{ color: '#D97706' }} />
                <span>4. เรื่องที่อยากเปลี่ยนเป็นอันดับแรก</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTopicTab('q1')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTopicTab === 'q1' ? '#DCFCE7' : '#FFFFFF',
                  color: activeTopicTab === 'q1' ? '#166534' : '#475569',
                  borderBottom:
                    activeTopicTab === 'q1' ? '3px solid #16A34A' : '1px solid #E2E8F0',
                }}
              >
                <ThumbsUp size={16} style={{ color: '#16A34A' }} />
                <span>1. สิ่งที่ชอบและอยากให้คงไว้</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTopicTab('q2')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTopicTab === 'q2' ? '#FEE2E2' : '#FFFFFF',
                  color: activeTopicTab === 'q2' ? '#991B1B' : '#475569',
                  borderBottom:
                    activeTopicTab === 'q2' ? '3px solid #DC2626' : '1px solid #E2E8F0',
                }}
              >
                <Wrench size={16} style={{ color: '#DC2626' }} />
                <span>2. สิ่งที่อยากให้ปรับปรุง/แก้ไข</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTopicTab('q3')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTopicTab === 'q3' ? '#DBEAFE' : '#FFFFFF',
                  color: activeTopicTab === 'q3' ? '#1E40AF' : '#475569',
                  borderBottom:
                    activeTopicTab === 'q3' ? '3px solid #2563EB' : '1px solid #E2E8F0',
                }}
              >
                <PlusCircle size={16} style={{ color: '#2563EB' }} />
                <span>3. สิ่งที่อยากให้มีเพิ่ม</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTopicTab('q5')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTopicTab === 'q5' ? '#F3E8FF' : '#FFFFFF',
                  color: activeTopicTab === 'q5' ? '#6B21A8' : '#475569',
                  borderBottom:
                    activeTopicTab === 'q5' ? '3px solid #9333EA' : '1px solid #E2E8F0',
                }}
              >
                <MessageSquareHeart size={16} style={{ color: '#9333EA' }} />
                <span>5. ข้อเสนอแนะอื่นๆ</span>
              </button>
            </div>

            {/* List of answers for active topic */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredSubmissions.map((item, idx) => {
                let answerText = '';
                if (activeTopicTab === 'q1') answerText = item.q1_liked;
                if (activeTopicTab === 'q2') answerText = item.q2_improve;
                if (activeTopicTab === 'q3') answerText = item.q3_additions;
                if (activeTopicTab === 'q4') answerText = item.q4_priority;
                if (activeTopicTab === 'q5') answerText = item.q5_suggestions || '';

                if (!answerText.trim() && activeTopicTab === 'q5') return null;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      padding: '18px 22px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        flexShrink: 0,
                      }}
                    >
                      #{filteredSubmissions.length - idx}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: '15.5px',
                          color: '#0F172A',
                          lineHeight: 1.65,
                          whiteSpace: 'pre-wrap',
                          margin: 0,
                        }}
                      >
                        {answerText}
                      </p>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#94A3B8',
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Clock size={12} /> {formatDateTime(item.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'card' ? (
          /* Cards View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredSubmissions.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                  position: 'relative',
                }}
              >
                {/* Card Top Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #F1F5F9',
                    paddingBottom: '14px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #FEF3C7, #FEE2E2)',
                        color: '#92400E',
                        fontWeight: 700,
                        fontSize: '13px',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Sparkles size={14} style={{ color: '#D97706' }} />
                      <span>ไอเดียที่ #{filteredSubmissions.length - idx}</span>
                    </div>

                    <span
                      style={{
                        fontSize: '13px',
                        color: '#64748B',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={13} /> {formatDateTime(item.createdAt)}
                    </span>
                  </div>

                  <button
                    onClick={() => setDeleteTargetId(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                    }}
                    title="ลบข้อมูล"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* 5 Questions Body */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {/* Q1 */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      borderLeft: '4px solid #16A34A',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#166534',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <ThumbsUp size={14} /> 1. สิ่งที่ชอบและอยากให้คงไว้:
                    </div>
                    <div
                      style={{
                        fontSize: '14.5px',
                        color: '#1E293B',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {item.q1_liked}
                    </div>
                  </div>

                  {/* Q2 */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      borderLeft: '4px solid #DC2626',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#991B1B',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Wrench size={14} /> 2. สิ่งที่อยากให้ปรับปรุง/แก้ไข:
                    </div>
                    <div
                      style={{
                        fontSize: '14.5px',
                        color: '#1E293B',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {item.q2_improve}
                    </div>
                  </div>

                  {/* Q3 */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      borderLeft: '4px solid #2563EB',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1E40AF',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <PlusCircle size={14} /> 3. สิ่งที่อยากให้มีเพิ่มเข้ามา:
                    </div>
                    <div
                      style={{
                        fontSize: '14.5px',
                        color: '#1E293B',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {item.q3_additions}
                    </div>
                  </div>

                  {/* Q4 (Highlighted Priority) */}
                  <div
                    style={{
                      background: '#FFFBEB',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #F59E0B',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#92400E',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Target size={15} style={{ color: '#D97706' }} />
                      <span>4. เรื่องที่อยากเปลี่ยนเป็นอันดับแรก:</span>
                    </div>
                    <div
                      style={{
                        fontSize: '14.5px',
                        fontWeight: 600,
                        color: '#78350F',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {item.q4_priority}
                    </div>
                  </div>
                </div>

                {/* Q5 (If present) */}
                {item.q5_suggestions && (
                  <div
                    style={{
                      marginTop: '14px',
                      background: '#FAF5FF',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      borderLeft: '4px solid #9333EA',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#6B21A8',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <MessageSquareHeart size={14} /> 5. ข้อเสนอแนะอื่นๆ:
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#3B0764',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {item.q5_suggestions}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', width: '70px' }}>
                      #
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', width: '150px' }}>
                      เวลาที่ส่ง
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', minWidth: '220px' }}>
                      1. สิ่งที่ชอบ
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', minWidth: '220px' }}>
                      2. ปรับปรุง/แก้ไข
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', minWidth: '220px' }}>
                      3. อยากให้มีเพิ่ม
                    </th>
                    <th
                      style={{
                        padding: '14px 16px',
                        textAlign: 'left',
                        minWidth: '240px',
                      }}
                    >
                      4. เรื่องที่อยากให้เปลี่ยนเป็นอันดับแรก
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', minWidth: '180px' }}>
                      5. ข้อเสนอแนะอื่นๆ
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', width: '60px' }}>
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        verticalAlign: 'top',
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#64748B' }}>
                        #{filteredSubmissions.length - idx}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#1E293B' }}>{item.q1_liked}</td>
                      <td style={{ padding: '14px 16px', color: '#1E293B' }}>{item.q2_improve}</td>
                      <td style={{ padding: '14px 16px', color: '#1E293B' }}>{item.q3_additions}</td>
                      <td
                        style={{
                          padding: '14px 16px',
                          color: '#78350F',
                          fontWeight: 600,
                          background: '#FFFDF5',
                        }}
                      >
                        {item.q4_priority}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B' }}>
                        {item.q5_suggestions || '-'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => setDeleteTargetId(item.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              ยืนยันการลบความคิดเห็นนี้?
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>
              การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลรายการนี้จะถูกลบออกจากฐานข้อมูล
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13.5px', borderRadius: '8px' }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="btn btn-primary"
                style={{
                  background: '#DC2626',
                  borderColor: '#DC2626',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  fontSize: '13.5px',
                  borderRadius: '8px',
                }}
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
