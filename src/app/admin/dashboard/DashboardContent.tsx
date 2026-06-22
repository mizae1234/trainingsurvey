'use client';

import React, { useState, useMemo } from 'react';
import { adminLogout } from '@/app/actions/admin';
import * as XLSX from 'xlsx';
import Link from 'next/link';
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
  HelpCircle,
  Award,
  AlertTriangle,
  MessageSquare,
  Settings
} from 'lucide-react';

interface ResponseData {
  id: string;
  createdAt: string;
  department: string | null;
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

interface UserData {
  id: string;
  displayName: string;
  role: string;
  pictureUrl: string | null;
  lineUserId: string;
}

interface DashboardContentProps {
  initialResponses: ResponseData[];
  currentUser: UserData;
}

export default function DashboardContent({ initialResponses, currentUser }: DashboardContentProps) {
  // CONFIG: ตั้งค่าเป็น false เพื่อปิดการทำงานของปุ่มส่งออก Excel ชั่วคราว (ปุ่มหลอกกดแล้วไม่เกิดอะไรขึ้น)
  // เปลี่ยนกลับเป็น true เมื่อต้องการให้ปุ่มทำงานส่งออกไฟล์ปกติ
  const ENABLE_EXPORT = true;

  const [responses, setResponses] = useState<ResponseData[]>(initialResponses);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [suitabilityFilter, setSuitabilityFilter] = useState('all');
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tabs and branch view states
  const [activeTab, setActiveTab] = useState<'overview' | 'branches'>('overview');
  const [branchSearchTerm, setBranchSearchTerm] = useState('');
  const [branchSortKey, setBranchSortKey] = useState<'name' | 'count' | 'average'>('average');
  const [branchSortOrder, setBranchSortOrder] = useState<'asc' | 'desc'>('desc');
  const [branchCurrentPage, setBranchCurrentPage] = useState(1);
  const branchItemsPerPage = 10;


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

  // Branch-by-branch aggregated stats
  const branchPerformance = useMemo(() => {
    const branchesMap: Record<string, {
      branchName: string;
      responseCount: number;
      q5Sum: number;
      q6Sum: number;
      q7Sum: number;
      q8Sum: number;
      q9Sum: number;
      q10Sum: number;
      q11Sum: number;
      totalScoreSum: number;
    }> = {};

    filteredResponses.forEach(res => {
      // Process Branch 1
      if (res.branch1) {
        const b1 = res.branch1.trim();
        if (b1) {
          if (!branchesMap[b1]) {
            branchesMap[b1] = {
              branchName: b1,
              responseCount: 0,
              q5Sum: 0,
              q6Sum: 0,
              q7Sum: 0,
              q8Sum: 0,
              q9Sum: 0,
              q10Sum: 0,
              q11Sum: 0,
              totalScoreSum: 0
            };
          }
          const bData = branchesMap[b1];
          bData.responseCount += 1;
          bData.q5Sum += res.q5_clarity_branch1;
          bData.q6Sum += res.q6_volume_branch1;
          bData.q7Sum += res.q7_readiness_branch1;
          bData.q8Sum += res.q8_trainer_knowledge_branch1;
          bData.q9Sum += res.q9_safety_hygiene_branch1;
          bData.q10Sum += res.q10_trainer_care_branch1;
          bData.q11Sum += res.q11_atmosphere_branch1;
          bData.totalScoreSum += (
            res.q5_clarity_branch1 +
            res.q6_volume_branch1 +
            res.q7_readiness_branch1 +
            res.q8_trainer_knowledge_branch1 +
            res.q9_safety_hygiene_branch1 +
            res.q10_trainer_care_branch1 +
            res.q11_atmosphere_branch1
          ) / 7;
        }
      }

      // Process Branch 2
      if (res.branch2) {
        const b2 = res.branch2.trim();
        if (b2) {
          if (!branchesMap[b2]) {
            branchesMap[b2] = {
              branchName: b2,
              responseCount: 0,
              q5Sum: 0,
              q6Sum: 0,
              q7Sum: 0,
              q8Sum: 0,
              q9Sum: 0,
              q10Sum: 0,
              q11Sum: 0,
              totalScoreSum: 0
            };
          }
          const bData = branchesMap[b2];
          bData.responseCount += 1;
          bData.q5Sum += res.q5_clarity_branch2;
          bData.q6Sum += res.q6_volume_branch2;
          bData.q7Sum += res.q7_readiness_branch2;
          bData.q8Sum += res.q8_trainer_knowledge_branch2;
          bData.q9Sum += res.q9_safety_hygiene_branch2;
          bData.q10Sum += res.q10_trainer_care_branch2;
          bData.q11Sum += res.q11_atmosphere_branch2;
          bData.totalScoreSum += (
            res.q5_clarity_branch2 +
            res.q6_volume_branch2 +
            res.q7_readiness_branch2 +
            res.q8_trainer_knowledge_branch2 +
            res.q9_safety_hygiene_branch2 +
            res.q10_trainer_care_branch2 +
            res.q11_atmosphere_branch2
          ) / 7;
        }
      }
    });

    // Convert map to array and compute averages
    let list = Object.values(branchesMap).map(b => {
      const count = b.responseCount;
      return {
        branchName: b.branchName,
        responseCount: count,
        avgQ5: parseFloat((b.q5Sum / count).toFixed(2)),
        avgQ6: parseFloat((b.q6Sum / count).toFixed(2)),
        avgQ7: parseFloat((b.q7Sum / count).toFixed(2)),
        avgQ8: parseFloat((b.q8Sum / count).toFixed(2)),
        avgQ9: parseFloat((b.q9Sum / count).toFixed(2)),
        avgQ10: parseFloat((b.q10Sum / count).toFixed(2)),
        avgQ11: parseFloat((b.q11Sum / count).toFixed(2)),
        avgTotal: parseFloat((b.totalScoreSum / count).toFixed(2))
      };
    });

    // Apply specific branch search filter (if any)
    if (branchSearchTerm) {
      list = list.filter(b => b.branchName.toLowerCase().includes(branchSearchTerm.toLowerCase()));
    }

    // Apply sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (branchSortKey === 'name') {
        comparison = a.branchName.localeCompare(b.branchName);
      } else if (branchSortKey === 'count') {
        comparison = a.responseCount - b.responseCount;
      } else if (branchSortKey === 'average') {
        comparison = a.avgTotal - b.avgTotal;
      }

      return branchSortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [filteredResponses, branchSearchTerm, branchSortKey, branchSortOrder]);

  // Paginated branch performance
  const paginatedBranchPerformance = useMemo(() => {
    const startIndex = (branchCurrentPage - 1) * branchItemsPerPage;
    return branchPerformance.slice(startIndex, startIndex + branchItemsPerPage);
  }, [branchPerformance, branchCurrentPage]);

  const totalBranchPages = Math.ceil(branchPerformance.length / branchItemsPerPage);


  const branchSummaryStats = useMemo(() => {
    const allDistinctBranches = new Set<string>();
    const branchScores: Record<string, { total: number; count: number }> = {};

    filteredResponses.forEach(res => {
      if (res.branch1 && res.branch1.trim()) {
        const b = res.branch1.trim();
        allDistinctBranches.add(b);
        if (!branchScores[b]) branchScores[b] = { total: 0, count: 0 };
        branchScores[b].total += (
          res.q5_clarity_branch1 +
          res.q6_volume_branch1 +
          res.q7_readiness_branch1 +
          res.q8_trainer_knowledge_branch1 +
          res.q9_safety_hygiene_branch1 +
          res.q10_trainer_care_branch1 +
          res.q11_atmosphere_branch1
        ) / 7;
        branchScores[b].count += 1;
      }
      if (res.branch2 && res.branch2.trim()) {
        const b = res.branch2.trim();
        allDistinctBranches.add(b);
        if (!branchScores[b]) branchScores[b] = { total: 0, count: 0 };
        branchScores[b].total += (
          res.q5_clarity_branch2 +
          res.q6_volume_branch2 +
          res.q7_readiness_branch2 +
          res.q8_trainer_knowledge_branch2 +
          res.q9_safety_hygiene_branch2 +
          res.q10_trainer_care_branch2 +
          res.q11_atmosphere_branch2
        ) / 7;
        branchScores[b].count += 1;
      }
    });

    const branchesList = Object.entries(branchScores).map(([name, data]) => ({
      name,
      average: parseFloat((data.total / data.count).toFixed(2)),
      count: data.count
    }));

    const sortedByScore = [...branchesList].sort((a, b) => b.average - a.average);

    return {
      totalDistinctBranches: allDistinctBranches.size,
      highestRated: sortedByScore[0] || null,
      lowestRated: sortedByScore[sortedByScore.length - 1] || null,
      topBranches: sortedByScore.slice(0, 5),
      bottomBranches: [...sortedByScore].reverse().slice(0, 5)
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

  // Export directly to Excel (.xlsx) format using SheetJS (xlsx)
  const handleExportExcel = () => {
    if (!ENABLE_EXPORT) return;
    const headers = [
      'ไอดี', 'วันที่ประเมิน', 'ฝ่ายงานที่ท่านสังกัด', 'สาขาที่ 1', 'วันที่เริ่ม (สาขา 1)', 'วันที่สิ้นสุด (สาขา 1)', 'ระยะเวลา (วัน)',
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

    const dataRows = filteredResponses.map(r => [
      r.id,
      new Date(r.createdAt).toLocaleDateString('th-TH'),
      r.department || '',
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
      r.feedback12_challenging || '',
      r.feedback13_ideal_setup || '',
      r.feedback14_impressions || '',
      r.feedback15_suggestions || ''
    ]);

    // Create a new workbook and convert data rows to a worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "ผลลัพธ์แบบประเมิน");

    // Save/Download Excel file
    XLSX.writeFile(wb, `survey_responses_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportBranchExcel = () => {
    if (!ENABLE_EXPORT) return;
    const headers = [
      'ชื่อสาขา',
      'จำนวนการประเมิน (ครั้ง)',
      'คะแนนเฉลี่ยรวม',
      '5. การสอน (ขั้นตอนชัดเจน)',
      '6. ปริมาณเนื้อหา (เหมาะสมกับเวลา)',
      '7. อุปกรณ์การสอน (พร้อมใช้งาน)',
      '8. พี่เลี้ยง/ผู้สอน (ความรู้ความเชี่ยวชาญ)',
      '9. พี่เลี้ยง/ผู้สอน (ความปลอดภัย/Food Safety)',
      '10. พี่เลี้ยง/ผู้สอน (ใส่ใจเป็นกันเอง)',
      '11. บรรยากาศสาขา (ต้อนรับสนับสนุน)'
    ];

    const dataRows = branchPerformance.map(b => [
      b.branchName,
      b.responseCount,
      b.avgTotal,
      b.avgQ5,
      b.avgQ6,
      b.avgQ7,
      b.avgQ8,
      b.avgQ9,
      b.avgQ10,
      b.avgQ11
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    XLSX.utils.book_append_sheet(wb, ws, "ประสิทธิภาพรายสาขา");
    XLSX.writeFile(wb, `branch_performance_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const getBranchBadgeClass = (score: number) => {
    if (score >= 3.5) return 'badge-green';
    if (score >= 2.5) return 'badge-orange';
    return 'badge-red';
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
              <>
                <Link href="/chat" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} /> ทดสอบแชทบอท
                </Link>
                <Link href="/admin/super" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Settings size={14} /> แผงควบคุมบอท
                </Link>
              </>
            )}
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <LogOut size={15} /> ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        
        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            onClick={() => { setActiveTab('overview'); }} 
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          >
            ภาพรวมและผู้ตอบแบบประเมิน ({stats.total})
          </button>
          <button 
            onClick={() => { setActiveTab('branches'); }} 
            className={`admin-tab-btn ${activeTab === 'branches' ? 'active' : ''}`}
          >
            ประสิทธิภาพแยกรายสาขา ({branchSummaryStats.totalDistinctBranches})
          </button>
        </div>

        {activeTab === 'overview' && (
          <>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon red">
              <Users size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">แบบประเมินที่ส่งทั้งหมด</span>
              <span className="stat-value">{stats.total} ชุด</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">
              <Star size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">ความพึงพอใจภาพรวม</span>
              <span className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
                {stats.avgGeneral} 
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 4.00</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-red)', marginLeft: '4px' }}>
                  ({((stats.avgGeneral / 4) * 100).toFixed(1)}%)
                </span>
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
              
              <div style={{ height: '220px', padding: '10px 10px 0 10px' }}>
                <div style={{ 
                  height: '160px', 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  justifyContent: 'space-around', 
                  position: 'relative',
                  borderBottom: '2px solid #94A3B8',
                  margin: '20px 10px 30px 40px',
                }}>
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((percent) => {
                    return (
                      <div 
                        key={percent} 
                        style={{ 
                          position: 'absolute', 
                          left: '0', 
                          right: '0', 
                          bottom: `${percent}%`, 
                          borderBottom: '1px dashed #E2E8F0', 
                          zIndex: 0 
                        }}
                      >
                        <span style={{ 
                          fontSize: '10px', 
                          color: 'var(--text-muted)', 
                          position: 'absolute', 
                          left: '-35px', 
                          top: '-6px',
                          textAlign: 'right',
                          width: '30px'
                        }}>
                          {percent}%
                        </span>
                      </div>
                    );
                  })}

                  {/* Bars representing scores 1-4 */}
                  {[1, 2, 3, 4].map((score) => {
                    const count = chartsData.scores[score as 4|3|2|1] || 0;
                    const totalRatings = stats.total * 3;
                    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                    // Red accent for high, yellow for moderate, light for low
                    let fillColor = 'var(--border-color)';
                    if (score === 4) fillColor = 'var(--primary-red)';
                    else if (score === 3) fillColor = 'var(--primary-yellow)';
                    else if (score === 2) fillColor = '#F472B6'; // Pink
                    else if (score === 1) fillColor = '#FDA4AF'; // Light rose

                    return (
                      <div 
                        key={score} 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          position: 'relative', 
                          zIndex: 1, 
                          width: '60px',
                          height: '100%',
                          justifyContent: 'flex-end'
                        }}
                      >
                        {/* Value Text */}
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '600', 
                          color: 'var(--text-primary)', 
                          marginBottom: '6px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap'
                        }}>
                          {count} ({percentage.toFixed(0)}%)
                        </span>

                        {/* Bar block */}
                        {count > 0 && (
                          <div 
                            style={{ 
                              width: '36px', 
                              height: `${percentage}%`, 
                              backgroundColor: fillColor, 
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.3s ease'
                            }} 
                          />
                        )}

                        {/* X Axis Label */}
                        <span style={{ 
                          position: 'absolute', 
                          bottom: '-22px', 
                          fontSize: '11px', 
                          fontWeight: '500', 
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap'
                        }}>
                          คะแนน {score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#FDA4AF' }} />
                  <span>1: ไม่เห็นด้วยอย่างยิ่ง</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#F472B6' }} />
                  <span>2: ไม่เห็นด้วย</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'var(--primary-yellow)' }} />
                  <span>3: เห็นด้วย</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'var(--primary-red)' }} />
                  <span>4: เห็นด้วยอย่างยิ่ง</span>
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
                    <span>4.1 ระยะเวลาในการฝึกหน้าร้าน</span>
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
                    <span>4.2 จำนวนสาขาในการฝึกหน้าร้าน</span>
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


            </div>

            <button 
              onClick={handleExportExcel} 
              disabled={filteredResponses.length === 0}
              className="btn btn-primary" 
              style={{ backgroundColor: 'var(--primary-green)', padding: '10px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FileSpreadsheet size={15} /> ส่งออกไฟล์ Excel (.xlsx)
            </button>
          </div>

          {/* Table display */}
          <div style={{ padding: '0px 24px' }}>
            <div className="table-responsive" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>วันที่ประเมิน</th>
                    <th>ฝ่ายงานที่สังกัด</th>
                    <th>สาขาที่ 1</th>
                    <th>สาขาที่ 2</th>
                    <th style={{ textAlign: 'center' }}>เวลาฝึกหน้าร้าน (วัน)</th>
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
                          <td style={{ fontWeight: 500 }}>{res.department}</td>
                          <td style={{ fontWeight: 500 }}>{res.branch1}</td>
                          <td style={{ fontWeight: 500 }}>{res.branch2}</td>
                          <td style={{ textAlign: 'center' }}>{totalDays} วัน</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${getRatingBadgeClass(rowAvg)}`} style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px', padding: '6px 10px', minWidth: '80px' }}>
                              <span style={{ fontWeight: 600 }}>{rowAvg.toFixed(2)} / 4.00</span>
                              <span style={{ fontSize: '9.5px', opacity: 0.9 }}>{((rowAvg / 4) * 100).toFixed(1)}%</span>
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
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
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
                  แสดงหน้า {currentPage} จากทั้งหมด {totalPages} หน้า (พบ {filteredResponses.length} ชุด)
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

          </>
        )}

        {activeTab === 'branches' && (
          <>
            {/* KPI Statistics for Branches */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon red">
                  <TrendingUp size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">สาขาที่ได้รับการประเมิน</span>
                  <span className="stat-value">{branchSummaryStats.totalDistinctBranches} สาขา</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
                  <Award size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">สาขาคะแนนเฉลี่ยสูงสุด</span>
                  <span className="stat-value" style={{ fontSize: '15px', fontWeight: 700 }}>
                    {branchSummaryStats.highestRated ? branchSummaryStats.highestRated.name : 'ไม่มีข้อมูล'}
                  </span>
                  {branchSummaryStats.highestRated && (
                    <span style={{ fontSize: '11px', color: '#2E7D32', fontWeight: 600 }}>
                      {branchSummaryStats.highestRated.average.toFixed(2)} / 4.00 ({((branchSummaryStats.highestRated.average / 4) * 100).toFixed(1)}%) (ประเมิน {branchSummaryStats.highestRated.count} ครั้ง)
                    </span>
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon yellow" style={{ backgroundColor: '#FFF3E0', color: '#E65100' }}>
                  <AlertTriangle size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">สาขาที่ควรปรับปรุงสูงสุด</span>
                  <span className="stat-value" style={{ fontSize: '15px', fontWeight: 700 }}>
                    {branchSummaryStats.lowestRated ? branchSummaryStats.lowestRated.name : 'ไม่มีข้อมูล'}
                  </span>
                  {branchSummaryStats.lowestRated && (
                    <span style={{ fontSize: '11px', color: '#E65100', fontWeight: 600 }}>
                      {branchSummaryStats.lowestRated.average.toFixed(2)} / 4.00 ({((branchSummaryStats.lowestRated.average / 4) * 100).toFixed(1)}%) (ประเมิน {branchSummaryStats.lowestRated.count} ครั้ง)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Leaderboard Cards */}
            <div className="leaderboard-grid">
              {/* Top 5 Branches */}
              <div className="leaderboard-card">
                <div className="leaderboard-title-row">
                  <div className="leaderboard-title" style={{ color: '#2E7D32' }}>
                    <Award size={18} />
                    <span>อันดับสาขาคะแนนสูงสุด (Top 5 Branches)</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>คะแนนเฉลี่ย</span>
                </div>
                <div className="leaderboard-list">
                  {branchSummaryStats.topBranches.length > 0 ? (
                    branchSummaryStats.topBranches.map((b, index) => (
                      <div key={b.name} className="leaderboard-item">
                        <div className="leaderboard-rank-info">
                          <div className="leaderboard-rank">{index + 1}</div>
                          <div>
                            <div className="leaderboard-branch-name">{b.name}</div>
                            <div className="leaderboard-reviews-count">ประเมิน {b.count} ครั้ง</div>
                          </div>
                        </div>
                        <span className="badge badge-green">{b.average.toFixed(2)} / 4.00 ({((b.average / 4) * 100).toFixed(1)}%)</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      ไม่มีข้อมูล
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom 5 Branches */}
              <div className="leaderboard-card">
                <div className="leaderboard-title-row">
                  <div className="leaderboard-title" style={{ color: '#C62828' }}>
                    <AlertTriangle size={18} />
                    <span>อันดับสาขาคะแนนต่ำสุด (Bottom 5 Branches)</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>คะแนนเฉลี่ย</span>
                </div>
                <div className="leaderboard-list">
                  {branchSummaryStats.bottomBranches.length > 0 ? (
                    branchSummaryStats.bottomBranches.map((b, index) => {
                      const rankNumber = branchSummaryStats.totalDistinctBranches - branchSummaryStats.bottomBranches.length + index + 1;
                      return (
                        <div key={b.name} className="leaderboard-item">
                          <div className="leaderboard-rank-info">
                            <div className="leaderboard-rank" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>{rankNumber}</div>
                            <div>
                              <div className="leaderboard-branch-name">{b.name}</div>
                              <div className="leaderboard-reviews-count">ประเมิน {b.count} ครั้ง</div>
                            </div>
                          </div>
                          <span className={`badge ${b.average >= 3.5 ? 'badge-green' : b.average >= 2.5 ? 'badge-orange' : 'badge-red'}`}>{b.average.toFixed(2)} / 4.00 ({((b.average / 4) * 100).toFixed(1)}%)</span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      ไม่มีข้อมูล
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Branch Detailed Table */}
            <div className="dashboard-card" style={{ padding: '24px 0px', marginTop: '24px' }}>
              <div style={{ padding: '0px 24px 16px 24px', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>ตารางประสิทธิภาพรายสาขาโดยละเอียด</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  แสดงค่าเฉลี่ยของหัวข้อประเมิน 7 หมวดหมู่แยกรายสาขา (คะแนนเต็ม 4.00)
                </p>
              </div>

              {/* Filters Toolbar */}
              <div style={{ padding: '16px 24px', backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-color)' }} className="toolbar">
                <div className="filters-wrapper">
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อสาขา..."
                      value={branchSearchTerm}
                      onChange={(e) => { setBranchSearchTerm(e.target.value); setBranchCurrentPage(1); }}
                      className="filter-input"
                      style={{ paddingLeft: '34px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>จัดเรียงตาม:</span>
                    <select
                      value={branchSortKey}
                      onChange={(e) => { setBranchSortKey(e.target.value as any); setBranchCurrentPage(1); }}
                      className="filter-input"
                      style={{ cursor: 'pointer', minWidth: '150px' }}
                    >
                      <option value="average">คะแนนเฉลี่ยรวม</option>
                      <option value="name">ชื่อสาขา</option>
                      <option value="count">จำนวนครั้งที่ประเมิน</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ลำดับ:</span>
                    <select
                      value={branchSortOrder}
                      onChange={(e) => { setBranchSortOrder(e.target.value as any); setBranchCurrentPage(1); }}
                      className="filter-input"
                      style={{ cursor: 'pointer', minWidth: '100px' }}
                    >
                      <option value="desc">มาก {"->"} น้อย</option>
                      <option value="asc">น้อย {"->"} มาก</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleExportBranchExcel} 
                  disabled={branchPerformance.length === 0}
                  className="btn btn-primary" 
                  style={{ backgroundColor: 'var(--primary-green)', padding: '10px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileSpreadsheet size={15} /> ส่งออกรายงานแยกรายสาขา
                </button>
              </div>

              {/* Table */}
              <div style={{ padding: '0px 24px' }}>
                <div className="table-responsive" style={{ border: 'none', boxShadow: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ชื่อสาขา</th>
                        <th style={{ textAlign: 'center' }}>จำนวนการประเมิน</th>
                        <th style={{ textAlign: 'center' }}>คะแนนเฉลี่ยรวม</th>
                        <th style={{ textAlign: 'center' }} title="5. การสอนมีความชัดเจน เป็นลำดับขั้นตอน ไม่สับสน">Q5 การสอน</th>
                        <th style={{ textAlign: 'center' }} title="6. ปริมาณเนื้อหาและงานมีความเหมาะสมกับเวลา">Q6 เนื้อหา</th>
                        <th style={{ textAlign: 'center' }} title="7. อุปกรณ์เครื่องมือ หรือเอกสารประกอบการสอนพร้อมใช้งาน">Q7 อุปกรณ์</th>
                        <th style={{ textAlign: 'center' }} title="8. พี่เลี้ยงมีความรู้ความเชี่ยวชาญ ถ่ายทอดเนื้อหาได้เข้าใจ">Q8 พี่เลี้ยง(ความรู้)</th>
                        <th style={{ textAlign: 'center' }} title="9. พี่เลี้ยงสอนเรื่องความปลอดภัยและสุขอนามัย (Food Safety)">Q9 ความปลอดภัย</th>
                        <th style={{ textAlign: 'center' }} title="10. พี่เลี้ยงมีความใส่ใจ เป็นมิตร เปิดโอกาสให้สอบถาม">Q10 พี่เลี้ยง(ใส่ใจ)</th>
                        <th style={{ textAlign: 'center' }} title="11. ภาพรวมทีมงานและบรรยากาศในสาขาให้การต้อนรับดี">Q11 บรรยากาศ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBranchPerformance.length > 0 ? (
                        paginatedBranchPerformance.map((b) => (
                          <tr key={b.branchName} style={{ cursor: 'default' }}>
                            <td style={{ fontWeight: 600 }}>{b.branchName}</td>
                            <td style={{ textAlign: 'center' }}>{b.responseCount} ครั้ง</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`badge ${getBranchBadgeClass(b.avgTotal)}`} style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px', padding: '6px 10px', minWidth: '60px' }}>
                                <span style={{ fontWeight: 600 }}>{b.avgTotal.toFixed(2)}</span>
                                <span style={{ fontSize: '9px', opacity: 0.9 }}>{((b.avgTotal / 4) * 100).toFixed(1)}%</span>
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <div>{b.avgQ5.toFixed(2)}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{((b.avgQ5 / 4) * 100).toFixed(1)}%</div>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <div>{b.avgQ6.toFixed(2)}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{((b.avgQ6 / 4) * 100).toFixed(1)}%</div>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <div>{b.avgQ7.toFixed(2)}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{((b.avgQ7 / 4) * 100).toFixed(1)}%</div>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <div>{b.avgQ8.toFixed(2)}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{((b.avgQ8 / 4) * 100).toFixed(1)}%</div>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <div>{b.avgQ9.toFixed(2)}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{((b.avgQ9 / 4) * 100).toFixed(1)}%</div>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <div>{b.avgQ10.toFixed(2)}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{((b.avgQ10 / 4) * 100).toFixed(1)}%</div>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <div>{b.avgQ11.toFixed(2)}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{((b.avgQ11 / 4) * 100).toFixed(1)}%</div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                            ไม่พบข้อมูลผลลัพธ์แบบประเมินรายสาขาที่ค้นหา
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Branch Pagination Controls */}
                {totalBranchPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      แสดงหน้า {branchCurrentPage} จากทั้งหมด {totalBranchPages} หน้า (พบ {branchPerformance.length} สาขา)
                    </span>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        disabled={branchCurrentPage === 1}
                        onClick={() => setBranchCurrentPage(p => p - 1)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        disabled={branchCurrentPage === totalBranchPages}
                        onClick={() => setBranchCurrentPage(p => p + 1)}
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
          </>
        )}

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
              
              {/* Department */}
              <div className="detail-sec" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="detail-label" style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>ฝ่ายงานที่สังกัด:</span>
                  <span className="detail-val" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--primary-red)' }}>{selectedResponse.department || 'ไม่พบข้อมูล'}</span>
                </div>
              </div>

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
