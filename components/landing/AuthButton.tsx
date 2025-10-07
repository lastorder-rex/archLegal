import type { User } from '@supabase/supabase-js';

interface AuthButtonProps {
  sessionUser: User | null;
  size?: 'desktop' | 'mobile';
  onLogin: () => void;
  onLogout: () => void;
}

export function AuthButton({ sessionUser, size = 'desktop', onLogin, onLogout }: AuthButtonProps) {
  const sizeClasses =
    size === 'desktop' ? 'px-4 py-1.5 text-xs sm:text-sm' : 'px-3 py-1 text-xs';

  const baseClasses =
    'rounded-full border border-white/50 font-semibold text-white transition hover:border-white hover:bg-white/10';

  if (sessionUser) {
    return (
      <button type="button" onClick={onLogout} className={`${baseClasses} ${sizeClasses}`}>
        로그아웃
      </button>
    );
  }

  return (
    <button type="button" onClick={onLogin} className={`${baseClasses} ${sizeClasses}`}>
      로그인/회원가입
    </button>
  );
}
