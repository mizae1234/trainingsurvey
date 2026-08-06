'use client';

import React, { useState, useEffect, useRef } from 'react';
import MotherDayBranchSelect from '@/components/MotherDayBranchSelect';
import { submitMotherDay } from '@/app/actions/motherday';
import { Upload, X, CheckCircle, Heart, Award, Sparkles, ChevronDown } from 'lucide-react';
import './style.css';

export default function MotherDayCampaignPage() {
  // Form fields state
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [branch, setBranch] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // UI state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDesc, setShowDesc] = useState(true);
  
  // Success data state
  const [successData, setSuccessData] = useState<{
    employeeId: string;
    firstName: string;
    lastName: string;
    branch: string;
    message: string;
    imageUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length > 0) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) validateAndSetFile(e.target.files[0]);
  };

  const validateAndSetFile = (selectedFile: File) => {
    const newErrors = { ...errors };
    delete newErrors.file;
    setErrors(newErrors);

    if (!selectedFile.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, file: 'กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น' }));
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, file: 'ขนาดรูปภาพต้องไม่เกิน 10MB' }));
      return;
    }

    setFile(selectedFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!employeeId.trim()) newErrors.employeeId = 'กรุณากรอกรหัสพนักงาน';
    if (!firstName.trim()) newErrors.firstName = 'กรุณากรอกชื่อจริง';
    if (!lastName.trim()) newErrors.lastName = 'กรุณากรอกนามสกุล';
    if (!branch) newErrors.branch = 'กรุณาเลือกสาขา';
    if (!message.trim()) newErrors.message = 'กรุณาเขียนข้อความถึงแม่';
    if (!file) newErrors.file = 'กรุณาอัปโหลดรูปภาพ 1 รูป';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!validateForm() || !file) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('branch', branch);
      formData.append('message', message);
      formData.append('file', file);

      const result = await submitMotherDay(formData);
      if (result.success && result.data) {
        setSuccessData(result.data);
      } else {
        setErrorMessage(result.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset
  const handleReset = () => {
    setEmployeeId(''); setFirstName(''); setLastName('');
    setBranch(''); setMessage(''); setFile(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    setErrors({}); setSuccessData(null); setErrorMessage(null);
  };

  return (
    <div className="motherday-wrapper">
      <div className="motherday-container">
        
        {/* Header */}
        <header className="campaign-header">
          <span className="campaign-badge">
            <Heart size={13} style={{ fill: '#fff', stroke: '#fff' }} />
            กิจกรรมวันแม่ 12 สิงหาคม
          </span>
          <h1 className="campaign-title">❤️💛 &quot;มื้อรักจากลูกแมค&quot; 🩵</h1>
        </header>

        {/* Collapsible Description */}
        <div className="campaign-desc-card">
          <button
            type="button"
            className={`desc-toggle-btn ${showDesc ? 'open' : ''}`}
            onClick={() => setShowDesc(!showDesc)}
          >
            <span>📢 รายละเอียดกิจกรรม &amp; กติกา</span>
            <ChevronDown size={20} />
          </button>

          {showDesc && (
            <div className="desc-content">
              <p>
                📢 ชวนพนักงานบอกรักแม่ในแบบฉบับ McDonald&apos;s กับกิจกรรม &quot;มื้อนี้ อยากบอกแม่ว่า...&quot; 🩵💛❤️
              </p>
              <p>
                วันแม่ปีนี้... จากคำถามคุ้นหูอย่าง “กินข้าวหรือยัง?” ที่แม่คอยถามเราอยู่เสมอ เปลี่ยนมาเป็นชวนแม่มานั่งกินมื้ออร่อยด้วยกันดีไหม 🍔🍟🍦
              </p>
              <p>
                ขอชวนพนักงานทุกคนส่งต่อความรักถึงคุณแม่ผ่านมื้อพิเศษ พร้อมเก็บภาพรอยยิ้มและช่วงเวลาดี ๆ ไว้เป็นความทรงจำอันแสนอบอุ่น 📸
              </p>

              <p className="desc-section-title">💡 กติกาง่าย ๆ ในการร่วมสนุก</p>
              <ol>
                <li>ถ่ายภาพคู่กับคุณแม่ (หรือบุคคลสำคัญที่เป็นเสมือนแม่ของเรา) พร้อมเมนูโปรดจาก McDonald&apos;s เมนูใดก็ได้</li>
                <li>เขียนข้อความสั้น ๆ เติมคำในช่องว่าง “มื้อนี้ อยากบอกแม่ว่า…” 💬</li>
              </ol>

              <p className="desc-section-title">🎁 ของขวัญสุดพิเศษสำหรับพนักงาน 100 ท่านแรก (ที่ทำครบตามเงื่อนไข) รับทันที!</p>
              <ul>
                <li>กรอบรูปวันแม่ดีไซน์พิเศษ พร้อมภาพความประทับใจของคุณและคุณแม่ เก็บบันทึกช่วงเวลาแสนอบอุ่นนี้ไว้ในความทรงจำตลอดไป 💐</li>
              </ul>

              <p className="desc-section-title">🗓️ ระยะเวลาร่วมกิจกรรม</p>
              <ul>
                <li>ส่งภาพได้ตั้งแต่ วันที่ 7 – 14 สิงหาคม 2569 เท่านั้น!</li>
              </ul>

              <p style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: 0 }}>
                วันแม่ปีนี้... ชวนแม่กินมื้อโปรดด้วยกัน สร้างรอยยิ้มและโมเมนต์ความหมายดี ๆ แล้วอย่าลืมเก็บภาพความประทับใจมาแบ่งปันกันนะ ✨
              </p>
            </div>
          )}
        </div>

        {/* ── Success View ── */}
        {successData ? (
          <div className="campaign-card success-card">
            <div className="success-icon-wrapper">
              <CheckCircle size={32} />
            </div>
            <h2 className="success-title">ส่งภาพเข้าร่วมกิจกรรมแล้ว!</h2>
            <p className="success-subtitle">
              ขอบคุณที่ร่วมเป็นส่วนหนึ่งในกิจกรรม &quot;มื้อนี้ อยากบอกแม่ว่า...&quot; 💛
            </p>

            <div className="digital-frame-container">
              <div className="digital-frame">
                <div className="frame-decoration">
                  <Sparkles size={22} color="#ca8a04" />
                </div>
                <div className="frame-image-wrapper">
                  <img
                    src={successData.imageUrl}
                    alt={`${successData.firstName} ${successData.lastName}`}
                    className="frame-photo"
                  />
                </div>
                <div className="frame-info">
                  <div className="frame-name-tag">{successData.firstName} {successData.lastName}</div>
                  {successData.message && (
                    <div className="frame-nickname-tag" style={{ fontStyle: 'italic' }}>
                      &quot;มื้อนี้ อยากบอกแม่ว่า... {successData.message}&quot;
                    </div>
                  )}
                  <div className="frame-details">
                    <span className="frame-badge branch-badge">{successData.branch}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="success-actions">
              <button onClick={handleReset} className="btn-secondary">
                ส่งรูปภาพอื่น (คนใหม่)
              </button>
            </div>
          </div>
        ) : (
          /* ── Form View ── */
          <div className="campaign-card">
            {errorMessage && (
              <div className="alert-box error">
                <span>⚠️</span>
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">

                {/* Employee ID — full width */}
                <div className={`form-group full-width ${errors.employeeId ? 'has-error' : ''}`}>
                  <label htmlFor="employeeId" className="form-label">รหัสพนักงาน <span>*</span></label>
                  <input
                    id="employeeId"
                    type="text"
                    className={`form-input ${errors.employeeId ? 'input-error' : ''}`}
                    placeholder="กรอกรหัสพนักงาน"
                    value={employeeId}
                    onChange={(e) => { setEmployeeId(e.target.value); clearFieldError('employeeId'); }}
                  />
                  {errors.employeeId && <span className="error-text">{errors.employeeId}</span>}
                </div>

                {/* First Name */}
                <div className={`form-group ${errors.firstName ? 'has-error' : ''}`}>
                  <label htmlFor="firstName" className="form-label">ชื่อ <span>*</span></label>
                  <input
                    id="firstName"
                    type="text"
                    className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="กรอกชื่อ"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); clearFieldError('firstName'); }}
                  />
                  {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                </div>

                {/* Last Name */}
                <div className={`form-group ${errors.lastName ? 'has-error' : ''}`}>
                  <label htmlFor="lastName" className="form-label">นามสกุล <span>*</span></label>
                  <input
                    id="lastName"
                    type="text"
                    className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="กรอกนามสกุล"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); clearFieldError('lastName'); }}
                  />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>

                {/* Branch — full width */}
                <div className="form-group full-width">
                  <MotherDayBranchSelect
                    id="branch"
                    value={branch}
                    onChange={(val) => { setBranch(val); clearFieldError('branch'); }}
                    placeholder="พิมพ์ชื่อสาขาเพื่อค้นหา..."
                    label={<span className="form-label">สาขาปฏิบัติงาน <span>*</span></span>}
                    error={errors.branch}
                  />
                </div>

                {/* Message — full width */}
                <div className={`form-group full-width ${errors.message ? 'has-error' : ''}`}>
                  <label htmlFor="message" className="form-label">💛 มื้อนี้ อยากบอกแม่ว่า... <span>*</span></label>
                  <textarea
                    id="message"
                    className={`form-input ${errors.message ? 'input-error' : ''}`}
                    placeholder="เขียนข้อความถึงแม่ของคุณ..."
                    value={message}
                    rows={3}
                    onChange={(e) => { setMessage(e.target.value); clearFieldError('message'); }}
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                  {errors.message && <span className="error-text">{errors.message}</span>}
                </div>

                {/* Upload — full width */}
                <div className="form-group full-width">
                  <label className="form-label">📸 รูปถ่ายคู่กับแม่ + เมนู McDonald&apos;s <span>*</span></label>

                  {previewUrl ? (
                    <div className="preview-container">
                      <img src={previewUrl} alt="Preview" className="preview-image" />
                      <button type="button" onClick={handleRemoveFile} className="remove-preview-btn" title="ลบรูปภาพ">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="upload-icon-container">
                        <Upload size={22} />
                      </div>
                      <div className="upload-title">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่ออัปโหลด</div>
                      <div className="upload-subtitle">รองรับรูปภาพทุกประเภท (สูงสุด 10MB)</div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden-file-input"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                  {errors.file && <span className="error-text">{errors.file}</span>}
                </div>
              </div>

              {/* PDPA consent statement */}
              <div className="pdpa-consent-box" style={{
                marginTop: '20px',
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem',
                color: '#475569',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span>🔒 เงื่อนไขและการยินยอมเปิดเผยข้อมูล (PDPA)</span>
                </div>
                <p style={{ margin: 0, marginBottom: '8px' }}>
                  การส่งภาพถ่ายและข้อความเข้าร่วมกิจกรรมนี้ พนักงานผู้ส่งภาพรับรองว่าตนเองและบุคคลในภาพได้ให้ความยินยอมแก่บริษัทฯ ในการเก็บ รวบรวม ใช้ และเผยแพร่ภาพถ่ายและข้อความ ผ่านช่องทางสื่อประชาสัมพันธ์ทั้งภายในและภายนอกองค์กรของ McDonald&apos;s เพื่อใช้ในการจัดกิจกรรมและการสื่อสารประชาสัมพันธ์ขององค์กร
                </p>
                <p style={{ margin: 0 }}>
                  หากมีข้อสงสัยเกี่ยวกับข้อมูลส่วนบุคคล สามารถติดต่อสอบถามเพิ่มเติมได้ที่ฝ่าย HR ของบริษัทฯ
                </p>
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="spinner" />
                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <Award size={18} />
                    ส่งรูปภาพเข้าร่วมกิจกรรม
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
