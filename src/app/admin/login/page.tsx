'use client';

import React, { useState, useEffect } from 'react';
import { loginWithLine } from '@/app/actions/line';
import { adminLogin } from '@/app/actions/admin';
import { AlertCircle, MessageSquare, Lock } from 'lucide-react';
import Script from 'next/script';

declare global {
  interface Window {
    liff: any;
  }
}

function getRedirectPath(searchString: string): string | null {
  const params = new URLSearchParams(searchString);
  
  // 1. Try liff.state
  const liffState = params.get('liff.state');
  if (liffState) {
    try {
      const decoded = decodeURIComponent(liffState);
      const adminIndex = decoded.indexOf('/admin');
      if (adminIndex !== -1) {
        return decoded.substring(adminIndex);
      }
    } catch (e) {}
  }
  
  // 2. Try liffRedirectUri
  const liffRedirectUri = params.get('liffRedirectUri');
  if (liffRedirectUri) {
    try {
      const url = new URL(liffRedirectUri);
      const adminIndex = url.pathname.indexOf('/admin');
      if (adminIndex !== -1) {
        return url.pathname.substring(adminIndex) + url.search;
      }
    } catch (e) {}
  }
  
  // 3. Try standard query params like id or filter
  const id = params.get('id');
  if (id) {
    return `/admin/tasks?id=${id}`;
  }
  const filter = params.get('filter');
  if (filter) {
    return `/admin/dashboard?filter=${filter}`;
  }
  
  return null;
}

export default function AdminLoginPage() {
  const [isLineSubmitting, setIsLineSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasscodeSubmitting, setIsPasscodeSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [liffInitialized, setLiffInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      // Only save if it's not a callback URL from LINE OAuth
      if (!searchParams.has('code') && !searchParams.has('state')) {
        const redirectPath = getRedirectPath(window.location.search);
        if (redirectPath) {
          localStorage.setItem('redirect_after_login', redirectPath);
          console.log('Saved redirect path:', redirectPath);
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
        let redirectUrl = '/admin/dashboard';
        if (typeof window !== 'undefined') {
          const savedPath = localStorage.getItem('redirect_after_login');
          if (savedPath) {
            redirectUrl = savedPath;
            localStorage.removeItem('redirect_after_login');
          } else {
            const currentPath = getRedirectPath(window.location.search);
            if (currentPath) {
              redirectUrl = currentPath;
            }
          }
        }
        if (redirectUrl.startsWith('?')) {
          redirectUrl = `/admin/dashboard${redirectUrl}`;
        } else if (!redirectUrl.startsWith('/')) {
          redirectUrl = '/admin/dashboard';
        }
        window.location.href = redirectUrl;
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

  // Password login submit handler
  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsPasscodeSubmitting(true);
    setError(null);
    try {
      const res = await adminLogin(password);
      if (res.success) {
        let redirectUrl = '/admin/dashboard';
        if (typeof window !== 'undefined') {
          const savedPath = localStorage.getItem('redirect_after_login');
          if (savedPath) {
            redirectUrl = savedPath;
            localStorage.removeItem('redirect_after_login');
          }
        }
        window.location.href = redirectUrl;
      } else {
        setError(res.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
    } finally {
      setIsPasscodeSubmitting(false);
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

          {/* LINE Login Action */}
          <div style={{ padding: '32px' }}>
            {error && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--red-tint)', color: 'var(--primary-red)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '13px', border: '1px solid #FECDD3' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              className="btn w-full"
              onClick={handleLineAuth}
              disabled={isLineSubmitting || !!liffError}
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
                cursor: (isLineSubmitting || !!liffError) ? 'not-allowed' : 'pointer'
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

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: '#94A3B8', fontSize: '12px' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E2E8F0' }} />
              <span style={{ padding: '0 12px' }}>หรือเข้าสู่ระบบด้วยรหัสผ่านสำรอง</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E2E8F0' }} />
            </div>

            {/* Passcode Login Form */}
            <form onSubmit={handlePasscodeSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                  <Lock size={14} /> รหัสผ่านผู้ดูแลระบบ
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="กรอกรหัสผ่าน..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: '6px', fontSize: '14px', borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-secondary w-full"
                disabled={isPasscodeSubmitting}
                style={{ padding: '10px', fontSize: '14px', cursor: isPasscodeSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isPasscodeSubmitting ? 'กำลังตรวจสอบรหัสผ่าน...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
