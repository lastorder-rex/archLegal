'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReactNode, useEffect, useState } from 'react';
import { handleAdminLogout } from '@/lib/auth/logout';
import { Box, FileText, Users, CreditCard, UserCog, LogOut } from 'lucide-react';

interface SupercoreLayoutProps {
  children: ReactNode;
  title?: string;
  onLogout?: () => void;
}

export default function SupercoreLayout({ children, title, onLogout }: SupercoreLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const { documentElement, body } = document;
    documentElement.classList.remove('dark');
    body.dataset.admin = 'true';

    try {
      window.localStorage.setItem('ui-theme', 'light');
    } catch (error) {
      console.error('Failed to persist admin theme preference', error);
    }

    return () => {
      if (body.dataset.admin === 'true') {
        delete body.dataset.admin;
      }
    };
  }, []);

  const handleLogout = async () => {
    await handleAdminLogout(router, onLogout);
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
        <div className="container mx-auto px-2 md:px-4 lg:px-6 py-3 flex items-center justify-between max-w-[1600px]">
          <h1 className="text-xl font-bold text-slate-900">
            {title || '관리자 대시보드'}
          </h1>
          <div className="flex items-center gap-2">
            {/* Logout Button */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="h-8 px-3 text-sm min-w-0 whitespace-nowrap flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>

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
                className={`w-full text-left px-4 py-2 rounded-md transition-colors flex items-center gap-3 ${
                  pathname === '/supercore'
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                <Box className="w-5 h-5" />
                <span>대시보드</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleMenuClick('/supercore/consultations')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors flex items-center gap-3 ${
                  isActive('/supercore/consultations')
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>상담 게시판</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleMenuClick('/supercore/users')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors flex items-center gap-3 ${
                  isActive('/supercore/users')
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>회원 관리</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleMenuClick('/supercore/payments')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors flex items-center gap-3 ${
                  isActive('/supercore/payments')
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>결제 관리</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleMenuClick('/supercore/admins')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors flex items-center gap-3 ${
                  isActive('/supercore/admins')
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                <UserCog className="w-5 h-5" />
                <span>관리자 계정</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <div className="container mx-auto px-2 md:px-4 lg:px-6 py-8 max-w-[1600px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
          {/* Desktop Sidebar Menu */}
          <aside className="hidden md:block md:col-span-3 lg:col-span-2">
            <nav className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sticky top-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">메뉴</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => router.push('/supercore')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors flex items-center gap-3 ${
                      pathname === '/supercore'
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Box className="w-5 h-5" />
                    <span>대시보드</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/supercore/consultations')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors flex items-center gap-3 ${
                      isActive('/supercore/consultations')
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span>상담 게시판</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/supercore/users')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors flex items-center gap-3 ${
                      isActive('/supercore/users')
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>회원 관리</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/supercore/payments')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors flex items-center gap-3 ${
                      isActive('/supercore/payments')
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>결제 관리</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/supercore/admins')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors flex items-center gap-3 ${
                      isActive('/supercore/admins')
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <UserCog className="w-5 h-5" />
                    <span>관리자 계정</span>
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-9 lg:col-span-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
