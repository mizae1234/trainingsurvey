'use client';

import React, { useState, useEffect, useRef } from 'react';
import { submitOfficeSurvey, checkOfficeSurveyStatus } from '@/app/actions/officeSurvey';
import {
  Sparkles,
  Heart,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ThumbsUp,
  Wrench,
  PlusCircle,
  Target,
  MessageSquareHeart,
  RotateCcw,
} from 'lucide-react';
import './style.css';

const DRAFT_STORAGE_KEY = 'mcthai_hr_survey_draft_v1';

export default function HrOfficeSurveyPage() {
  // Form State
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState('');

  // UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [bypassDeadline, setBypassDeadline] = useState(false);

  // Field refs for auto-focus on error
  const q1Ref = useRef<HTMLTextAreaElement>(null);
  const q2Ref = useRef<HTMLTextAreaElement>(null);
  const q3Ref = useRef<HTMLTextAreaElement>(null);
  const q4Ref = useRef<HTMLTextAreaElement>(null);

  // 1. Initial Load: Check status and restore draft
  useEffect(() => {
    // Check URL search params for ?preview=true or ?bypass=true
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview') === 'true' || params.get('bypass') === 'true') {
        setBypassDeadline(true);
      }

      // Restore Draft
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.q1) setQ1(parsed.q1);
          if (parsed.q2) setQ2(parsed.q2);
          if (parsed.q3) setQ3(parsed.q3);
          if (parsed.q4) setQ4(parsed.q4);
          if (parsed.q5) setQ5(parsed.q5);
        }
      } catch (e) {
        console.error('Failed to restore draft from localStorage:', e);
      }
    }

    // Check survey deadline status
    async function loadStatus() {
      try {
        const status = await checkOfficeSurveyStatus();
        setCurrentTimeStr(status.currentBangkokTimeStr);
        setIsClosed(status.isClosed);
      } catch (e) {
        console.error('Failed to check survey status:', e);
      }
    }
    loadStatus();

    // Periodically update time string
    const timer = setInterval(() => {
      loadStatus();
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. Auto-save Draft to LocalStorage
  useEffect(() => {
    if (isSubmitted) return;
    const hasContent = q1 || q2 || q3 || q4 || q5;
    if (hasContent) {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ q1, q2, q3, q4, q5 })
        );
        setIsDraftSaved(true);
      } catch (e) {
        console.error('Failed to save draft:', e);
      }
    }
  }, [q1, q2, q3, q4, q5, isSubmitted]);

  // Field change handler that clears error
  const handleFieldChange = (
    field: string,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(value);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (generalError) setGeneralError(null);
  };

  // Form Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!q1.trim()) {
      newErrors.q1 = 'กรุณาระบุสิ่งที่ชอบและอยากให้คงไว้';
    }
    if (!q2.trim()) {
      newErrors.q2 = 'กรุณาระบุสิ่งที่อยากให้ปรับปรุงหรือแก้ไข';
    }
    if (!q3.trim()) {
      newErrors.q3 = 'กรุณาระบุสิ่งที่อยากให้มีเพิ่มเข้ามา';
    }
    if (!q4.trim()) {
      newErrors.q4 = 'กรุณาระบุเรื่องที่อยากให้เปลี่ยนเป็นอันดับแรก';
    }

    setErrors(newErrors);

    // Auto-focus first field with error
    if (newErrors.q1 && q1Ref.current) {
      q1Ref.current.focus();
      q1Ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (newErrors.q2 && q2Ref.current) {
      q2Ref.current.focus();
      q2Ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (newErrors.q3 && q3Ref.current) {
      q3Ref.current.focus();
      q3Ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (newErrors.q4 && q4Ref.current) {
      q4Ref.current.focus();
      q4Ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return Object.keys(newErrors).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await submitOfficeSurvey({
        q1_liked: q1,
        q2_improve: q2,
        q3_additions: q3,
        q4_priority: q4,
        q5_suggestions: q5,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        bypassDeadline,
      });

      if (res.success && res.id) {
        setIsSubmitted(true);
        setSubmissionId(res.id);
        // Clear saved draft
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {
          // ignore
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        if (res.isClosed) {
          setIsClosed(true);
        }
        setGeneralError(res.error || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setQ1('');
    setQ2('');
    setQ3('');
    setQ4('');
    setQ5('');
    setIsSubmitted(false);
    setSubmissionId(null);
    setErrors({});
    setGeneralError(null);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {}
  };

  return (
    <main className="hr-survey-wrapper">
      {/* Top McThai Brand Accent Bar */}
      <div className="hr-survey-brand-bar" />

      <div className="hr-survey-container">
        {/* Header Hero Card */}
        <section className="hr-header-card">
          <div className="hr-badge-row">
            <span className="hr-badge hr-badge-mc">
              <Sparkles size={14} /> McThai HR Team
            </span>
            <span className="hr-badge hr-badge-anon">
              <ShieldCheck size={14} /> ไม่ระบุตัวตน 100% (Anonymous)
            </span>
            <span className="hr-badge hr-badge-time">
              <Clock size={14} /> เปิดรับไอเดียวันนี้ ถึง 16.30 น.
            </span>
          </div>

          <h1 className="hr-header-title">
            <span>แชร์ไอเดียปรับปรุงออฟฟิศ McThai</span>
            <span>💛 ❤️</span>
          </h1>

          <p className="hr-header-desc">
            สวัสดี HR ทุกคนค่ะ 😊 ขอชวนทุกคนมาแชร์ไอเดียกันสบายๆ เพื่อช่วยกันปรับปรุงออฟฟิศ McThai
            ทั้งหมดของเราทุกพื้นที่ให้น่าอยู่ บรรยากาศอบอุ่น ผ่อนคลาย และเอื้อต่อการทำงานยิ่งขึ้น
          </p>

          <div className="hr-quote-box">
            “เพราะพื้นที่ที่จะทำให้ทำงานแล้วมีความสุขที่สุด
            ก็ต้องเริ่มมาจากเสียงและความรู้สึกของคนที่คอยดูแลและใช้งานในพื้นที่จริงทุกวันอย่างพวกเราทุกคนนี่เอง”
            <div style={{ marginTop: '4px', fontWeight: 600, fontStyle: 'normal', color: '#92400E' }}>
              — ตอบกันแบบสบายๆ ชิลๆ คิดในภาพรวมของสำนักงานทั้งหมดได้เต็มที่เลย ✨
            </div>
          </div>
        </section>

        {/* Closed Screen (Past 16:30 and not bypassed) */}
        {isClosed && !bypassDeadline && !isSubmitted ? (
          <section className="hr-closed-card">
            <div className="hr-closed-icon">
              <Clock size={36} />
            </div>
            <h2 className="hr-success-title" style={{ color: '#0F172A' }}>
              ระบบปิดรับการแชร์ไอเดียสำหรับวันนี้แล้วค่ะ
            </h2>
            <p className="hr-success-message" style={{ marginBottom: '16px' }}>
              ขอขอบคุณพี่น้อง HR ทุกคนที่ร่วมส่งต่อพลังใจและความคิดเห็นดีๆ ให้กับออฟฟิศ McThai
              ของพวกเราทุกคนนะคะ 💛 ❤️
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#64748B',
                background: '#F1F5F9',
                padding: '8px 16px',
                borderRadius: '8px',
              }}
            >
              <span>ปิดรับเมื่อเวลา 16:30 น.</span>
              {currentTimeStr && <span>(เวลาปัจจุบัน: {currentTimeStr})</span>}
            </div>
          </section>
        ) : isSubmitted ? (
          /* Thank You Screen */
          <section className="hr-success-card">
            <div className="hr-success-icon-wrap">
              <Heart size={40} style={{ color: '#E11D48', fill: '#FECDD3' }} />
            </div>

            <h2 className="hr-success-title">ขอบคุณสำหรับทุกไอเดียและทุกความรู้สึกค่ะ! 💛 ❤️</h2>

            <p className="hr-success-message">
              ขอบคุณทุกคน ที่ร่วมแบ่งปันมุมมอง เพื่อช่วยกันสร้างพื้นที่ทำงานที่น่าอยู่
              และเป็นพลังใจให้กันในทุกๆ วัน
              <br />
              <span style={{ fontSize: '14px', color: '#64748B', display: 'block', marginTop: '10px' }}>
                ทุกข้อเสนอแนะของทุกคนมีคุณค่า และจะถูกนำไปร่วมพิจารณาพัฒนาพื้นที่ออฟฟิศ McThai
                ของเราให้น่าอยู่ยิ่งขึ้นค่ะ
              </span>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleResetForm}
                className="btn btn-secondary"
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={15} /> แชร์ไอเดียเพิ่มเติมอีกครั้ง
              </button>
            </div>
          </section>
        ) : (
          /* Survey Form */
          <form onSubmit={handleSubmit} noValidate>
            {/* General Alert / Error */}
            {generalError && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECDD3',
                  color: '#991B1B',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14.5px',
                }}
              >
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{generalError}</span>
              </div>
            )}

            {/* Question 1: สิ่งที่ชอบและอยากให้คงไว้ */}
            <div className={`hr-q-card ${errors.q1 ? 'hr-card-error' : ''}`}>
              <div className="hr-q-header">
                <div className="hr-q-icon hr-q-icon-green">
                  <ThumbsUp size={20} />
                </div>
                <div className="hr-q-title-group">
                  <label htmlFor="q1_input" className="hr-q-title">
                    <span>1. สิ่งที่ชอบและอยากให้คงไว้</span>
                    <span className="hr-required-mark">*</span>
                  </label>
                </div>
              </div>

              <textarea
                id="q1_input"
                ref={q1Ref}
                value={q1}
                onChange={(e) => handleFieldChange('q1', e.target.value, setQ1)}
                className={`hr-textarea ${errors.q1 ? 'hr-textarea-error' : ''}`}
                rows={3}
              />
              {errors.q1 && (
                <div className="hr-error-text">
                  <AlertCircle size={14} /> {errors.q1}
                </div>
              )}
            </div>

            {/* Question 2: สิ่งที่อยากให้ปรับปรุงหรือแก้ไข */}
            <div className={`hr-q-card ${errors.q2 ? 'hr-card-error' : ''}`}>
              <div className="hr-q-header">
                <div className="hr-q-icon hr-q-icon-red">
                  <Wrench size={20} />
                </div>
                <div className="hr-q-title-group">
                  <label htmlFor="q2_input" className="hr-q-title">
                    <span>2. สิ่งที่อยากให้ปรับปรุงหรือแก้ไข</span>
                    <span className="hr-required-mark">*</span>
                  </label>
                </div>
              </div>

              <textarea
                id="q2_input"
                ref={q2Ref}
                value={q2}
                onChange={(e) => handleFieldChange('q2', e.target.value, setQ2)}
                className={`hr-textarea ${errors.q2 ? 'hr-textarea-error' : ''}`}
                rows={3}
              />
              {errors.q2 && (
                <div className="hr-error-text">
                  <AlertCircle size={14} /> {errors.q2}
                </div>
              )}
            </div>

            {/* Question 3: สิ่งที่อยากให้มีเพิ่มเข้ามา */}
            <div className={`hr-q-card ${errors.q3 ? 'hr-card-error' : ''}`}>
              <div className="hr-q-header">
                <div className="hr-q-icon hr-q-icon-blue">
                  <PlusCircle size={20} />
                </div>
                <div className="hr-q-title-group">
                  <label htmlFor="q3_input" className="hr-q-title">
                    <span>3. สิ่งที่อยากให้มีเพิ่มเข้ามา</span>
                    <span className="hr-required-mark">*</span>
                  </label>
                </div>
              </div>

              <textarea
                id="q3_input"
                ref={q3Ref}
                value={q3}
                onChange={(e) => handleFieldChange('q3', e.target.value, setQ3)}
                className={`hr-textarea ${errors.q3 ? 'hr-textarea-error' : ''}`}
                rows={3}
              />
              {errors.q3 && (
                <div className="hr-error-text">
                  <AlertCircle size={14} /> {errors.q3}
                </div>
              )}
            </div>

            {/* Question 4: เรื่องที่อยากให้เปลี่ยนเป็นอันดับแรก (Highlighted) */}
            <div className={`hr-q-card hr-q-card-priority ${errors.q4 ? 'hr-card-error' : ''}`}>
              <span className="hr-priority-tag">★ สำคัญที่สุด</span>
              <div className="hr-q-header">
                <div className="hr-q-icon hr-q-icon-purple">
                  <Target size={20} />
                </div>
                <div className="hr-q-title-group">
                  <label htmlFor="q4_input" className="hr-q-title">
                    <span>4. เรื่องที่อยากให้เปลี่ยนเป็นอันดับแรก (ถ้าทำได้แค่อย่างเดียว)</span>
                    <span className="hr-required-mark">*</span>
                  </label>
                </div>
              </div>

              <textarea
                id="q4_input"
                ref={q4Ref}
                value={q4}
                onChange={(e) => handleFieldChange('q4', e.target.value, setQ4)}
                className={`hr-textarea ${errors.q4 ? 'hr-textarea-error' : ''}`}
                style={{
                  background: '#FFFFFF',
                  borderColor: '#F59E0B',
                  minHeight: '105px',
                  fontWeight: 500,
                }}
                rows={3}
              />
              {errors.q4 && (
                <div className="hr-error-text">
                  <AlertCircle size={14} /> {errors.q4}
                </div>
              )}
            </div>

            {/* Question 5: ข้อเสนอแนะอื่นๆ (Optional) */}
            <div className="hr-q-card">
              <div className="hr-q-header">
                <div className="hr-q-icon" style={{ background: '#F1F5F9', color: '#475569' }}>
                  <MessageSquareHeart size={20} />
                </div>
                <div className="hr-q-title-group">
                  <label htmlFor="q5_input" className="hr-q-title">
                    <span>5. ข้อเสนอแนะอื่นๆ (ถ้ามี)</span>
                    <span className="hr-optional-mark">ไม่บังคับ (Optional)</span>
                  </label>
                </div>
              </div>

              <textarea
                id="q5_input"
                value={q5}
                onChange={(e) => handleFieldChange('q5', e.target.value, setQ5)}
                className="hr-textarea"
                rows={3}
              />
            </div>

            {/* Submit Action */}
            <div className="hr-action-bar">
              <button
                type="submit"
                disabled={isSubmitting}
                className="hr-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner-sm" style={{ borderTopColor: '#FFFFFF' }} />
                    <span>กำลังบันทึกความคิดเห็น...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>ส่งไอเดียปรับปรุงออฟฟิศ</span>
                  </>
                )}
              </button>

              <div className="hr-draft-status">
                <ShieldCheck size={14} style={{ color: '#16A34A' }} />
                <span>คำตอบของคุณจะไม่ถูกระบุตัวตน 100%</span>
                {isDraftSaved && <span style={{ color: '#94A3B8' }}>• บันทึกแบบร่างอัตโนมัติแล้ว</span>}
              </div>
            </div>
          </form>
        )}

        {/* Footer Note */}
        <footer className="hr-survey-footer">
          <span>McThai Human Resources</span>
          <span>•</span>
          <span>Cozy & Happy Workplace 💛 ❤️</span>
        </footer>
      </div>
    </main>
  );
}
