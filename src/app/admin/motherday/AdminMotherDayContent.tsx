'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogout } from '@/app/actions/admin';
import * as XLSX from 'xlsx';
import { 
  Heart, 
  Search, 
  Download, 
  LogOut, 
  Image as ImageIcon, 
  Calendar, 
  User, 
  Briefcase, 
  MapPin, 
  ExternalLink,
  ChevronLeft,
  X
} from 'lucide-react';

interface Submission {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  nickname: string;
  position: string;
  branch: string;
  imageUrl: string;
  ipAddress: string | null;
  userAgent: string | null;
}

interface AdminMotherDayContentProps {
  initialSubmissions: Submission[];
}

export default function AdminMotherDayContent({ initialSubmissions }: AdminMotherDayContentProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Filter based on search term
  const filteredSubmissions = submissions.filter(sub => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      sub.firstName.toLowerCase().includes(term) ||
      sub.lastName.toLowerCase().includes(term) ||
      sub.nickname.toLowerCase().includes(term) ||
      sub.position.toLowerCase().includes(term) ||
      sub.branch.toLowerCase().includes(term)
    );
  });

  // Handle Logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await adminLogout();
    router.push('/admin/login');
  };

  // Export to Excel using SheetJS
  const handleExportExcel = () => {
    if (filteredSubmissions.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = [
      'ลำดับ',
      'วันที่ส่งข้อมูล',
      'เวลาที่ส่งข้อมูล',
      'ชื่อจริง',
      'นามสกุล',
      'ชื่อเล่น',
      'ตำแหน่ง',
      'สาขา',
      'ลิงก์รูปภาพ R2',
      'IP Address',
      'User Agent'
    ];

    const dataRows = filteredSubmissions.map((sub, index) => {
      const dateObj = new Date(sub.createdAt);
      // Format date in Thai format: DD/MM/YYYY
      const dateStr = dateObj.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Bangkok'
      });
      // Format time: HH:MM:SS
      const timeStr = dateObj.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Bangkok'
      });

      return [
        index + 1,
        dateStr,
        timeStr,
        sub.firstName,
        sub.lastName,
        sub.nickname,
        sub.position,
        sub.branch,
        sub.imageUrl,
        sub.ipAddress || 'unknown',
        sub.userAgent || 'unknown'
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    
    // Set column widths for convenience
    const colWidths = [
      { wch: 6 },  // No.
      { wch: 15 }, // Date
      { wch: 12 }, // Time
      { wch: 15 }, // First Name
      { wch: 18 }, // Last Name
      { wch: 10 }, // Nickname
      { wch: 20 }, // Position
      { wch: 25 }, // Branch
      { wch: 60 }, // URL
      { wch: 18 }, // IP
      { wch: 40 }  // User Agent
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Mother's Day Activity");
    
    const fileName = `MotherDay_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
      
      {/* Top Header Bar Accent */}
      <div style={{ height: '6px', background: 'linear-gradient(to right, #e11d48 50%, #eab308 50%)' }} />

      {/* Navigation Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => router.push('/admin/dashboard')} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid #cbd5e1',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#64748b',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
            >
              <ChevronLeft size={16} />
              กลับไป Dashboard หลัก
            </button>
            
            <div style={{ height: '24px', width: '1px', backgroundColor: '#e2e8f0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={20} color="#e11d48" className="fill-rose-500" style={{ fill: '#e11d48' }} />
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                ข้อมูลกิจกรรมวันแม่ (Mother's Day Campaign)
              </h1>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            disabled={isLoggingOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
          >
            <LogOut size={16} />
            {isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1200px', margin: '32px auto 0 auto', padding: '0 16px' }}>
        
        {/* Statistics & Actions Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '24px' }}>
          
          {/* Submission Count Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>จำนวนผู้เข้าร่วมกิจกรรมทั้งหมด</div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              {submissions.length} <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>คน</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              * อัปเดตข้อมูลแบบเรียลไทม์ (จำกัด 1 สิทธิ์ต่อ 1 ชื่อจริงและนามสกุล)
            </div>
          </div>

          {/* Filters & Export Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontWeight: 700, color: '#334155', fontSize: '16px' }}>เครื่องมือจัดการข้อมูล</div>
              
              <button 
                onClick={handleExportExcel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  boxShadow: '0 4px 10px rgba(22, 163, 74, 0.15)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
              >
                <Download size={16} />
                ดาวน์โหลดข้อมูล Excel (.xlsx)
              </button>
            </div>

            {/* Search Input Bar */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="ค้นหาตาม ชื่อจริง, นามสกุล, ชื่อเล่น, ตำแหน่ง หรือชื่อสาขา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submissions Grid List */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
            <span style={{ fontWeight: 600, color: '#475569', fontSize: '15px' }}>รายการผู้ส่งผลงานเข้าร่วม</span>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>แสดงผล {filteredSubmissions.length} จากทั้งหมด {submissions.length} รายการ</span>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <ImageIcon size={48} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
              <p style={{ fontSize: '16px', fontWeight: 500 }}>ไม่พบข้อมูลผู้ส่งเข้าร่วมตามเงื่อนไขค้นหา</p>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>ลองเปลี่ยนคำค้นหาใหม่หรือตรวจสอบการสะกดชื่ออีกครั้ง</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '16px 24px' }}>พรีวิวรูปภาพ</th>
                    <th style={{ padding: '16px 12px' }}>วันที่อัปโหลด</th>
                    <th style={{ padding: '16px 12px' }}>ชื่อ - นามสกุล</th>
                    <th style={{ padding: '16px 12px' }}>ชื่อเล่น</th>
                    <th style={{ padding: '16px 12px' }}>ตำแหน่ง</th>
                    <th style={{ padding: '16px 12px' }}>สาขา</th>
                    <th style={{ padding: '16px 24px', textAlign: 'center' }}>ลิงก์รูปภาพ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub) => {
                    const dateObj = new Date(sub.createdAt);
                    const formattedDate = dateObj.toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      timeZone: 'Asia/Bangkok'
                    }) + ' ' + dateObj.toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                      timeZone: 'Asia/Bangkok'
                    }) + ' น.';

                    return (
                      <tr 
                        key={sub.id} 
                        style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px', transition: 'background-color 0.15s' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* Photo Preview Thumbnail */}
                        <td style={{ padding: '16px 24px' }}>
                          <div 
                            onClick={() => setSelectedImage(sub.imageUrl)}
                            style={{ 
                              width: '56px', 
                              height: '56px', 
                              borderRadius: '8px', 
                              overflow: 'hidden', 
                              border: '1px solid #cbd5e1', 
                              cursor: 'pointer',
                              backgroundColor: '#e2e8f0',
                              transition: 'transform 0.2s',
                              position: 'relative'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                          >
                            <img 
                              src={sub.imageUrl} 
                              alt="Thumbnail" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                // Fallback
                                e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                              }}
                            />
                          </div>
                        </td>

                        {/* Upload Date */}
                        <td style={{ padding: '16px 12px', color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} style={{ color: '#94a3b8' }} />
                            {formattedDate}
                          </div>
                        </td>

                        {/* Name */}
                        <td style={{ padding: '16px 12px', fontWeight: 600, color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} style={{ color: '#94a3b8' }} />
                            {sub.firstName} {sub.lastName}
                          </div>
                        </td>

                        {/* Nickname */}
                        <td style={{ padding: '16px 12px', color: '#0284c7', fontWeight: 600 }}>
                          "{sub.nickname}"
                        </td>

                        {/* Position */}
                        <td style={{ padding: '16px 12px', color: '#475569' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Briefcase size={14} style={{ color: '#94a3b8' }} />
                            {sub.position}
                          </div>
                        </td>

                        {/* Branch */}
                        <td style={{ padding: '16px 12px', color: '#1e40af', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} style={{ color: '#94a3b8' }} />
                            {sub.branch}
                          </div>
                        </td>

                        {/* Image Link */}
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <a 
                            href={sub.imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              transition: 'all 0.2s',
                              border: '1px solid #dbeafe'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                            title="เปิดดูภาพต้นฉบับในแท็บใหม่"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Image zoom Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '650px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
          >
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(15,23,42,0.8)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                zIndex: 10
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.8)'}
            >
              <X size={18} />
            </button>
            <div style={{ width: '100%', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img 
                src={selectedImage} 
                alt="Zoomed" 
                style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} 
              />
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>รูปภาพผู้เข้าร่วมกิจกรรม</span>
              <a 
                href={selectedImage} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  fontSize: '13px',
                  color: '#2563eb',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                เปิดไฟล์เต็มในแท็บใหม่ <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
