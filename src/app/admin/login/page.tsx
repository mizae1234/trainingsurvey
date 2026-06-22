'use client';

import React, { useState, useEffect } from 'react';
import { adminLogin } from '@/app/actions/admin';
import { loginWithLine } from '@/app/actions/line';
import { Lock, AlertCircle, Eye, EyeOff, MessageSquare } from 'lucide-react';
import Script from 'next/script';

declare global {
  interface Window {
    liff: any;
  }
}

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLineSubmitting, setIsLineSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [liffInitialized, setLiffInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      // Only save if it's not a callback URL from LINE OAuth
      if (!searchParams.has('code') && !searchParams.has('state')) {
        const search = window.location.search;
        if (search && (search.includes('id=') || search.includes('filter='))) {
          localStorage.setItem('redirect_after_login', search);
          console.log('Saved redirect query:', search);
        }
      }
    }
  }, []);

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

  // Initialize LINE LIFF
  const initLiff = async () => {
    if (!liffId) {
      console.warn('NEXT_PUBLIC_LIFF_ID is not configured in environment variables');
      setLiffError('LINE Login is not configured (missing LIFF ID)');
      return;
    }

    try {
      if (window.liff) {
        await window.liff.init({ liffId });
        setLiffInitialized(true);
        console.log('LINE LIFF Initialized successfully!');
        
        // Auto login if already logged in via LIFF browser context
        if (window.liff.isLoggedIn()) {
          handleLineAuth();
        } else {
          // If we are running inside the LINE app (LIFF client) but not logged in, trigger login automatically
          if (window.liff.isInClient()) {
            console.log('Inside LINE app, triggering automatic login...');
            const redirectUri = window.location.href;
            window.liff.login({ redirectUri });
          }
        }
      }
    } catch (err: any) {
      console.error('LINE LIFF initialization failed:', err);
      setLiffError(`LINE LIFF Init Failed: ${err.message || err}`);
    }
  };

  const handleLineAuth = async () => {
    if (!window.liff) return;
    setIsLineSubmitting(true);
    setError(null);

    try {
      if (!window.liff.isLoggedIn()) {
        const redirectUri = window.location.href;
        window.liff.login({ redirectUri });
        return;
      }

      const profile = await window.liff.getProfile();
      const res = await loginWithLine({
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || undefined,
        statusMessage: profile.statusMessage || undefined
      });

      if (res.success) {
        let targetQuery = '';
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('redirect_after_login');
          if (saved) {
            targetQuery = saved;
            localStorage.removeItem('redirect_after_login');
          } else {
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.delete('code');
            searchParams.delete('state');
            searchParams.delete('liffClientId');
            searchParams.delete('liffRedirectUri');
            const cleanQuery = searchParams.toString();
            if (cleanQuery) {
              targetQuery = `?${cleanQuery}`;
            }
          }
        }
        window.location.href = `/admin/dashboard${targetQuery}`;
      } else {
        setError(res.error || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ผู้ใช้ LINE');
        // Do not call window.liff.logout() automatically to prevent redirect loops.
        // The user can refresh the page once the administrator has granted them admin permissions.
      }
    } catch (err: any) {
      console.error('LINE authentication failed:', err);
      setError('เกิดข้อผิดพลาดระหว่างล็อกอินผ่าน LINE: ' + (err.message || err));
      // Do not automatically logout
    } finally {
      setIsLineSubmitting(false);
    }
  };

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
        const queryString = typeof window !== 'undefined' ? window.location.search : '';
        window.location.href = `/admin/dashboard${queryString}`;
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
    <>
      {/* Load LINE LIFF SDK CDN */}
      <Script 
        src="https://static.line-scdn.net/liff/edge/2/sdk.js" 
        onLoad={initLiff}
        strategy="lazyOnload"
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '16px', backgroundColor: '#F1F5F9' }}>
        <div className="theme-header-bar" />
        
        <div className="login-card" style={{ width: '100%' }}>
          <div className="survey-header">
            <h1 className="survey-title" style={{ fontSize: '20px' }}>เข้าสู่ระบบผู้ดูแลระบบ</h1>
            <p className="survey-subtitle">In Restaurant Training Program Survey</p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '32px 32px 16px 32px' }}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
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
                  disabled={isSubmitting || isLineSubmitting}
                />
                <button
                  type="button"
                  className="dropdown-trigger-btn"
                  style={{ right: '12px' }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting || isLineSubmitting}
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
              disabled={isSubmitting || isLineSubmitting}
              style={{ padding: '12px' }}
            >
              {isSubmitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบด้วยรหัสผ่าน'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '0 32px', gap: '16px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>หรือ</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          {/* LINE Login Action */}
          <div style={{ padding: '16px 32px 32px 32px' }}>
            <button
              type="button"
              className="btn w-full"
              onClick={handleLineAuth}
              disabled={isSubmitting || isLineSubmitting || !!liffError}
              style={{ 
                padding: '12px', 
                backgroundColor: '#06C755', 
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                cursor: (isSubmitting || isLineSubmitting || !!liffError) ? 'not-allowed' : 'pointer'
              }}
            >
              <MessageSquare size={18} fill="#FFFFFF" color="#06C755" />
              {isLineSubmitting ? 'กำลังล็อกอินผ่าน LINE...' : 'เข้าสู่ระบบด้วย LINE'}
            </button>
            
            {liffError && (
              <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', marginTop: '8px' }}>
                {liffError}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
