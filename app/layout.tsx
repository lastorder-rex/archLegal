import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import SupabaseProvider from '../components/providers/SupabaseProvider';
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
  metadataBase: new URL('https://www.archlegal.co.kr'),
  title: 'ArchLegal - 건축물 양성화 전문 플랫폼',
  description: '불법 건축물을 합법적으로 정리하는 전문 플랫폼',
  icons: {
    icon: [
      { url: '/docu/archlegal-fa.ico', rel: 'icon', sizes: 'any' },
      { url: '/docu/archlegal-fa-p.png', rel: 'icon', type: 'image/png', sizes: '512x512' }
    ]
  },
  openGraph: {
    title: 'ArchLegal - 건축물 양성화 전문 플랫폼',
    description: '불법 건축물을 합법적으로 정리하는 전문 플랫폼',
    url: 'https://www.archlegal.co.kr',
    type: 'website',
    images: [
      {
        url: 'https://www.archlegal.co.kr/docu/archlegal-og.png'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArchLegal - 건축물 양성화 전문 플랫폼',
    description: '불법 건축물을 합법적으로 정리하는 전문 플랫폼',
    images: ['https://www.archlegal.co.kr/docu/archlegal-og.png']
  }
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
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
