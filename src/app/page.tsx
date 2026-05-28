'use client';

import React, { useState, useEffect } from 'react';
import BranchSelect from '@/components/BranchSelect';
import SearchableSelect from '@/components/SearchableSelect';
import DatePicker from '@/components/DatePicker';
import { submitSurvey } from '@/app/actions';
import {
  Building2,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  HelpCircle,
  Award,
  MessageSquare
} from 'lucide-react';

interface FormErrors {
  [key: string]: string;
}

const rawDepartments = [
  'Executive Management',
  'Finance & Accounting',
  'Operations',
  'Marketing',
  'Business Development',
  'Human Resources & People Development',
  'Cost Management',
  'Supply Chain Management',
  'Impact',
  'Strategy & Insights',
  'CSA',
  'M academy',
  'M C D Property'
];

const DEPARTMENTS = [...rawDepartments].sort((a, b) => a.localeCompare(b));

export default function SurveyPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    department: '',
    branch1: '',
    branch1TrainingStart: '',
    branch1TrainingEnd: '',
    branch1Duration: '',

    branch2: '',
    branch2TrainingStart: '',
    branch2TrainingEnd: '',
    branch2Duration: '',

    q1_benefit: 0,
    q2_apply_knowledge: 0,
    q3_consistency: 0,
    q4_1_duration_suitability: '',
    q4_2_branches_suitability: '',

    q5_clarity_branch1: 0,
    q5_clarity_branch2: 0,
    q6_volume_branch1: 0,
    q6_volume_branch2: 0,
    q7_readiness_branch1: 0,
    q7_readiness_branch2: 0,

    q8_trainer_knowledge_branch1: 0,
    q8_trainer_knowledge_branch2: 0,
    q9_safety_hygiene_branch1: 0,
    q9_safety_hygiene_branch2: 0,
    q10_trainer_care_branch1: 0,
    q10_trainer_care_branch2: 0,
    q11_atmosphere_branch1: 0,
    q11_atmosphere_branch2: 0,

    feedback12_challenging: '',
    feedback13_ideal_setup: '',
    feedback14_impressions: '',
    feedback15_suggestions: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Auto-calculate Branch 1 Duration
  useEffect(() => {
    if (formData.branch1TrainingStart && formData.branch1TrainingEnd) {
      const start = new Date(formData.branch1TrainingStart);
      const end = new Date(formData.branch1TrainingEnd);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, branch1Duration: diffDays.toString() }));
        if (errors.branch1TrainingEnd || errors.branch1TrainingStart) {
          setErrors(prev => ({ ...prev, branch1TrainingEnd: '', branch1TrainingStart: '' }));
        }
      }
    }
  }, [formData.branch1TrainingStart, formData.branch1TrainingEnd]);

  // Auto-calculate Branch 2 Duration
  useEffect(() => {
    if (formData.branch2TrainingStart && formData.branch2TrainingEnd) {
      const start = new Date(formData.branch2TrainingStart);
      const end = new Date(formData.branch2TrainingEnd);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, branch2Duration: diffDays.toString() }));
        if (errors.branch2TrainingEnd || errors.branch2TrainingStart) {
          setErrors(prev => ({ ...prev, branch2TrainingEnd: '', branch2TrainingStart: '' }));
        }
      }
    }
  }, [formData.branch2TrainingStart, formData.branch2TrainingEnd]);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!formData.department) newErrors.department = 'กรุณาเลือกฝ่ายงานที่ท่านสังกัด';
      if (!formData.branch1) newErrors.branch1 = 'กรุณาเลือกสาขาที่ 1';
      if (!formData.branch1TrainingStart) newErrors.branch1TrainingStart = 'กรุณาระบุวันเริ่มต้นฝึกอบรม';
      if (!formData.branch1TrainingEnd) newErrors.branch1TrainingEnd = 'กรุณาระบุวันสิ้นสุดฝึกอบรม';

      const start1 = new Date(formData.branch1TrainingStart);
      const end1 = new Date(formData.branch1TrainingEnd);
      if (formData.branch1TrainingStart && formData.branch1TrainingEnd && end1 < start1) {
        newErrors.branch1TrainingEnd = 'วันสิ้นสุดการฝึกอบรมต้องอยู่หลังวันเริ่มต้น';
      }

      if (!formData.branch2) newErrors.branch2 = 'กรุณาเลือกสาขาที่ 2';
      if (!formData.branch2TrainingStart) newErrors.branch2TrainingStart = 'กรุณาระบุวันเริ่มต้นฝึกอบรม';
      if (!formData.branch2TrainingEnd) newErrors.branch2TrainingEnd = 'กรุณาระบุวันสิ้นสุดฝึกอบรม';

      const start2 = new Date(formData.branch2TrainingStart);
      const end2 = new Date(formData.branch2TrainingEnd);
      if (formData.branch2TrainingStart && formData.branch2TrainingEnd && end2 < start2) {
        newErrors.branch2TrainingEnd = 'วันสิ้นสุดการฝึกอบรมต้องอยู่หลังวันเริ่มต้น';
      }

      if (formData.branch1 && formData.branch2 && formData.branch1 === formData.branch2) {
        newErrors.branch2 = 'กรุณาเลือกสาขาที่ไม่ซ้ำกัน';
      }
    }

    if (currentStep === 2) {
      if (formData.q1_benefit === 0) newErrors.q1_benefit = 'กรุณาประเมินระดับความพึงพอใจ';
      if (formData.q2_apply_knowledge === 0) newErrors.q2_apply_knowledge = 'กรุณาประเมินระดับความพึงพอใจ';
      if (formData.q3_consistency === 0) newErrors.q3_consistency = 'กรุณาประเมินระดับความพึงพอใจ';
      if (!formData.q4_1_duration_suitability) newErrors.q4_1_duration_suitability = 'กรุณาเลือกความเหมาะสมของระยะเวลา';
      if (!formData.q4_2_branches_suitability) newErrors.q4_2_branches_suitability = 'กรุณาเลือกความเหมาะสมของจำนวนสาขา';
    }

    if (currentStep === 3) {
      if (formData.q5_clarity_branch1 === 0) newErrors.q5_clarity_branch1 = 'กรุณาเลือกประเมินสาขาที่ 1';
      if (formData.q5_clarity_branch2 === 0) newErrors.q5_clarity_branch2 = 'กรุณาเลือกประเมินสาขาที่ 2';
      if (formData.q6_volume_branch1 === 0) newErrors.q6_volume_branch1 = 'กรุณาเลือกประเมินสาขาที่ 1';
      if (formData.q6_volume_branch2 === 0) newErrors.q6_volume_branch2 = 'กรุณาเลือกประเมินสาขาที่ 2';
      if (formData.q7_readiness_branch1 === 0) newErrors.q7_readiness_branch1 = 'กรุณาเลือกประเมินสาขาที่ 1';
      if (formData.q7_readiness_branch2 === 0) newErrors.q7_readiness_branch2 = 'กรุณาเลือกประเมินสาขาที่ 2';
      if (formData.q8_trainer_knowledge_branch1 === 0) newErrors.q8_trainer_knowledge_branch1 = 'กรุณาเลือกประเมินสาขาที่ 1';
      if (formData.q8_trainer_knowledge_branch2 === 0) newErrors.q8_trainer_knowledge_branch2 = 'กรุณาเลือกประเมินสาขาที่ 2';
      if (formData.q9_safety_hygiene_branch1 === 0) newErrors.q9_safety_hygiene_branch1 = 'กรุณาเลือกประเมินสาขาที่ 1';
      if (formData.q9_safety_hygiene_branch2 === 0) newErrors.q9_safety_hygiene_branch2 = 'กรุณาเลือกประเมินสาขาที่ 2';
      if (formData.q10_trainer_care_branch1 === 0) newErrors.q10_trainer_care_branch1 = 'กรุณาเลือกประเมินสาขาที่ 1';
      if (formData.q10_trainer_care_branch2 === 0) newErrors.q10_trainer_care_branch2 = 'กรุณาเลือกประเมินสาขาที่ 2';
      if (formData.q11_atmosphere_branch1 === 0) newErrors.q11_atmosphere_branch1 = 'กรุณาเลือกประเมินสาขาที่ 1';
      if (formData.q11_atmosphere_branch2 === 0) newErrors.q11_atmosphere_branch2 = 'กรุณาเลือกประเมินสาขาที่ 2';
    }

    if (currentStep === 4) {
      if (!formData.feedback12_challenging.trim()) newErrors.feedback12_challenging = 'กรุณาระบุข้อคิดเห็น/คำตอบในช่องนี้';
      if (!formData.feedback13_ideal_setup.trim()) newErrors.feedback13_ideal_setup = 'กรุณาระบุข้อคิดเห็น/คำตอบในช่องนี้';
      if (!formData.feedback14_impressions.trim()) newErrors.feedback14_impressions = 'กรุณาระบุข้อคิดเห็น/คำตอบในช่องนี้';
      if (!formData.feedback15_suggestions.trim()) newErrors.feedback15_suggestions = 'กรุณาระบุข้อคิดเห็น/คำตอบในช่องนี้';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitSurvey({ ...formData, userAgent: navigator.userAgent });
      if (result.success) {
        setStep(5); // Success step
      } else {
        setSubmitError(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err: any) {
      setSubmitError('เกิดข้อผิดพลาดทางเทคนิค กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setRating = (field: string, val: number) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const setChoice = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Label text mapper for ratings
  const sec2RatingLabels: Record<number, string> = {
    4: 'เห็นด้วยอย่างยิ่ง',
    3: 'เห็นด้วย',
    2: 'ไม่เห็นด้วย',
    1: 'ไม่เห็นด้วยอย่างยิ่ง'
  };

  const sec3RatingLabels: Record<number, string> = {
    4: 'ดีเยี่ยม',
    3: 'ดี',
    2: 'พอใช้',
    1: 'ควรปรับปรุง'
  };

  return (
    <div className="app-container">
      <div className="theme-header-bar" />

      {/* Step Indicator Header (Hide on Success Screen) */}
      {step < 5 && (
        <div className="steps-indicator">
          <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-bubble">{step > 1 ? '✓' : '1'}</div>
            <div className="step-label">ข้อมูลการฝึก</div>
          </div>
          <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-bubble">{step > 2 ? '✓' : '2'}</div>
            <div className="step-label">ภาพรวมหน้าร้าน</div>
          </div>
          <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-bubble">{step > 3 ? '✓' : '3'}</div>
            <div className="step-label">ประเมินรายสาขา</div>
          </div>
          <div className={`step-item ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
            <div className="step-bubble">4</div>
            <div className="step-label">ข้อเสนอแนะ</div>
          </div>
        </div>
      )}

      <div className="survey-card">
        {step < 5 && (
          <div className="survey-header">
            <h1 className="survey-title">แบบสอบถามความพึงพอใจและผลสัมฤทธิ์การฝึกหน้าร้าน</h1>
            <p className="survey-subtitle">(In Restaurant Training Program - 5 Days)</p>
          </div>
        )}

        {step === 1 && (
          <div className="survey-instructions">
            <strong>คำชี้แจง:</strong> แบบสอบถามนี้จัดทำขึ้นเพื่อนำข้อมูลไปพัฒนาและปรับปรุงระบบการฝึกอบรมของหน่วยงานพัฒนาทรัพยากรบุคคล (HRD) โดยคำตอบของท่านจะถูกเก็บเป็นความลับและประมวลผล ซึ่งไม่มีผลต่อการประเมินผลการปฏิบัติงานใดๆ ทั้งสิ้น
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="survey-body">

            {/* STEP 1: ข้อมูลการฝึกหน้าร้าน */}
            {step === 1 && (
              <div className="step-content">
                {/* Department Selection */}
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <SearchableSelect
                    id="department"
                    label={<>ฝ่ายงานที่ท่านสังกัด <span>*</span></>}
                    placeholder="เลือกฝ่ายงานที่ท่านสังกัด..."
                    options={DEPARTMENTS}
                    value={formData.department}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, department: val }));
                      if (errors.department) {
                        setErrors(prev => ({ ...prev, department: '' }));
                      }
                    }}
                    error={errors.department}
                  />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0 28px 0' }} />

                <div className="section-header">
                  <div className="section-title">ส่วนที่ 1: ข้อมูลการฝึกหน้าร้าน</div>
                  <div className="section-desc">ระบุรายละเอียดสาขาและวันที่เข้ารับการฝึกปฏิบัติงานจริง</div>
                </div>

                {/* Branch 1 */}
                <div className="branch-panel mb-4">
                  <div className="branch-panel-title">
                    <span className="badge badge-red">การฝึกอบรมสาขาที่ 1</span>
                  </div>

                  <div className="form-group">
                    <BranchSelect
                      id="branch1"
                      label={<>สาขาที่ 1 ที่เข้าฝึกอบรม <span>*</span></>}
                      value={formData.branch1}
                      onChange={(val) => setFormData(prev => ({ ...prev, branch1: val }))}
                      error={errors.branch1}
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">ช่วงวันที่เข้ารับการฝึกอบรม <span>*</span></label>
                      <div className="date-picker-group">
                        <DatePicker
                          value={formData.branch1TrainingStart}
                          onChange={(val) => setFormData(prev => ({ ...prev, branch1TrainingStart: val }))}
                        />
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>ถึง</span>
                        <DatePicker
                          value={formData.branch1TrainingEnd}
                          onChange={(val) => setFormData(prev => ({ ...prev, branch1TrainingEnd: val }))}
                        />
                      </div>
                      {(errors.branch1TrainingStart || errors.branch1TrainingEnd) && (
                        <span className="error-text">{errors.branch1TrainingStart || errors.branch1TrainingEnd}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">รวมระยะเวลา (วัน)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.branch1Duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, branch1Duration: e.target.value }))}
                        placeholder="คำนวณอัตโนมัติ"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Branch 2 */}
                <div className="branch-panel">
                  <div className="branch-panel-title">
                    <span className="badge badge-yellow">การฝึกอบรมสาขาที่ 2</span>
                  </div>

                  <div className="form-group">
                    <BranchSelect
                      id="branch2"
                      label={<>สาขาที่ 2 ที่เข้าฝึกอบรม <span>*</span></>}
                      value={formData.branch2}
                      onChange={(val) => setFormData(prev => ({ ...prev, branch2: val }))}
                      error={errors.branch2}
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">ช่วงวันที่เข้ารับการฝึกอบรม <span>*</span></label>
                      <div className="date-picker-group">
                        <DatePicker
                          value={formData.branch2TrainingStart}
                          onChange={(val) => setFormData(prev => ({ ...prev, branch2TrainingStart: val }))}
                        />
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>ถึง</span>
                        <DatePicker
                          value={formData.branch2TrainingEnd}
                          onChange={(val) => setFormData(prev => ({ ...prev, branch2TrainingEnd: val }))}
                        />
                      </div>
                      {(errors.branch2TrainingStart || errors.branch2TrainingEnd) && (
                        <span className="error-text">{errors.branch2TrainingStart || errors.branch2TrainingEnd}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">รวมระยะเวลา (วัน)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.branch2Duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, branch2Duration: e.target.value }))}
                        placeholder="คำนวณอัตโนมัติ"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ภาพรวมการฝึกหน้าร้าน */}
            {step === 2 && (
              <div className="step-content">
                <div className="section-header">
                  <div className="section-title">ส่วนที่ 2: ภาพรวมการฝึกหน้าร้าน</div>
                  <div className="section-desc">
                    ประเมินภาพรวมความพึงพอใจการปฏิบัติงาน (เกณฑ์: 4 = เห็นด้วยอย่างยิ่ง 3 = เห็นด้วย 2 = ไม่เห็นด้วย 1 = ไม่เห็นด้วยอย่างยิ่ง)
                  </div>
                </div>

                {/* Q1 */}
                <div className="question-row">
                  <div className="question-text">
                    1. การฝึกหน้าร้านมีประโยชน์และช่วยให้เข้าใจผลิตภัณฑ์/บริการของบริษัทมากขึ้น <span>*</span>
                  </div>
                  <div className="rating-group">
                    {[4, 3, 2, 1].map(num => (
                      <div
                        key={num}
                        className={`rating-box ${formData.q1_benefit === num ? 'selected' : ''}`}
                        onClick={() => setRating('q1_benefit', num)}
                      >
                        <span className="rating-number">{num}</span>
                        <span className="rating-label">{sec2RatingLabels[num]}</span>
                      </div>
                    ))}
                  </div>
                  {errors.q1_benefit && (
                    <span className="error-text" style={{ marginTop: '8px' }}>{errors.q1_benefit}</span>
                  )}
                </div>

                {/* Q2 */}
                <div className="question-row">
                  <div className="question-text">
                    2. สามารถนำความรู้และทักษะที่ได้รับจากหน้าร้าน ไปปรับ/ประยุกต์ใช้กับการทำงานในสายงานที่ปฏิบัติได้ <span>*</span>
                  </div>
                  <div className="rating-group">
                    {[4, 3, 2, 1].map(num => (
                      <div
                        key={num}
                        className={`rating-box ${formData.q2_apply_knowledge === num ? 'selected' : ''}`}
                        onClick={() => setRating('q2_apply_knowledge', num)}
                      >
                        <span className="rating-number">{num}</span>
                        <span className="rating-label">{sec2RatingLabels[num]}</span>
                      </div>
                    ))}
                  </div>
                  {errors.q2_apply_knowledge && (
                    <span className="error-text" style={{ marginTop: '8px' }}>{errors.q2_apply_knowledge}</span>
                  )}
                </div>

                {/* Q3 */}
                <div className="question-row">
                  <div className="question-text">
                    3. แนวทางการปฏิบัติงานและคำแนะนำที่ได้รับจากทั้ง 2 สาขา เป็นไปในทิศทางเดียวกัน <span>*</span>
                  </div>
                  <div className="rating-group">
                    {[4, 3, 2, 1].map(num => (
                      <div
                        key={num}
                        className={`rating-box ${formData.q3_consistency === num ? 'selected' : ''}`}
                        onClick={() => setRating('q3_consistency', num)}
                      >
                        <span className="rating-number">{num}</span>
                        <span className="rating-label">{sec2RatingLabels[num]}</span>
                      </div>
                    ))}
                  </div>
                  {errors.q3_consistency && (
                    <span className="error-text" style={{ marginTop: '8px' }}>{errors.q3_consistency}</span>
                  )}
                </div>

                {/* Q4 */}
                <div style={{ marginTop: '32px' }} className="section-header">
                  <div className="section-title">4. ความเหมาะสมของ "ระยะเวลา 5 วัน กับการเรียนรู้ใน 2 สาขา"</div>
                </div>

                {/* Q4.1 */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>4.1 ระยะเวลาในการฝึกหน้าร้าน <span>*</span></label>
                  <div className="horizontal-choices">
                    {['น้อยเกินไป', 'มีความเหมาะสม', 'มากเกินไป'].map(choice => (
                      <div
                        key={choice}
                        className={`choice-box ${formData.q4_1_duration_suitability === choice ? 'selected' : ''}`}
                        onClick={() => setChoice('q4_1_duration_suitability', choice)}
                      >
                        {choice}
                      </div>
                    ))}
                  </div>
                  {errors.q4_1_duration_suitability && (
                    <span className="error-text">{errors.q4_1_duration_suitability}</span>
                  )}
                </div>

                {/* Q4.2 */}
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>4.2 จำนวนสาขาในการฝึกหน้าร้าน <span>*</span></label>
                  <div className="horizontal-choices">
                    {['น้อยเกินไป', 'มีความเหมาะสม', 'มากเกินไป'].map(choice => (
                      <div
                        key={choice}
                        className={`choice-box ${formData.q4_2_branches_suitability === choice ? 'selected' : ''}`}
                        onClick={() => setChoice('q4_2_branches_suitability', choice)}
                      >
                        {choice}
                      </div>
                    ))}
                  </div>
                  {errors.q4_2_branches_suitability && (
                    <span className="error-text">{errors.q4_2_branches_suitability}</span>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: การประเมินรายสาขา */}
            {step === 3 && (
              <div className="step-content">
                <div className="section-header">
                  <div className="section-title">ส่วนที่ 3: การประเมินรายสาขา</div>
                  <div className="section-desc">
                    ประเมินแยกรายสาขาที่เข้าปฏิบัติจริง (เกณฑ์: 4 = ดีเยี่ยม 3 = ดี 2 = พอใช้ 1 = ควรปรับปรุง)
                  </div>
                </div>

                <div className="branch-comp-headers mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="text-center" style={{ padding: '8px', backgroundColor: 'var(--red-tint)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>สาขาที่ 1</div>
                    <div className="branch-panel-name" style={{ fontSize: '13px' }}>{formData.branch1}</div>
                  </div>
                  <div className="text-center" style={{ padding: '8px', backgroundColor: 'var(--yellow-tint)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>สาขาที่ 2</div>
                    <div className="branch-panel-name" style={{ fontSize: '13px', color: 'var(--primary-yellow-hover)' }}>{formData.branch2}</div>
                  </div>
                </div>

                {/* Subtitle A */}
                <h3 className="section-title" style={{ fontSize: '14px', margin: '24px 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  หมวด ก: กระบวนการจัดการและวิธีการสอน
                </h3>

                {/* Q5 */}
                <div className="question-row">
                  <div className="question-text">5. การสอนในแต่ละส่วนงาน มีความชัดเจน เป็นลำดับขั้นตอน ไม่สับสน <span>*</span></div>
                  <div className="branch-comp-grid">
                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 1: {formData.branch1}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q5_clarity_branch1 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q5_clarity_branch1', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q5_clarity_branch1 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q5_clarity_branch1}</span>
                      )}
                    </div>

                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 2: {formData.branch2}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q5_clarity_branch2 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q5_clarity_branch2', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q5_clarity_branch2 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q5_clarity_branch2}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Q6 */}
                <div className="question-row">
                  <div className="question-text">6. ปริมาณเนื้อหาและงานที่ได้รับ มีความเหมาะสมกับเวลาที่กำหนดไว้ <span>*</span></div>
                  <div className="branch-comp-grid">
                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 1: {formData.branch1}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q6_volume_branch1 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q6_volume_branch1', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q6_volume_branch1 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q6_volume_branch1}</span>
                      )}
                    </div>

                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 2: {formData.branch2}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q6_volume_branch2 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q6_volume_branch2', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q6_volume_branch2 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q6_volume_branch2}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Q7 */}
                <div className="question-row">
                  <div className="question-text">7. สาขามีการจัดเตรียมอุปกรณ์เครื่องมือ หรือเอกสารประกอบการสอนไว้ให้อย่างพร้อมใช้งาน <span>*</span></div>
                  <div className="branch-comp-grid">
                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 1: {formData.branch1}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q7_readiness_branch1 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q7_readiness_branch1', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q7_readiness_branch1 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q7_readiness_branch1}</span>
                      )}
                    </div>

                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 2: {formData.branch2}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q7_readiness_branch2 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q7_readiness_branch2', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q7_readiness_branch2 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q7_readiness_branch2}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subtitle B */}
                <h3 className="section-title" style={{ fontSize: '14px', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  หมวด ข: คุณภาพของทีมผู้จัดการ พี่เลี้ยงและทีมงานประจำสาขา
                </h3>

                {/* Q8 */}
                <div className="question-row">
                  <div className="question-text">8. พี่เลี้ยง/ผู้สอน มีความรู้ ความเชี่ยวชาญ สามารถอธิบาย/ถ่ายทอดเนื้อหาได้อย่างเข้าใจ <span>*</span></div>
                  <div className="branch-comp-grid">
                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 1: {formData.branch1}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q8_trainer_knowledge_branch1 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q8_trainer_knowledge_branch1', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q8_trainer_knowledge_branch1 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q8_trainer_knowledge_branch1}</span>
                      )}
                    </div>

                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 2: {formData.branch2}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q8_trainer_knowledge_branch2 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q8_trainer_knowledge_branch2', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q8_trainer_knowledge_branch2 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q8_trainer_knowledge_branch2}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Q9 */}
                <div className="question-row">
                  <div className="question-text">9. พี่เลี้ยง/ผู้สอนได้อธิบายและให้ความสำคัญเรื่องความปลอดภัยหน้างานและมาตรฐานสุขอนามัย (Food Safety) <span>*</span></div>
                  <div className="branch-comp-grid">
                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 1: {formData.branch1}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q9_safety_hygiene_branch1 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q9_safety_hygiene_branch1', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q9_safety_hygiene_branch1 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q9_safety_hygiene_branch1}</span>
                      )}
                    </div>

                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 2: {formData.branch2}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q9_safety_hygiene_branch2 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q9_safety_hygiene_branch2', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q9_safety_hygiene_branch2 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q9_safety_hygiene_branch2}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Q10 */}
                <div className="question-row">
                  <div className="question-text">10. พี่เลี้ยง/ผู้สอน มีความใส่ใจ เป็นมิตร และเปิดโอกาสให้สอบถามข้อสงสัย <span>*</span></div>
                  <div className="branch-comp-grid">
                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 1: {formData.branch1}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q10_trainer_care_branch1 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q10_trainer_care_branch1', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q10_trainer_care_branch1 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q10_trainer_care_branch1}</span>
                      )}
                    </div>

                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 2: {formData.branch2}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q10_trainer_care_branch2 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q10_trainer_care_branch2', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q10_trainer_care_branch2 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q10_trainer_care_branch2}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Q11 */}
                <div className="question-row">
                  <div className="question-text">11. ภาพรวมทีมงานและบรรยากาศในสาขา ให้การต้อนรับและสนับสนุนการเรียนรู้ของท่าน <span>*</span></div>
                  <div className="branch-comp-grid">
                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 1: {formData.branch1}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q11_atmosphere_branch1 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q11_atmosphere_branch1', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q11_atmosphere_branch1 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q11_atmosphere_branch1}</span>
                      )}
                    </div>

                    <div>
                      <div className="branch-panel-title" style={{ fontSize: '11px', marginBottom: '6px' }}>สาขา 2: {formData.branch2}</div>
                      <div className="rating-group">
                        {[4, 3, 2, 1].map(num => (
                          <div
                            key={num}
                            className={`rating-box ${formData.q11_atmosphere_branch2 === num ? 'selected' : ''}`}
                            onClick={() => setRating('q11_atmosphere_branch2', num)}
                            style={{ padding: '8px 4px' }}
                          >
                            <span className="rating-number" style={{ fontSize: '14px' }}>{num}</span>
                            <span className="rating-label" style={{ fontSize: '9px' }}>{sec3RatingLabels[num]}</span>
                          </div>
                        ))}
                      </div>
                      {errors.q11_atmosphere_branch2 && (
                        <span className="error-text" style={{ marginTop: '6px', fontSize: '11px' }}>{errors.q11_atmosphere_branch2}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: ข้อเสนอแนะเพิ่มเติม */}
            {step === 4 && (
              <div className="step-content">
                <div className="section-header">
                  <div className="section-title">ส่วนที่ 4: ความคิดเห็นและข้อเสนอแนะเพิ่มเติม (Open-ended Feedback)</div>
                  <div className="section-desc">ช่วยให้ข้อมูลเพิ่มเติมเพื่อประกอบการพัฒนาระบบฝึกอบรม (กรุณากรอกข้อมูลให้ครบถ้วน)</div>
                </div>

                {/* Q12 */}
                <div className="form-group">
                  <label className="form-label" htmlFor="feedback12">
                    12. งานในส่วนใดหรือเนื้อหาใด ที่ท่านคิดว่า "เข้าใจยาก/ท้าทายที่สุด" เพราะเหตุใด <span>*</span>
                  </label>
                  <textarea
                    id="feedback12"
                    className="form-input"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    value={formData.feedback12_challenging}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, feedback12_challenging: e.target.value }));
                      if (errors.feedback12_challenging) {
                        setErrors(prev => ({ ...prev, feedback12_challenging: '' }));
                      }
                    }}
                    placeholder="ข้อคิดเห็นของท่าน..."
                  />
                  {errors.feedback12_challenging && (
                    <span className="error-text">{errors.feedback12_challenging}</span>
                  )}
                </div>

                {/* Q13 */}
                <div className="form-group">
                  <label className="form-label" htmlFor="feedback13">
                    13. ท่านคิดว่าจำนวนวันและจำนวนสาขาที่เหมาะสมในโปรแกรมการฝึกหน้าร้านควรเป็นอย่างไร <span>*</span>
                  </label>
                  <textarea
                    id="feedback13"
                    className="form-input"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    value={formData.feedback13_ideal_setup}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, feedback13_ideal_setup: e.target.value }));
                      if (errors.feedback13_ideal_setup) {
                        setErrors(prev => ({ ...prev, feedback13_ideal_setup: '' }));
                      }
                    }}
                    placeholder="ข้อคิดเห็นของท่าน..."
                  />
                  {errors.feedback13_ideal_setup && (
                    <span className="error-text">{errors.feedback13_ideal_setup}</span>
                  )}
                </div>

                {/* Q14 */}
                <div className="form-group">
                  <label className="form-label" htmlFor="feedback14">
                    14. สิ่งที่ประทับใจในการฝึกหน้าร้าน <span>*</span>
                  </label>
                  <textarea
                    id="feedback14"
                    className="form-input"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    value={formData.feedback14_impressions}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, feedback14_impressions: e.target.value }));
                      if (errors.feedback14_impressions) {
                        setErrors(prev => ({ ...prev, feedback14_impressions: '' }));
                      }
                    }}
                    placeholder="ข้อคิดเห็นของท่าน..."
                  />
                  {errors.feedback14_impressions && (
                    <span className="error-text">{errors.feedback14_impressions}</span>
                  )}
                </div>

                {/* Q15 */}
                <div className="form-group">
                  <label className="form-label" htmlFor="feedback15">
                    15. ข้อเสนอแนะอื่นๆ เพื่อการพัฒนาโปรแกรมการฝึกหน้าร้านต่อไป <span>*</span>
                  </label>
                  <textarea
                    id="feedback15"
                    className="form-input"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    value={formData.feedback15_suggestions}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, feedback15_suggestions: e.target.value }));
                      if (errors.feedback15_suggestions) {
                        setErrors(prev => ({ ...prev, feedback15_suggestions: '' }));
                      }
                    }}
                    placeholder="ข้อคิดเห็นของท่าน..."
                  />
                  {errors.feedback15_suggestions && (
                    <span className="error-text">{errors.feedback15_suggestions}</span>
                  )}
                </div>

                {submitError && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--red-tint)', color: 'var(--primary-red)', padding: '16px', borderRadius: 'var(--radius-md)', marginTop: '24px', fontSize: '14px', border: '1px solid #FECDD3' }}>
                    <AlertCircle size={18} />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: หน้าขอบคุณ (Success) */}
            {step === 5 && (
              <div className="success-screen">
                <div className="success-icon-wrapper">
                  <CheckCircle2 size={42} />
                </div>
                <h2 className="success-title">ส่งแบบสอบถามเรียบร้อยแล้ว</h2>
                <p className="success-message">
                  ฝ่ายทรัพยากรบุคคล (HRD) ขอขอบคุณสำหรับความร่วมมือในการตอบแบบสอบถาม
                  ข้อมูลและข้อเสนอแนะของท่านจะมีประโยชน์อย่างยิ่งในการปรับปรุงและพัฒนาระบบการฝึกอบรมของเราต่อไป
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    // Reset form and go back to step 1
                    setFormData({
                      department: '',
                      branch1: '',
                      branch1TrainingStart: '',
                      branch1TrainingEnd: '',
                      branch1Duration: '',
                      branch2: '',
                      branch2TrainingStart: '',
                      branch2TrainingEnd: '',
                      branch2Duration: '',
                      q1_benefit: 0,
                      q2_apply_knowledge: 0,
                      q3_consistency: 0,
                      q4_1_duration_suitability: '',
                      q4_2_branches_suitability: '',
                      q5_clarity_branch1: 0,
                      q5_clarity_branch2: 0,
                      q6_volume_branch1: 0,
                      q6_volume_branch2: 0,
                      q7_readiness_branch1: 0,
                      q7_readiness_branch2: 0,
                      q8_trainer_knowledge_branch1: 0,
                      q8_trainer_knowledge_branch2: 0,
                      q9_safety_hygiene_branch1: 0,
                      q9_safety_hygiene_branch2: 0,
                      q10_trainer_care_branch1: 0,
                      q10_trainer_care_branch2: 0,
                      q11_atmosphere_branch1: 0,
                      q11_atmosphere_branch2: 0,
                      feedback12_challenging: '',
                      feedback13_ideal_setup: '',
                      feedback14_impressions: '',
                      feedback15_suggestions: '',
                    });
                    setStep(1);
                  }}
                >
                  ทำแบบสอบถามอีกครั้ง
                </button>
              </div>
            )}

          </div>

          {/* Footer Controls (Hide on Success Screen) */}
          {step < 5 && (
            <div className="wizard-footer">
              {step > 1 ? (
                <button
                  key="back-btn"
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ChevronLeft size={16} /> กลับ
                </button>
              ) : (
                <div key="back-placeholder" /> // Placeholder to align next button to the right
              )}

              {step < 4 ? (
                <button
                  key="next-btn"
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                >
                  ถัดไป <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  key="submit-btn"
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--primary-green)' }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งแบบสอบถาม'} <Send size={16} />
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} In Restaurant Training Program. All rights reserved.
      </div>
    </div>
  );
}
