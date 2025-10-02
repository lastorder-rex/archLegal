'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReactNode, useState } from 'react';

interface SupercoreLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function SupercoreLayout({ children, title }: SupercoreLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/supercore');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  const handleMenuClick = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">
            {title || '관리자 대시보드'}
          </h1>
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden h-8 px-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>

            {/* Logout Button */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="h-8 px-2 text-sm min-w-0 whitespace-nowrap"
            >
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">메뉴</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-500 hover:text-slate-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => handleMenuClick('/supercore')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  pathname === '/supercore'
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                🏠 대시보드
              </button>
            </li>
            <li>
              <button
                onClick={() => handleMenuClick('/supercore/consultations')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  isActive('/supercore/consultations')
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                📋 상담 게시판
              </button>
            </li>
            <li>
              <button
                onClick={() => handleMenuClick('/supercore/users')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  isActive('/supercore/users')
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
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
            <li>
              <button
                onClick={() => handleMenuClick('/supercore/admins')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  isActive('/supercore/admins')
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                👤 관리자 계정
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Desktop Sidebar Menu */}
          <aside className="hidden md:block md:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sticky top-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">메뉴</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => router.push('/supercore')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      pathname === '/supercore'
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    🏠 대시보드
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/supercore/consultations')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      isActive('/supercore/consultations')
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    📋 상담 게시판
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/supercore/users')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      isActive('/supercore/users')
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
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
                <li>
                  <button
                    onClick={() => router.push('/supercore/admins')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      isActive('/supercore/admins')
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    👤 관리자 계정
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
