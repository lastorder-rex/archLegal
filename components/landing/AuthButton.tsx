import type { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { Enter } from 'lineicons-react';

interface AuthButtonProps {
  sessionUser: User | null;
  size?: 'desktop' | 'mobile';
  onLogin: () => void;
  onLogout: () => void;
}

export function AuthButton({ sessionUser, size = 'desktop', onLogin, onLogout }: AuthButtonProps) {
  const sizeClasses =
    size === 'desktop' ? 'px-4 py-1.5 text-base' : 'px-3 py-1 text-xs';

  const baseClasses =
    'rounded-full border border-white/50 font-semibold text-white transition hover:border-white hover:bg-white/10';

  if (sessionUser) {
    return (
      <button
        type="button"
        onClick={onLogout}
        className={`flex items-center gap-2 ${baseClasses} ${sizeClasses}`.trim()}
      >
        <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
        <span>로그아웃</span>
      </button>
    );
  }

  return (
    <button type="button" onClick={onLogin} className={`flex items-center gap-2 ${baseClasses} ${sizeClasses}`.trim()}>
      <Enter className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      <span>로그인/회원가입</span>
    </button>
  );
}
