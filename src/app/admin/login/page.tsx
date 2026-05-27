'use client';

import React, { useState } from 'react';
import { adminLogin } from '@/app/actions/admin';
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await adminLogin(password);
      if (result.success) {
        // Force full refresh to clear cookies/layouts
        window.location.href = '/admin/dashboard';
      } else {
        setError(result.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดทางเทคนิค กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '16px', backgroundColor: '#F1F5F9' }}>
      <div className="theme-header-bar" />
      
      <div className="login-card" style={{ width: '100%' }}>
        <div className="survey-header">
          <h1 className="survey-title" style={{ fontSize: '20px' }}>เข้าสู่ระบบผู้ดูแลระบบ</h1>
          <p className="survey-subtitle">In Restaurant Training Program Survey</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">รหัสผ่านผู้ดูแลระบบ</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Lock size={18} className="search-icon" style={{ left: '14px' }} />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '42px', paddingRight: '40px' }}
                placeholder="กรอกรหัสผ่านเข้าใช้งาน..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="dropdown-trigger-btn"
                style={{ right: '12px' }}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--red-tint)', color: 'var(--primary-red)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '13px', border: '1px solid #FECDD3' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
            style={{ padding: '12px' }}
          >
            {isSubmitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}
