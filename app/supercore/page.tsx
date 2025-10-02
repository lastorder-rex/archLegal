'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';

interface Admin {
  id: string;
  username: string;
}

export default function SupercorePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(null);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
          twoFactorCode: requires2FA ? twoFactorCode : undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires2FA) {
          setRequires2FA(true);
          setLoginError('');
        } else {
          setAdmin(data.admin);
          setIsAuthenticated(true);
        }
      } else {
        setLoginError(data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      setIsAuthenticated(false);
      setAdmin(null);
      setUsername('');
      setPassword('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">로딩 중...</div>
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Supercore Admin</h1>
              <p className="text-slate-600">관리자 로그인</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {!requires2FA ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">아이디</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="아이디를 입력하세요"
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-600 mb-4">
                      Google Authenticator 앱에서<br />6자리 인증 코드를 입력하세요.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twoFactorCode">2단계 인증 코드</Label>
                    <Input
                      id="twoFactorCode"
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                      autoComplete="off"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setRequires2FA(false);
                      setTwoFactorCode('');
                      setLoginError('');
                    }}
                  >
                    ← 뒤로 가기
                  </Button>
                </div>
              )}

              {loginError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {loginError}
                </div>
              )}

              {!requires2FA && (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? '로그인 중...' : '로그인'}
                </Button>
              )}

              {requires2FA && (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? '확인 중...' : '인증 확인'}
                </Button>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <SupercoreLayout title="관리자 대시보드">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">대시보드</h2>
        <p className="text-slate-600 mb-6">
          좌측 메뉴에서 원하는 기능을 선택하세요.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 상담 게시판</h3>
            <p className="text-sm text-blue-700">
              고객 상담 요청을 확인하고 관리합니다.
            </p>
            <Button
              onClick={() => router.push('/supercore/consultations')}
              variant="outline"
              className="mt-3 w-full"
            >
              바로가기
            </Button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">👥 회원 관리</h3>
            <p className="text-sm text-green-700">
              회원 정보와 상담 내역을 관리합니다.
            </p>
            <Button
              onClick={() => router.push('/supercore/users')}
              variant="outline"
              className="mt-3 w-full"
            >
              바로가기
            </Button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-400 mb-2">💳 결제 관리</h3>
            <p className="text-sm text-slate-400">
              준비 중입니다.
            </p>
          </div>
        </div>
      </div>
    </SupercoreLayout>
  );
}
