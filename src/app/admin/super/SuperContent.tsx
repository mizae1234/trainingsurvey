'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { adminLogout } from '@/app/actions/admin';
import { 
  getLineUsers, 
  updateUserRole, 
  getLineGroups, 
  toggleGroupNotifications,
  getLogChats,
  getBuddyTasks,
  completeBuddyTask
} from '@/app/actions/line';
import { 
  Sliders, 
  Users, 
  MessageSquare, 
  Database, 
  Terminal, 
  Shield, 
  LogOut, 
  Search, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  Settings,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface UserData {
  id: string;
  displayName: string;
  role: string;
  pictureUrl: string | null;
  lineUserId: string;
}

interface SuperContentProps {
  currentUser: UserData;
}

export default function SuperContent({ currentUser }: SuperContentProps) {
  const [activeTab, setActiveTab] = useState<'groups' | 'users' | 'logchats' | 'tasks'>('groups');
  
  // States
  const [lineUsers, setLineUsers] = useState<any[]>([]);
  const [lineGroups, setLineGroups] = useState<any[]>([]);
  const [logChats, setLogChats] = useState<any[]>([]);
  const [buddyTasks, setBuddyTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');

  // Collapsible SQL queries state
  const [expandedSql, setExpandedSql] = useState<Record<string, boolean>>({});

  // Pagination
  const [userPage, setUserPage] = useState(1);
  const [groupPage, setGroupPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const itemsPerPage = 10;

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [usersRes, groupsRes, tasksRes] = await Promise.all([
        getLineUsers(),
        getLineGroups(),
        getBuddyTasks()
      ]);
      
      if (usersRes.success) setLineUsers(usersRes.users || []);
      else setErrorMsg(prev => prev || usersRes.error || 'Failed to load users');

      if (groupsRes.success) setLineGroups(groupsRes.groups || []);
      else setErrorMsg(prev => prev || groupsRes.error || 'Failed to load groups');

      if (tasksRes.success) setBuddyTasks(tasksRes.tasks || []);
      else setErrorMsg(prev => prev || tasksRes.error || 'Failed to load tasks');

      if (currentUser.role === 'SUPER_ADMIN' || currentUser.id === 'fallback-admin') {
        const logsRes = await getLogChats();
        if (logsRes.success) setLogChats(logsRes.logs || []);
        else setErrorMsg(prev => prev || logsRes.error || 'Failed to load logs');
      }
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    window.location.href = '/admin/login';
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        setSuccessMsg('อัปเดตบทบาทสำเร็จ');
        setLineUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || 'ไม่สามารถแก้ไขบทบาทได้');
        setTimeout(() => setErrorMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating role');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleGroupToggle = async (groupId: string, enabled: boolean) => {
    try {
      const res = await toggleGroupNotifications(groupId, enabled);
      if (res.success) {
        setSuccessMsg('อัปเดตแจ้งเตือนกลุ่มสำเร็จ');
        setLineGroups(prev => prev.map(g => g.id === groupId ? { ...g, notificationsEnabled: enabled } : g));
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || 'ไม่สามารถแก้ไขแจ้งเตือนได้');
        setTimeout(() => setErrorMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating notifications');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return lineUsers.filter(u => 
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.lineUserId.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [lineUsers, userSearch]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, userPage]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return lineGroups.filter(g => 
      g.groupName.toLowerCase().includes(groupSearch.toLowerCase()) ||
      g.lineGroupId.toLowerCase().includes(groupSearch.toLowerCase())
    );
  }, [lineGroups, groupSearch]);

  const paginatedGroups = useMemo(() => {
    const start = (groupPage - 1) * itemsPerPage;
    return filteredGroups.slice(start, start + itemsPerPage);
  }, [filteredGroups, groupPage]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logChats.filter(log => {
      const matchesSearch = 
        log.question.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.answer.toLowerCase().includes(logSearch.toLowerCase()) ||
        (log.sqlQuery && log.sqlQuery.toLowerCase().includes(logSearch.toLowerCase())) ||
        (log.displayName && log.displayName.toLowerCase().includes(logSearch.toLowerCase())) ||
        (log.groupName && log.groupName.toLowerCase().includes(logSearch.toLowerCase()));

      const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [logChats, logSearch, logStatusFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, logPage]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return buddyTasks.filter(t => {
      const matchesSearch = 
        t.description.toLowerCase().includes(taskSearch.toLowerCase()) ||
        (t.assignee && t.assignee.toLowerCase().includes(taskSearch.toLowerCase())) ||
        (t.displayName && t.displayName.toLowerCase().includes(taskSearch.toLowerCase())) ||
        (t.groupName && t.groupName.toLowerCase().includes(taskSearch.toLowerCase()));

      const matchesStatus = taskStatusFilter === 'all' || t.status === taskStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [buddyTasks, taskSearch, taskStatusFilter]);

  const paginatedTasks = useMemo(() => {
    const start = (taskPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, taskPage]);

  // Format Date Helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="badge badge-green" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}><CheckCircle size={10} /> Success</span>;
      case 'NOT_IN_DB':
        return <span className="badge badge-orange" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}><HelpCircle size={10} /> Not in DB</span>;
      case 'ERROR':
        return <span className="badge badge-red" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}><AlertTriangle size={10} /> Query Error</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="admin-shell">
      <div className="theme-header-bar" />

      {/* Navigation */}
      <nav className="admin-nav">
        <div className="admin-nav-container">
          <div className="admin-brand">
            <Settings size={20} />
            <span>Super Admin Panel</span>
            <div style={{ color: 'var(--primary-red)' }}>บอท & การตั้งค่าระบบ</div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/chat" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={14} /> ทดสอบแชท
            </Link>
            <Link href="/admin/dashboard" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={14} /> ดูแบบสอบถาม HR
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <LogOut size={14} /> ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        
        {/* Alerts */}
        {errorMsg && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
        
        {successMsg && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="admin-tabs">
          <button 
            onClick={() => setActiveTab('groups')} 
            className={`admin-tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
          >
            กลุ่มไลน์บอท ({lineGroups.length})
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          >
            ตั้งค่าสิทธิ์ผู้ใช้งาน ({lineUsers.length})
          </button>
          <button 
            onClick={() => setActiveTab('tasks')} 
            className={`admin-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          >
            งานมอบหมาย (Buddy Tasks) ({buddyTasks.length})
          </button>
          {(currentUser.role === 'SUPER_ADMIN' || currentUser.id === 'fallback-admin') && (
            <button 
              onClick={() => setActiveTab('logchats')} 
              className={`admin-tab-btn ${activeTab === 'logchats' ? 'active' : ''}`}
            >
              ประวัติ Logs แชทกับบอท ({logChats.length})
            </button>
          )}
        </div>

        {/* Groups management */}
        {activeTab === 'groups' && (
          <div className="dashboard-card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>รายชื่อกลุ่มไลน์ (LINE Groups) ที่เชิญบอทเข้า</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>เปิดหรือปิดการแจ้งเตือนแบบประเมินรายกลุ่ม</p>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={groupSearch}
                onChange={(e) => { setGroupSearch(e.target.value); setGroupPage(1); }}
                placeholder="ค้นหาชื่อกลุ่ม หรือไอดีกลุ่ม..."
                className="filter-input"
                style={{ paddingLeft: '36px', maxWidth: '350px' }}
              />
            </div>

            <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ชื่อกลุ่มไลน์</th>
                    <th>LINE Group ID</th>
                    <th style={{ textAlign: 'center', width: '200px' }}>สถานะแจ้งเตือนแบบประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGroups.length > 0 ? (
                    paginatedGroups.map(group => (
                      <tr key={group.id}>
                        <td style={{ fontWeight: 600 }}>{group.groupName}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{group.lineGroupId}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleGroupToggle(group.id, !group.notificationsEnabled)}
                            className={`btn ${group.notificationsEnabled ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ 
                              padding: '6px 16px', 
                              fontSize: '12px', 
                              backgroundColor: group.notificationsEnabled ? 'var(--primary-red)' : '#CBD5E1', 
                              border: 'none', 
                              color: group.notificationsEnabled ? 'white' : 'var(--text-primary)' 
                            }}
                          >
                            {group.notificationsEnabled ? 'เปิดการแจ้งเตือน' : 'ปิดการแจ้งเตือน'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        ไม่พบข้อมูลกลุ่มไลน์ที่บอทเข้าร่วม
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredGroups.length > itemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  แสดงหน้า {groupPage} จากทั้งหมด {Math.ceil(filteredGroups.length / itemsPerPage)} หน้า (พบ {filteredGroups.length} กลุ่ม)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={groupPage === 1} onClick={() => setGroupPage(p => p - 1)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>ก่อนหน้า</button>
                  <button disabled={groupPage === Math.ceil(filteredGroups.length / itemsPerPage)} onClick={() => setGroupPage(p => p + 1)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>ถัดไป</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users management */}
        {activeTab === 'users' && (
          <div className="dashboard-card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>รายชื่อผู้ใช้งาน LINE Login ที่ลงทะเบียนสิทธิ์</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ปรับบทบาทผู้ใช้ในการควบคุมการเข้าหลังบ้าน</p>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                placeholder="ค้นหาตามชื่อผู้ใช้ หรือสิทธิ์..."
                className="filter-input"
                style={{ paddingLeft: '36px', maxWidth: '350px' }}
              />
            </div>

            <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>รูปภาพ</th>
                    <th>ชื่อผู้ใช้ LINE</th>
                    <th>LINE User ID</th>
                    <th style={{ textAlign: 'center', width: '180px' }}>สิทธิ์เข้าหลังบ้าน</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          {user.pictureUrl ? (
                            <img 
                              src={user.pictureUrl} 
                              alt={user.displayName} 
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#64748B' }}>
                              LINE
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{user.displayName}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{user.lineUserId}</td>
                        <td style={{ textAlign: 'center' }}>
                          <select
                            value={user.role}
                            disabled={currentUser.role !== 'SUPER_ADMIN'}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="form-input"
                            style={{ 
                              padding: '6px 10px', 
                              fontSize: '12px', 
                              height: 'auto', 
                              width: '100%', 
                              maxWidth: '140px', 
                              margin: '0 auto',
                              cursor: currentUser.role === 'SUPER_ADMIN' ? 'pointer' : 'not-allowed'
                            }}
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        ไม่พบข้อมูลผู้ใช้งานสิทธิ์หลังบ้าน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredUsers.length > itemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  แสดงหน้า {userPage} จากทั้งหมด {Math.ceil(filteredUsers.length / itemsPerPage)} หน้า (พบ {filteredUsers.length} ผู้ใช้)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>ก่อนหน้า</button>
                  <button disabled={userPage === Math.ceil(filteredUsers.length / itemsPerPage)} onClick={() => setUserPage(p => p + 1)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>ถัดไป</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Log Chats */}
        {activeTab === 'logchats' && (currentUser.role === 'SUPER_ADMIN' || currentUser.id === 'fallback-admin') && (
          <div className="dashboard-card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>ประวัติการแชทกับบอทบัดดี้ (Bot Conversation History Logs)</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ตรวจสอบการสร้าง SQL คิวรีและวิเคราะห์ข้อผิดพลาดย้อนหลัง</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: '250px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => { setLogSearch(e.target.value); setLogPage(1); }}
                  placeholder="ค้นหาข้อความคำถาม คำตอบ หรือ SQL..."
                  className="filter-input"
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>สถานะคิวรี:</span>
                <select
                  value={logStatusFilter}
                  onChange={(e) => { setLogStatusFilter(e.target.value); setLogPage(1); }}
                  className="filter-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="all">ทั้งหมด (All status)</option>
                  <option value="SUCCESS">สำเร็จ (Success SQL)</option>
                  <option value="NOT_IN_DB">ข้อมูลอยู่นอกฐานข้อมูล (Not in DB)</option>
                  <option value="ERROR">เกิดข้อผิดพลาด (Query Error)</option>
                </select>
              </div>
            </div>

            <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <table className="data-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '160px' }}>วันเวลาที่คุย</th>
                    <th style={{ width: '140px' }}>ผู้ใช้งาน / ช่องทาง</th>
                    <th>คำถามผู้ประเมิน / SQL</th>
                    <th>คำตอบของบอท บัดดี้</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => {
                      const logId = log.id;
                      const hasSql = !!log.sqlQuery;
                      const isExpanded = expandedSql[logId];

                      return (
                        <tr key={logId} style={{ verticalAlign: 'top' }}>
                          <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <Clock size={12} />
                              <span>{formatDate(log.createdAt)}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{log.displayName || 'LINE User'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              ID: {log.lineUserId.substring(0, 8)}...
                            </div>
                            {log.lineGroupId ? (
                              <div style={{ fontSize: '10.5px', color: 'var(--primary-red)', marginTop: '2px', fontStyle: 'italic' }} title={log.lineGroupId}>
                                Group: {log.groupName || 'LINE Group'}
                              </div>
                            ) : (
                              <div style={{ fontSize: '10.5px', color: '#0F766E', marginTop: '2px', fontStyle: 'italic' }}>
                                Private Chat
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>"{log.question}"</div>
                            {hasSql && (
                              <div>
                                <button
                                  onClick={() => setExpandedSql(prev => ({ ...prev, [logId]: !isExpanded }))}
                                  style={{
                                    fontSize: '11px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#475569',
                                    background: '#F1F5F9',
                                    border: 'none',
                                    padding: '3px 6px',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                  }}
                                >
                                  <Terminal size={11} /> 
                                  {isExpanded ? 'ซ่อน SQL' : 'แสดง SQL Query'}
                                </button>
                                
                                {isExpanded && (
                                  <div style={{ marginTop: '6px', backgroundColor: '#0F172A', color: '#38BDF8', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11.5px', border: '1px solid #1E293B', width: '100%', overflowX: 'auto', boxSizing: 'border-box' }}>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.sqlQuery}</pre>
                                    {log.sqlError && (
                                      <div style={{ marginTop: '6px', color: '#FCA5A5', borderTop: '1px solid #EF4444', paddingTop: '4px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AlertCircle size={11} style={{ color: '#EF4444', flexShrink: 0 }} />
                                        <span>{log.sqlError}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'pre-line' }}>{log.answer}</td>
                          <td style={{ textAlign: 'center' }}>
                            {getStatusBadge(log.status)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        ไม่พบประวัติการแชทตรงตามเงื่อนไขค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredLogs.length > itemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  แสดงหน้า {logPage} จากทั้งหมด {Math.ceil(filteredLogs.length / itemsPerPage)} หน้า (พบ {filteredLogs.length} รายการ)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={logPage === 1} onClick={() => setLogPage(p => p - 1)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>ก่อนหน้า</button>
                  <button disabled={logPage === Math.ceil(filteredLogs.length / itemsPerPage)} onClick={() => setLogPage(p => p + 1)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>ถัดไป</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tasks management */}
        {activeTab === 'tasks' && (
          <div className="dashboard-card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>รายการงานมอบหมาย (Buddy Tasks)</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>รายการงานมอบหมายทั้งหมดที่บันทึกผ่านบัดดี้โน้ต</p>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '250px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => { setTaskSearch(e.target.value); setTaskPage(1); }}
                  placeholder="ค้นหารายละเอียด ผู้รับผิดชอบ หรือผู้สั่งงาน..."
                  className="filter-input"
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
              </div>
              <select
                value={taskStatusFilter}
                onChange={(e) => { setTaskStatusFilter(e.target.value); setTaskPage(1); }}
                className="filter-input"
                style={{ maxWidth: '180px' }}
              >
                <option value="all">ทุกสถานะ</option>
                <option value="PENDING">กำลังดำเนินการ (PENDING)</option>
                <option value="COMPLETED">เสร็จสิ้น (COMPLETED)</option>
              </select>
            </div>

            {/* Table */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                กำลังโหลดข้อมูล...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #E2E8F0' }}>
                ไม่พบข้อมูลงานมอบหมาย
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="survey-table" style={{ minWidth: '800px', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>ID</th>
                        <th style={{ width: '120px' }}>สถานะ</th>
                        <th style={{ width: '150px' }}>ผู้รับผิดชอบ</th>
                        <th style={{ width: '180px' }}>ผู้สั่งงาน</th>
                        <th>รายละเอียดงาน</th>
                        <th style={{ width: '150px' }}>วันที่มอบหมาย</th>
                        <th style={{ width: '100px' }}>การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTasks.map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 600 }}>#{t.id}</td>
                          <td>
                            {t.status === 'COMPLETED' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                                <CheckCircle size={10} /> เสร็จสิ้น
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#FFEDD5', color: '#9A3412', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                                <Clock size={10} /> ดำเนินการ
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                            {t.assignee || 'ไม่ได้ระบุ'}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{t.displayName || 'LINE User'}</div>
                            {t.groupName && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                กลุ่ม: {t.groupName}
                              </div>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '300px' }}>
                            {t.description}
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {formatDate(t.createdAt)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Link 
                                href={`/admin/tasks?id=${t.id}`}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                              >
                                ดูหน้ารายละเอียด
                              </Link>
                              {t.status !== 'COMPLETED' && (
                                <button
                                  onClick={async () => {
                                    if (confirm('คุณต้องการเปลี่ยนสถานะงานนี้เป็นเสร็จสิ้นใช่หรือไม่?')) {
                                      try {
                                        const res = await completeBuddyTask(t.id);
                                        if (res.success) {
                                          setSuccessMsg('บันทึกงานเสร็จสิ้นสำเร็จ');
                                          setBuddyTasks(prev => prev.map(item => item.id === t.id ? { ...item, status: 'COMPLETED' } : item));
                                          setTimeout(() => setSuccessMsg(null), 3000);
                                        } else {
                                          setErrorMsg(res.error || 'ไม่สามารถอัปเดตงานได้');
                                          setTimeout(() => setErrorMsg(null), 4000);
                                        }
                                      } catch (err: any) {
                                        setErrorMsg(err.message || 'Error completing task');
                                        setTimeout(() => setErrorMsg(null), 4000);
                                      }
                                    }
                                  }}
                                  className="btn btn-primary"
                                  style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap', backgroundColor: '#10B981', borderColor: '#10B981' }}
                                >
                                  เสร็จสิ้น
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredTasks.length > itemsPerPage && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      แสดง {Math.min(filteredTasks.length, (taskPage - 1) * itemsPerPage + 1)} ถึง {Math.min(filteredTasks.length, taskPage * itemsPerPage)} จาก {filteredTasks.length} รายการ
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setTaskPage(prev => Math.max(prev - 1, 1))}
                        disabled={taskPage === 1}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        onClick={() => setTaskPage(prev => Math.min(prev + 1, Math.ceil(filteredTasks.length / itemsPerPage)))}
                        disabled={taskPage >= Math.ceil(filteredTasks.length / itemsPerPage)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
