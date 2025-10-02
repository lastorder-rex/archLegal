'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        setAdmin(data.admin);
        setIsAuthenticated(true);
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

              {loginError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {loginError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <h1 className="text-xl font-bold text-slate-900 flex-[6] md:flex-[8]">관리자 대시보드</h1>
          <div className="flex-[4] md:flex-[2] flex justify-end">
            <Button variant="ghost" onClick={handleLogout} className="h-8 px-2 text-sm min-w-0 whitespace-nowrap">
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Menu */}
          <aside className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">메뉴</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => router.push('/supercore/consultations')}
                    className="w-full text-left px-4 py-2 rounded-md hover:bg-slate-100 transition-colors text-slate-700 hover:text-slate-900"
                  >
                    📋 상담 게시판
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/supercore/users')}
                    className="w-full text-left px-4 py-2 rounded-md hover:bg-slate-100 transition-colors text-slate-700 hover:text-slate-900"
                  >
                    👥 회원 관리
                  </button>
                </li>
                <li>
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 rounded-md text-slate-400 cursor-not-allowed"
                  >
                    💳 결제 관리 (준비중)
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
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
          </main>
        </div>
      </div>
    </div>
  );
}
