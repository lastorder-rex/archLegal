import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import AppSessionProvider from '@/components/providers/AppSessionProvider';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { authOptions } from '@/lib/auth';
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
  description: 'Kakao social login powered by NextAuth'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // FIX: Resolve the active session via NextAuth on the server.
  const session = await getServerSession(authOptions);

  return (
    <html lang="ko" className="theme" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body className={cn('min-h-screen bg-background text-foreground antialiased', inter.className)}>
        <AppSessionProvider session={session}>
          <div className="fixed right-4 top-4 z-50 flex items-center">
            <ThemeToggle />
          </div>
          {children}
        </AppSessionProvider>
      </body>
    </html>
  );
}
