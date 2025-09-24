import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import SupabaseProvider from '../components/providers/SupabaseProvider';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { cn } from '../lib/utils';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const themeInitializer = `(function() {
  const storageKey = 'ui-theme';
  const root = document.documentElement;
  const stored = window.localStorage.getItem(storageKey);
  const theme = stored ?? 'light';

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
})();`;

export const metadata: Metadata = {
  title: 'Kakao Auth Demo',
  description: 'Kakao social login powered by Supabase Auth'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return (
    <html lang="ko" className="theme" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body className={cn('min-h-screen bg-background text-foreground antialiased', inter.className)}>
        <SupabaseProvider initialSession={session}>
          <div className="fixed right-4 top-4 z-50 flex items-center">
            <ThemeToggle />
          </div>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
