'use client';

import React, { useState, useMemo } from 'react';
import { adminLogout } from '@/app/actions/admin';
import { 
  BarChart, 
  Download, 
  Search, 
  Calendar, 
  LogOut, 
  Eye, 
  FileSpreadsheet, 
  Users, 
  TrendingUp, 
  Sliders, 
  CalendarDays,
  X,
  Star,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface ResponseData {
  id: string;
  createdAt: string;
  branch1: string;
  branch1TrainingStart: string;
  branch1TrainingEnd: string;
  branch1Duration: number;
  branch2: string;
  branch2TrainingStart: string;
  branch2TrainingEnd: string;
  branch2Duration: number;
  q1_benefit: number;
  q2_apply_knowledge: number;
  q3_consistency: number;
  q4_1_duration_suitability: string;
  q4_2_branches_suitability: string;
  q5_clarity_branch1: number;
  q5_clarity_branch2: number;
  q6_volume_branch1: number;
  q6_volume_branch2: number;
  q7_readiness_branch1: number;
  q7_readiness_branch2: number;
  q8_trainer_knowledge_branch1: number;
  q8_trainer_knowledge_branch2: number;
  q9_safety_hygiene_branch1: number;
  q9_safety_hygiene_branch2: number;
  q10_trainer_care_branch1: number;
  q10_trainer_care_branch2: number;
  q11_atmosphere_branch1: number;
  q11_atmosphere_branch2: number;
  feedback12_challenging: string | null;
  feedback13_ideal_setup: string | null;
  feedback14_impressions: string | null;
  feedback15_suggestions: string | null;
}

interface DashboardContentProps {
  initialResponses: ResponseData[];
}

export default function DashboardContent({ initialResponses }: DashboardContentProps) {
  const [responses, setResponses] = useState<ResponseData[]>(initialResponses);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [suitabilityFilter, setSuitabilityFilter] = useState('all');
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter logic
  const filteredResponses = useMemo(() => {
    return responses.filter(res => {
      const matchSearch = 
        res.branch1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.branch2.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchDate = !dateFilter || res.createdAt.startsWith(dateFilter);
      
      const matchSuitability = suitabilityFilter === 'all' || 
        res.q4_1_duration_suitability === suitabilityFilter ||
        res.q4_2_branches_suitability === suitabilityFilter;

      return matchSearch && matchDate && matchSuitability;
    });
  }, [responses, searchTerm, dateFilter, suitabilityFilter]);

  // Paginated responses
  const paginatedResponses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResponses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResponses, currentPage]);

  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = filteredResponses.length;
    if (total === 0) return { avgGeneral: 0, avgBranch1: 0, avgBranch2: 0, total: 0 };

    let sumGeneral = 0;
    let sumBranch1 = 0;
    let sumBranch2 = 0;

    filteredResponses.forEach(r => {
      sumGeneral += (r.q1_benefit + r.q2_apply_knowledge + r.q3_consistency) / 3;
      
      sumBranch1 += (
        r.q5_clarity_branch1 + 
        r.q6_volume_branch1 + 
        r.q7_readiness_branch1 + 
        r.q8_trainer_knowledge_branch1 + 
        r.q9_safety_hygiene_branch1 + 
        r.q10_trainer_care_branch1 + 
        r.q11_atmosphere_branch1
      ) / 7;

      sumBranch2 += (
        r.q5_clarity_branch2 + 
        r.q6_volume_branch2 + 
        r.q7_readiness_branch2 + 
        r.q8_trainer_knowledge_branch2 + 
        r.q9_safety_hygiene_branch2 + 
        r.q10_trainer_care_branch2 + 
        r.q11_atmosphere_branch2
      ) / 7;
    });

    return {
      total,
      avgGeneral: parseFloat((sumGeneral / total).toFixed(2)),
      avgBranch1: parseFloat((sumBranch1 / total).toFixed(2)),
      avgBranch2: parseFloat((sumBranch2 / total).toFixed(2))
    };
  }, [filteredResponses]);

  // Distribution chart data
  const chartsData = useMemo(() => {
    const total = filteredResponses.length;
    const scoresCount = { 4: 0, 3: 0, 2: 0, 1: 0 };
    const q4_1_suitability = { 'น้อยเกินไป': 0, 'มีความเหมาะสม': 0, 'มากเกินไป': 0 };
    const q4_2_suitability = { 'น้อยเกินไป': 0, 'มีความเหมาะสม': 0, 'มากเกินไป': 0 };

    filteredResponses.forEach(r => {
      // General Scores Distribution
      [r.q1_benefit, r.q2_apply_knowledge, r.q3_consistency].forEach(score => {
        if (score >= 1 && score <= 4) {
          scoresCount[score as 4 | 3 | 2 | 1] += 1;
        }
      });

      // Suitability
      if (r.q4_1_duration_suitability in q4_1_suitability) {
        q4_1_suitability[r.q4_1_duration_suitability as keyof typeof q4_1_suitability] += 1;
      }
      if (r.q4_2_branches_suitability in q4_2_suitability) {
        q4_2_suitability[r.q4_2_branches_suitability as keyof typeof q4_2_suitability] += 1;
      }
    });

    return {
      scores: scoresCount,
      q4_1: q4_1_suitability,
      q4_2: q4_2_suitability,
      total
    };
  }, [filteredResponses]);

  // CSV Export utility with BOM for Excel Thai language support
  const handleExportCSV = () => {
    const headers = [
      'ไอดี', 'วันที่ประเมิน', 'สาขาที่ 1', 'วันที่เริ่ม (สาขา 1)', 'วันที่สิ้นสุด (สาขา 1)', 'ระยะเวลา (วัน)',
      'สาขาที่ 2', 'วันที่เริ่ม (สาขา 2)', 'วันที่สิ้นสุด (สาขา 2)', 'ระยะเวลา (วัน)',
      'ส่วนที่ 2 ข้อ 1 (ประโยชน์)', 'ส่วนที่ 2 ข้อ 2 (นำไปใช้)', 'ส่วนที่ 2 ข้อ 3 (ความสอดคล้อง)',
      'ส่วนที่ 2 ข้อ 4.1 (ความเหมาะสมของเวลา)', 'ส่วนที่ 2 ข้อ 4.2 (ความเหมาะสมของจำนวนสาขา)',
      'สาขา 1 ข้อ 5 (การสอน)', 'สาขา 2 ข้อ 5 (การสอน)',
      'สาขา 1 ข้อ 6 (ความเหมาะสมเนื้อหา)', 'สาขา 2 ข้อ 6 (ความเหมาะสมเนื้อหา)',
      'สาขา 1 ข้อ 7 (ความพร้อมอุปกรณ์)', 'สาขา 2 ข้อ 7 (ความพร้อมอุปกรณ์)',
      'สาขา 1 ข้อ 8 (ความรู้พี่เลี้ยง)', 'สาขา 2 ข้อ 8 (ความรู้พี่เลี้ยง)',
      'สาขา 1 ข้อ 9 (สุขอนามัย/ปลอดภัย)', 'สาขา 2 ข้อ 9 (สุขอนามัย/ปลอดภัย)',
      'สาขา 1 ข้อ 10 (ความใส่ใจพี่เลี้ยง)', 'สาขา 2 ข้อ 10 (ความใส่ใจพี่เลี้ยง)',
      'สาขา 1 ข้อ 11 (บรรยากาศสาขา)', 'สาขา 2 ข้อ 11 (บรรยากาศสาขา)',
      'ส่วนที่ 4 ข้อ 12 (เนื้อหาที่ท้าทาย)', 'ส่วนที่ 4 ข้อ 13 (ความเหมาะสมวัน/สาขา)',
      'ส่วนที่ 4 ข้อ 14 (ความประทับใจ)', 'ส่วนที่ 4 ข้อ 15 (ข้อเสนอแนะอื่นๆ)'
    ];

    const rows = filteredResponses.map(r => [
      r.id,
      new Date(r.createdAt).toLocaleDateString('th-TH'),
      r.branch1,
      new Date(r.branch1TrainingStart).toLocaleDateString('th-TH'),
      new Date(r.branch1TrainingEnd).toLocaleDateString('th-TH'),
      r.branch1Duration,
      r.branch2,
      new Date(r.branch2TrainingStart).toLocaleDateString('th-TH'),
      new Date(r.branch2TrainingEnd).toLocaleDateString('th-TH'),
      r.branch2Duration,
      r.q1_benefit,
      r.q2_apply_knowledge,
      r.q3_consistency,
      r.q4_1_duration_suitability,
      r.q4_2_branches_suitability,
      r.q5_clarity_branch1,
      r.q5_clarity_branch2,
      r.q6_volume_branch1,
      r.q6_volume_branch2,
      r.q7_readiness_branch1,
      r.q7_readiness_branch2,
      r.q8_trainer_knowledge_branch1,
      r.q8_trainer_knowledge_branch2,
      r.q9_safety_hygiene_branch1,
      r.q9_safety_hygiene_branch2,
      r.q10_trainer_care_branch1,
      r.q10_trainer_care_branch2,
      r.q11_atmosphere_branch1,
      r.q11_atmosphere_branch2,
      `"${(r.feedback12_challenging || '').replace(/"/g, '""')}"`,
      `"${(r.feedback13_ideal_setup || '').replace(/"/g, '""')}"`,
      `"${(r.feedback14_impressions || '').replace(/"/g, '""')}"`,
      `"${(r.feedback15_suggestions || '').replace(/"/g, '""')}"`
    ]);

    // Prepend UTF-8 BOM
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `survey_responses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    await adminLogout();
    window.location.href = '/admin/login';
  };

  // Helper for formatting date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Rating mapping details
  const getRatingBadgeClass = (score: number) => {
    if (score >= 3.5) return 'badge-red'; // Highly Satisfied
    if (score >= 2.5) return 'badge-yellow'; // Satisfied
    return 'badge-secondary'; // Needs improvement
  };

  return (
    <div className="admin-shell">
      <div className="theme-header-bar" />
      
      {/* Navigation */}
      <nav className="admin-nav">
        <div className="admin-nav-container">
          <div className="admin-brand">
            <TrendingUp size={20} />
            <span>HRD Admin Portal</span>
            <div>ระบบรายงานแบบสอบถาม</div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <LogOut size={15} /> ออกจากระบบ
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        
        {/* KPI Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon red">
              <Users size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">แบบฟอร์มที่ส่งทั้งหมด</span>
              <span className="stat-value">{stats.total} ฟอร์ม</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">
              <Star size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">ความพึงพอใจภาพรวม</span>
              <span className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {stats.avgGeneral} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 4.00</span>
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon yellow">
              <Star size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">ประเมินเฉลี่ย สาขา 1</span>
              <span className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {stats.avgBranch1} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 4.00</span>
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon yellow">
              <Star size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">ประเมินเฉลี่ย สาขา 2</span>
              <span className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {stats.avgBranch2} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 4.00</span>
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {stats.total > 0 && (
          <div className="dashboard-row">
            
            {/* Chart 1: SVG Bar Chart for Score Distribution */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>การแจกแจงคะแนนส่วนที่ 2 (ภาพรวมหน้าร้าน)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>อิงจากจำนวนการประเมินย่อย ({stats.total * 3} รายการ)</span>
              </div>
              
              <div className="svg-chart-container" style={{ height: '220px' }}>
                <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((percent, idx) => {
                    const y = 20 + (140 * (100 - percent)) / 100;
                    return (
                      <g key={idx}>
                        <line x1="40" y1={y} x2="380" y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="30" y={y + 4} className="bar-chart-y-axis" textAnchor="end">{percent}%</text>
                      </g>
                    );
                  })}

                  {/* Bars representing scores 1-4 */}
                  {[1, 2, 3, 4].map((score, index) => {
                    const count = chartsData.scores[score as 4|3|2|1] || 0;
                    const totalRatings = stats.total * 3;
                    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                    
                    const barWidth = 40;
                    const spacing = 45;
                    const x = 70 + index * (barWidth + spacing);
                    const barHeight = (140 * percentage) / 100;
                    const y = 160 - barHeight;

                    // Red accent for high, yellow for moderate, light for low
                    let fillColor = 'var(--border-color)';
                    if (score === 4) fillColor = 'var(--primary-red)';
                    else if (score === 3) fillColor = 'var(--primary-yellow)';
                    else if (score === 2) fillStyle: fillColor = '#F472B6'; // Pink
                    else if (score === 1) fillColor = '#FDA4AF'; // Light rose

                    return (
                      <g key={score}>
                        {/* Bar */}
                        <rect 
                          x={x} 
                          y={y} 
                          width={barWidth} 
                          height={Math.max(barHeight, 2)} 
                          fill={fillColor} 
                          rx="4" 
                        />
                        {/* Value Text */}
                        <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-primary)">
                          {count} ({percentage.toFixed(0)}%)
                        </text>
                        {/* X Axis Label */}
                        <text x={x + barWidth / 2} y="180" textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--text-primary)">
                          คะแนน {score}
                        </text>
                      </g>
                    );
                  })}
                  <line x1="40" y1="160" x2="380" y2="160" stroke="#94A3B8" strokeWidth="2" />
                </svg>
              </div>

              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'var(--primary-red)' }} />
                  <span>4: เห็นด้วยอย่างยิ่ง</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'var(--primary-yellow)' }} />
                  <span>3: เห็นด้วย</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#F472B6' }} />
                  <span>2: ไม่เห็นด้วย</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#FDA4AF' }} />
                  <span>1: ไม่เห็นด้วยอย่างยิ่ง</span>
                </div>
              </div>
            </div>

            {/* Chart 2: SVG Stacked Bar suitability */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">ความเหมาะสมของโครงการ (5 วันใน 2 สาขา)</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center', height: '220px' }}>
                {/* Q4.1: Duration */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>
                    <span>4.1 ระยะเวลาในการฝึกอบรม</span>
                    <span style={{ color: 'var(--text-muted)' }}>รวม {stats.total} คน</span>
                  </div>
                  
                  <div style={{ height: '24px', display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    {['น้อยเกินไป', 'มีความเหมาะสม', 'มากเกินไป'].map((opt, idx) => {
                      const count = chartsData.q4_1[opt as keyof typeof chartsData.q4_1] || 0;
                      const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                      
                      const bgColors = ['#94A3B8', 'var(--primary-red)', 'var(--primary-yellow)'];
                      
                      if (pct === 0) return null;
                      return (
                        <div 
                          key={opt} 
                          style={{ 
                            width: `${pct}%`, 
                            backgroundColor: bgColors[idx], 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'white', 
                            fontSize: '10px', 
                            fontWeight: '600' 
                          }}
                          title={`${opt}: ${count} คน (${pct.toFixed(0)}%)`}
                        >
                          {pct > 15 && `${pct.toFixed(0)}%`}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Q4.2: Branches Count */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>
                    <span>4.2 จำนวนสาขาที่ฝึกอบรม</span>
                    <span style={{ color: 'var(--text-muted)' }}>รวม {stats.total} คน</span>
                  </div>
                  
                  <div style={{ height: '24px', display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    {['น้อยเกินไป', 'มีความเหมาะสม', 'มากเกินไป'].map((opt, idx) => {
                      const count = chartsData.q4_2[opt as keyof typeof chartsData.q4_2] || 0;
                      const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                      
                      const bgColors = ['#94A3B8', 'var(--primary-red)', 'var(--primary-yellow)'];
                      
                      if (pct === 0) return null;
                      return (
                        <div 
                          key={opt} 
                          style={{ 
                            width: `${pct}%`, 
                            backgroundColor: bgColors[idx], 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'white', 
                            fontSize: '10px', 
                            fontWeight: '600' 
                          }}
                          title={`${opt}: ${count} คน (${pct.toFixed(0)}%)`}
                        >
                          {pct > 15 && `${pct.toFixed(0)}%`}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="chart-legend" style={{ marginTop: '0px' }}>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#94A3B8' }} />
                  <span>น้อยเกินไป</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'var(--primary-red)' }} />
                  <span>มีความเหมาะสม</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'var(--primary-yellow)' }} />
                  <span>มากเกินไป</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Responses Table Container */}
        <div className="dashboard-card" style={{ padding: '24px 0px' }}>
          
          <div style={{ padding: '0px 24px 16px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>รายการผู้ส่งแบบประเมิน</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              แสดงข้อมูลคำตอบของผู้ประเมินทั้งหมด ค้นหาตามสาขา และกรองข้อมูลตามวันที่
            </p>
          </div>

          {/* Filters toolbar */}
          <div style={{ padding: '16px 24px', backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-color)' }} className="toolbar">
            <div className="filters-wrapper">
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสาขา..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="filter-input"
                  style={{ paddingLeft: '34px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                  className="filter-input"
                />
              </div>

              <select
                value={suitabilityFilter}
                onChange={(e) => { setSuitabilityFilter(e.target.value); setCurrentPage(1); }}
                className="filter-input"
                style={{ cursor: 'pointer' }}
              >
                <option value="all">ความเหมาะสมทั้งหมด</option>
                <option value="น้อยเกินไป">น้อยเกินไป</option>
                <option value="มีความเหมาะสม">มีความเหมาะสม</option>
                <option value="มากเกินไป">มากเกินไป</option>
              </select>
            </div>

            <button 
              onClick={handleExportCSV} 
              disabled={filteredResponses.length === 0}
              className="btn btn-primary" 
              style={{ backgroundColor: 'var(--primary-green)', padding: '10px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={15} /> ส่งออกไฟล์ Excel (CSV)
            </button>
          </div>

          {/* Table display */}
          <div style={{ padding: '0px 24px' }}>
            <div className="table-responsive" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>วันที่ประเมิน</th>
                    <th>สาขาที่ 1</th>
                    <th>สาขาที่ 2</th>
                    <th style={{ textAlign: 'center' }}>เวลาฝึกอบรม (วัน)</th>
                    <th style={{ textAlign: 'center' }}>ประเมินเฉลี่ยภาพรวม</th>
                    <th style={{ textAlign: 'right' }}>เครื่องมือ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResponses.length > 0 ? (
                    paginatedResponses.map((res) => {
                      // Calculate row average
                      const rowAvg = parseFloat(((res.q1_benefit + res.q2_apply_knowledge + res.q3_consistency) / 3).toFixed(2));
                      const totalDays = res.branch1Duration + res.branch2Duration;

                      return (
                        <tr key={res.id} onClick={() => setSelectedResponse(res)}>
                          <td>{formatDate(res.createdAt)}</td>
                          <td style={{ fontWeight: 500 }}>{res.branch1}</td>
                          <td style={{ fontWeight: 500 }}>{res.branch2}</td>
                          <td style={{ textAlign: 'center' }}>{totalDays} วัน</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${getRatingBadgeClass(rowAvg)}`}>
                              {rowAvg.toFixed(2)} / 4.00
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedResponse(res);
                              }}
                            >
                              <Eye size={12} /> รายละเอียด
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        ไม่พบข้อมูลผลลัพธ์แบบสอบถามที่ค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  แสดงหน้า {currentPage} จากทั้งหมด {totalPages} หน้า (พบ {filteredResponses.length} ฟอร์ม)
                </span>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Details Slideover/Modal Overlay */}
      {selectedResponse && (
        <div className="modal-overlay" onClick={() => setSelectedResponse(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>รายละเอียดผลการประเมิน</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ประเมินเมื่อ {formatDate(selectedResponse.createdAt)}</p>
              </div>
              <button className="close-btn" onClick={() => setSelectedResponse(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              
              {/* Section 1 */}
              <div className="detail-sec">
                <div className="detail-sec-title">ส่วนที่ 1: ข้อมูลการฝึกหน้าร้าน</div>
                <div className="detail-grid">
                  <div className="branch-panel" style={{ borderLeft: '3px solid var(--primary-red)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-red)', marginBottom: '8px' }}>สาขาที่ 1</div>
                    <div className="detail-item mb-2">
                      <span className="detail-label">ชื่อสาขา</span>
                      <span className="detail-val" style={{ fontSize: '14px' }}>{selectedResponse.branch1}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div className="detail-item">
                        <span className="detail-label">วันที่เริ่ม</span>
                        <span className="detail-val">{new Date(selectedResponse.branch1TrainingStart).toLocaleDateString('th-TH')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">วันที่สิ้นสุด</span>
                        <span className="detail-val">{new Date(selectedResponse.branch1TrainingEnd).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                    <div className="detail-item mt-2">
                      <span className="detail-label">ระยะเวลารวม</span>
                      <span className="detail-val">{selectedResponse.branch1Duration} วัน</span>
                    </div>
                  </div>

                  <div className="branch-panel" style={{ borderLeft: '3px solid var(--primary-yellow)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-yellow-hover)', marginBottom: '8px' }}>สาขาที่ 2</div>
                    <div className="detail-item mb-2">
                      <span className="detail-label">ชื่อสาขา</span>
                      <span className="detail-val" style={{ fontSize: '14px' }}>{selectedResponse.branch2}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div className="detail-item">
                        <span className="detail-label">วันที่เริ่ม</span>
                        <span className="detail-val">{new Date(selectedResponse.branch2TrainingStart).toLocaleDateString('th-TH')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">วันที่สิ้นสุด</span>
                        <span className="detail-val">{new Date(selectedResponse.branch2TrainingEnd).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                    <div className="detail-item mt-2">
                      <span className="detail-label">ระยะเวลารวม</span>
                      <span className="detail-val">{selectedResponse.branch2Duration} วัน</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="detail-sec">
                <div className="detail-sec-title">ส่วนที่ 2: ภาพรวมการฝึกหน้าร้าน</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '13px' }}>1. การฝึกหน้าร้านมีประโยชน์และช่วยให้เข้าใจผลิตภัณฑ์/บริการของบริษัทมากขึ้น</span>
                    <span className="badge badge-red" style={{ fontWeight: 600 }}>{selectedResponse.q1_benefit} คะแนน</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '13px' }}>2. สามารถนำความรู้และทักษะที่ได้รับจากหน้าร้าน ไปปรับ/ประยุกต์ใช้กับการทำงานในสายงานที่ปฏิบัติได้</span>
                    <span className="badge badge-red" style={{ fontWeight: 600 }}>{selectedResponse.q2_apply_knowledge} คะแนน</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '13px' }}>3. แนวทางการปฏิบัติงานและคำแนะนำที่ได้รับจากทั้ง 2 สาขา เป็นไปในทิศทางเดียวกัน</span>
                    <span className="badge badge-red" style={{ fontWeight: 600 }}>{selectedResponse.q3_consistency} คะแนน</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '13px' }}>4.1 ความเหมาะสมของระยะเวลา (5 วัน)</span>
                    <span className="badge badge-yellow" style={{ fontWeight: 600 }}>{selectedResponse.q4_1_duration_suitability}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '13px' }}>4.2 ความเหมาะสมของจำนวนสาขา (2 สาขา)</span>
                    <span className="badge badge-yellow" style={{ fontWeight: 600 }}>{selectedResponse.q4_2_branches_suitability}</span>
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="detail-sec">
                <div className="detail-sec-title">ส่วนที่ 3: การประเมินรายสาขา (คะแนน 1-4)</div>
                
                <table className="data-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>หัวข้อการประเมิน</th>
                      <th style={{ textAlign: 'center' }}>สาขา 1: {selectedResponse.branch1}</th>
                      <th style={{ textAlign: 'center' }}>สาขา 2: {selectedResponse.branch2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 500 }}>หมวด ก: กระบวนการจัดการและวิธีการสอน</td>
                      <td colSpan={2} style={{ backgroundColor: '#F8FAFC' }}></td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '24px' }}>5. การสอนในแต่ละส่วนงาน มีความชัดเจน เป็นลำดับขั้นตอน ไม่สับสน</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q5_clarity_branch1}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q5_clarity_branch2}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '24px' }}>6. ปริมาณเนื้อหาและงานที่ได้รับ มีความเหมาะสมกับเวลาที่กำหนดไว้</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q6_volume_branch1}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q6_volume_branch2}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '24px' }}>7. การจัดเตรียมอุปกรณ์ เครื่องมือ หรือเอกสารการสอนพร้อมใช้งาน</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q7_readiness_branch1}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q7_readiness_branch2}</td>
                    </tr>

                    <tr>
                      <td style={{ fontWeight: 500 }}>หมวด ข: ทีมผู้จัดการ พี่เลี้ยง และทีมงานประจำสาขา</td>
                      <td colSpan={2} style={{ backgroundColor: '#F8FAFC' }}></td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '24px' }}>8. พี่เลี้ยง/ผู้สอน มีความรู้ความเชี่ยวชาญ ถ่ายทอดเข้าใจง่าย</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q8_trainer_knowledge_branch1}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q8_trainer_knowledge_branch2}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '24px' }}>9. พี่เลี้ยงมีการสอนเรื่องความปลอดภัยและสุขอนามัย (Food Safety)</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q9_safety_hygiene_branch1}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q9_safety_hygiene_branch2}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '24px' }}>10. พี่เลี้ยงมีความใส่ใจ เป็นมิตร และเปิดโอกาสให้ซักถาม</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q10_trainer_care_branch1}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q10_trainer_care_branch2}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '24px' }}>11. ภาพรวมทีมงานและบรรยากาศในสาขาต้อนรับและสนับสนุนการเรียนรู้</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q11_atmosphere_branch1}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{selectedResponse.q11_atmosphere_branch2}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 4 */}
              <div className="detail-sec" style={{ marginBottom: '0px' }}>
                <div className="detail-sec-title">ส่วนที่ 4: ความคิดเห็นและข้อเสนอแนะเพิ่มเติม</div>
                
                <div className="form-group">
                  <span className="detail-label" style={{ fontWeight: 600 }}>12. งานในส่วนใดหรือเนื้อหาใด ที่ท่านคิดว่า "เข้าใจยาก/ท้าทายที่สุด" เพราะเหตุใด</span>
                  <div className="detail-text-box">
                    {selectedResponse.feedback12_challenging || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>ไม่ได้ระบุข้อมูล</span>}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '14px' }}>
                  <span className="detail-label" style={{ fontWeight: 600 }}>13. ท่านคิดว่าจำนวนวันและจำนวนสาขาที่เหมาะสมในการฝึกหน้าร้านนี้ควรเป็นอย่างไร</span>
                  <div className="detail-text-box">
                    {selectedResponse.feedback13_ideal_setup || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>ไม่ได้ระบุข้อมูล</span>}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '14px' }}>
                  <span className="detail-label" style={{ fontWeight: 600 }}>14. สิ่งที่ประทับใจในการฝึกหน้าร้าน</span>
                  <div className="detail-text-box">
                    {selectedResponse.feedback14_impressions || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>ไม่ได้ระบุข้อมูล</span>}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '14px' }}>
                  <span className="detail-label" style={{ fontWeight: 600 }}>15. ข้อเสนอแนะอื่นๆ เพื่อการพัฒนาโปรแกรมการฝึกหน้าร้านต่อไป</span>
                  <div className="detail-text-box">
                    {selectedResponse.feedback15_suggestions || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>ไม่ได้ระบุข้อมูล</span>}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
