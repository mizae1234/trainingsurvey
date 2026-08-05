'use client';

import React, { useState, useEffect, useRef } from 'react';
import BranchSelect from '@/components/BranchSelect';
import { submitMotherDay } from '@/app/actions/motherday';
import { Upload, X, CheckCircle, Heart, Award, Sparkles } from 'lucide-react';
import './style.css';

export default function MotherDayCampaignPage() {
  // Form fields state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [position, setPosition] = useState('');
  const [branch, setBranch] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // UI state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Success data state
  const [successData, setSuccessData] = useState<{
    firstName: string;
    lastName: string;
    nickname: string;
    position: string;
    branch: string;
    imageUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Reset file errors
    const newErrors = { ...errors };
    delete newErrors.file;
    setErrors(newErrors);

    // Validate type (must be an image)
    if (!selectedFile.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, file: 'กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น' }));
      return;
    }

    // Validate size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setErrors(prev => ({ ...prev, file: 'ขนาดรูปภาพต้องไม่เกิน 10MB' }));
      return;
    }

    setFile(selectedFile);

    // Generate preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'กรุณากรอกชื่อจริง';
    if (!lastName.trim()) newErrors.lastName = 'กรุณากรอกนามสกุล';
    if (!nickname.trim()) newErrors.nickname = 'กรุณากรอกชื่อเล่น';
    if (!position.trim()) newErrors.position = 'กรุณากรอกตำแหน่ง';
    if (!branch) newErrors.branch = 'กรุณาเลือกสาขา';
    if (!file) newErrors.file = 'กรุณาอัปโหลดรูปภาพ 1 รูป';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm() || !file) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('nickname', nickname);
      formData.append('position', position);
      formData.append('branch', branch);
      formData.append('file', file);

      const result = await submitMotherDay(formData);

      if (result.success && result.data) {
        setSuccessData(result.data);
      } else {
        setErrorMessage(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to submit again
  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setNickname('');
    setPosition('');
    setBranch('');
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setErrors({});
    setSuccessData(null);
    setErrorMessage(null);
  };

  return (
    <div className="motherday-wrapper">
      <div className="motherday-container">
        
        {/* Header Section */}
        <header className="campaign-header">
          <span className="campaign-badge">
            <Heart size={14} className="inline mr-1 fill-sky-500 stroke-sky-500" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> 
            กิจกรรมวันแม่ 12 สิงหาคม
          </span>
          <h1 className="campaign-title">Mother's Day Campaign</h1>
          <p className="campaign-subtitle">
            ขอเชิญชวนพนักงานร่วมกิจกรรมวันแม่ ร่วมส่งภาพถ่ายเพื่อแสดงความรักต่อคุณแม่ พร้อมรับการ์ดรูปภาพที่ระลึก
          </p>
        </header>

        {/* Success View */}
        {successData ? (
          <div className="campaign-card success-card">
            <div className="success-icon-wrapper">
              <CheckCircle size={36} />
            </div>
            <h2 className="success-title">ส่งภาพเข้าร่วมกิจกรรมแล้ว!</h2>
            <p className="success-subtitle">ขอบคุณที่คุณร่วมเป็นส่วนหนึ่งในกิจกรรมวันแม่ปีนี้ นี่คือการ์ดรูปภาพที่ระลึกของคุณ</p>

            {/* Certificate digital frame card */}
            <div className="digital-frame-container">
              <div className="digital-frame">
                {/* Jasmine flower decorations (visual) */}
                <div className="frame-decoration">
                  <Sparkles size={24} color="#ca8a04" className="fill-yellow-400" />
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
                  <div className="frame-nickname-tag">ชื่อเล่น: {successData.nickname}</div>
                  <div className="frame-details">
                    <span className="frame-badge">{successData.position}</span>
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
          /* Form View */
          <div className="campaign-card">
            {errorMessage && (
              <div className="alert-box error">
                <span>⚠️</span>
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                
                {/* First Name */}
                <div className={`form-group ${errors.firstName ? 'has-error' : ''}`}>
                  <label htmlFor="firstName" className="form-label">ชื่อจริง <span>*</span></label>
                  <input
                    id="firstName"
                    type="text"
                    className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="กรอกชื่อจริง (เช่น สมชาย)"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) {
                        const newErrors = { ...errors };
                        delete newErrors.firstName;
                        setErrors(newErrors);
                      }
                    }}
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
                    placeholder="กรอกนามสกุล (เช่น รักดี)"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) {
                        const newErrors = { ...errors };
                        delete newErrors.lastName;
                        setErrors(newErrors);
                      }
                    }}
                  />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>

                {/* Nickname */}
                <div className={`form-group ${errors.nickname ? 'has-error' : ''}`}>
                  <label htmlFor="nickname" className="form-label">ชื่อเล่น <span>*</span></label>
                  <input
                    id="nickname"
                    type="text"
                    className={`form-input ${errors.nickname ? 'input-error' : ''}`}
                    placeholder="กรอกชื่อเล่น (เช่น บอย)"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      if (errors.nickname) {
                        const newErrors = { ...errors };
                        delete newErrors.nickname;
                        setErrors(newErrors);
                      }
                    }}
                  />
                  {errors.nickname && <span className="error-text">{errors.nickname}</span>}
                </div>

                {/* Position */}
                <div className={`form-group ${errors.position ? 'has-error' : ''}`}>
                  <label htmlFor="position" className="form-label">ตำแหน่ง <span>*</span></label>
                  <input
                    id="position"
                    type="text"
                    className={`form-input ${errors.position ? 'input-error' : ''}`}
                    placeholder="กรอกตำแหน่งงาน (เช่น ผู้จัดการสาขา)"
                    value={position}
                    onChange={(e) => {
                      setPosition(e.target.value);
                      if (errors.position) {
                        const newErrors = { ...errors };
                        delete newErrors.position;
                        setErrors(newErrors);
                      }
                    }}
                  />
                  {errors.position && <span className="error-text">{errors.position}</span>}
                </div>

                {/* Branch Select (Searchable) */}
                <div className="form-group full-width">
                  <BranchSelect
                    id="branch"
                    value={branch}
                    onChange={(val) => {
                      setBranch(val);
                      if (errors.branch) {
                        const newErrors = { ...errors };
                        delete newErrors.branch;
                        setErrors(newErrors);
                      }
                    }}
                    placeholder="พิมพ์ค้นหาและเลือกสาขา..."
                    label={
                      <span className="form-label">
                        สาขาปฏิบัติงาน <span>*</span>
                      </span>
                    }
                    error={errors.branch}
                  />
                </div>

                {/* Image Upload Area */}
                <div className="form-group full-width">
                  <label className="form-label">รูปถ่ายสำหรับกิจกรรม (1 รูป) <span>*</span></label>
                  
                  {previewUrl ? (
                    /* Preview screen */
                    <div className="preview-container">
                      <img src={previewUrl} alt="Preview" className="preview-image" />
                      <button 
                        type="button" 
                        onClick={handleRemoveFile} 
                        className="remove-preview-btn"
                        title="ลบรูปภาพ"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    /* Dropzone screen */
                    <div 
                      className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="upload-icon-container">
                        <Upload size={24} />
                      </div>
                      <div className="upload-title">ลากไฟล์รูปภาพมาวางที่นี่ หรือคลิกเพื่ออัปโหลด</div>
                      <div className="upload-subtitle">รองรับไฟล์รูปภาพทุกประเภท (สูงสุด 10MB)</div>
                      
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

              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px', lineHeight: 1.4 }}>
                💡 <strong>คำแนะนำ:</strong> 1 ท่านสามารถส่งผลงานได้ 1 รูปภาพเท่านั้น ระบบจะทำการบันทึกและเปลี่ยนชื่อไฟล์ของท่านเป็น <strong>"ชื่อ_นามสกุล"</strong> โดยอัตโนมัติเมื่อจัดเก็บในระบบ
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" />
                    กำลังอัปโหลดและบันทึกข้อมูล...
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
