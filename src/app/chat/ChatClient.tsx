'use client';

import React, { useState, useRef, useEffect } from 'react';
import { askBotWebAction } from '@/app/actions/line';
import { MessageSquare, Send, ArrowLeft, Terminal, AlertCircle, Database, Shield } from 'lucide-react';
import Link from 'next/link';

interface UserData {
  id: string;
  displayName: string;
  role: string;
  pictureUrl: string | null;
  lineUserId: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  sqlQuery?: string | null;
  sqlError?: string | null;
  status?: string;
}

interface ChatClientProps {
  currentUser: UserData;
}

export default function ChatClient({ currentUser }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `สวัสดีครับคุณ ${currentUser.displayName}! ผม "บัดดี้" (Buddy) ผู้ช่วยอัจฉริยะที่จะช่วยรายงานข้อมูลสถิติและผลคะแนนประเมินการฝึกหน้าร้านครับ 📊✨\n\nสามารถสอบถามข้อมูลที่ต้องการได้เลยครับ (เช่น "ขอคะแนนเฉลี่ยภาพรวมทั้งหมด" หรือ "สรุปสถิติคะแนนของสาขาบางนา") 💛`,
      timestamp: new Date()
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expandedSql, setExpandedSql] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = inputVal.trim();
    if (!query || isTyping) return;

    // 1. Add User Message
    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      // 2. Call server action
      const res = await askBotWebAction(query);

      // 3. Add Bot Response
      const botMsgId = `bot-${Date.now()}`;
      if (res.success) {
        setMessages(prev => [...prev, {
          id: botMsgId,
          sender: 'bot',
          text: res.answer || '',
          sqlQuery: res.sqlQuery,
          sqlError: res.sqlError,
          status: res.status,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: botMsgId,
          sender: 'bot',
          text: res.error || 'เกิดข้อผิดพลาดในการติดต่อระบบบอท',
          timestamp: new Date(),
          status: 'ERROR'
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: `เกิดข้อผิดพลาดในระบบ: ${err.message}`,
        timestamp: new Date(),
        status: 'ERROR'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleSql = (msgId: string) => {
    setExpandedSql(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  return (
    <div className="admin-shell" style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
      <div className="theme-header-bar" />

      {/* Top Navigation */}
      <nav className="admin-nav" style={{ flexShrink: 0 }}>
        <div className="admin-nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/admin/dashboard" className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> กลับหน้าแดชบอร์ด
            </Link>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} style={{ color: 'var(--primary-red)' }} />
              <span style={{ fontWeight: 600, fontSize: '16px' }}>LINE Bot Simulator & Playground</span>
              <span className="badge badge-secondary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Web Test client</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentUser.role === 'SUPER_ADMIN' && (
              <Link href="/admin/super" className="btn btn-secondary" style={{ color: 'var(--primary-red)', border: '1px solid var(--primary-red)', padding: '8px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} /> ตั้งค่าระบบ Super Admin
              </Link>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{currentUser.displayName}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>สิทธิ์: {currentUser.role}</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Chat Container */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '900px', width: '100%', margin: '0 auto', padding: '16px 24px' }}>
        
        {/* Messages list */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  width: '100%' 
                }}
              >
                <div 
                  style={{ 
                    maxWidth: '80%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  {/* Bubble content */}
                  <div 
                    style={{ 
                      padding: '12px 16px', 
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px', 
                      backgroundColor: isUser ? 'var(--primary-red)' : '#F1F5F9',
                      color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-line',
                      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* SQL Details (Only for bot messages with SQL generated) */}
                  {!isUser && msg.sqlQuery && (
                    <div style={{ width: '100%', marginTop: '6px' }}>
                      <button
                        onClick={() => toggleSql(msg.id)}
                        style={{
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#475569',
                          background: '#E2E8F0',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <Terminal size={12} /> 
                        {expandedSql[msg.id] ? 'ซ่อนคำสั่ง SQL' : 'ดูคำสั่ง SQL ที่บอทสร้าง'}
                      </button>

                      {expandedSql[msg.id] && (
                        <div style={{ marginTop: '6px', backgroundColor: '#0F172A', color: '#38BDF8', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #1E293B', width: '100%', boxSizing: 'border-box', overflowX: 'auto' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', borderBottom: '1px solid #1E293B', paddingBottom: '6px', marginBottom: '6px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Database size={10} /> PostgreSQL Query
                            </span>
                            <span style={{ color: msg.sqlError ? '#EF4444' : '#10B981' }}>
                              {msg.sqlError ? 'Execution Error' : 'Success'}
                            </span>
                          </div>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{msg.sqlQuery}</pre>
                          {msg.sqlError && (
                            <div style={{ marginTop: '8px', color: '#FCA5A5', borderTop: '1px solid #EF4444', paddingTop: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={12} style={{ color: '#EF4444', flexShrink: 0 }} />
                              <span>{msg.sqlError}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {msg.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 2px', backgroundColor: '#F1F5F9', color: 'var(--text-muted)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '4px' }} className="typing-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <span>บัดดี้ กำลังอ่านคิวรีประมวลผลข้อมูล...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input box */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="ถามข้อคำถาม เช่น 'ขอบริบทเฉลี่ยประเมินแยกตามสาขา'..."
            disabled={isTyping}
            className="filter-input"
            style={{ 
              flexGrow: 1, 
              padding: '14px 18px', 
              fontSize: '14px', 
              borderRadius: '12px', 
              backgroundColor: '#FFFFFF', 
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              border: '1px solid var(--border-color)'
            }}
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isTyping}
            className="btn btn-primary"
            style={{ 
              borderRadius: '12px', 
              padding: '0 20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px', 
              backgroundColor: 'var(--primary-red)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              cursor: (!inputVal.trim() || isTyping) ? 'not-allowed' : 'pointer'
            }}
          >
            <span>ส่งข้อความ</span> <Send size={15} />
          </button>
        </form>
      </div>

      <style jsx global>{`
        .dot {
          width: 6px;
          height: 6px;
          background-color: #64748B;
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
}
