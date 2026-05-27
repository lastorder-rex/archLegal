import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import SupabaseProvider from '../components/providers/SupabaseProvider';
import QueryProvider from '../components/providers/QueryProvider';
import { CopyProtection } from '../components/CopyProtection';
import { cn } from '../lib/utils';
import { isUserSessionExpired } from '@/lib/auth/user-session';
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
  applicationName: '양성화.com',
  title: '양성화.com | 인건(仁建) 위반건축물 양성화 전문 플랫폼',
  description: '양성화.com은 인건(仁建)의 위반건축물·불법건축물 양성화 상담 서비스입니다. 특정건축물 정리, 추인허가, 이행강제금 상담을 제공합니다.',
  verification: {
    google: 'p7WIGZAwCfciOQ_W4f0HIfNk41SWCI7f5uKVBh9HbxA',
    other: {
      'naver-site-verification': '8ac76bcd8471aa77c7da87ed9490d764716cdd22',
      'msvalidate.01': '918CCA78985C4CF5624C1F2712123FB0'
    }
  },
  icons: {
    icon: [
      { url: 'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/archlegal-fa.ico', rel: 'icon', sizes: 'any' },
      { url: 'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/archlegal-fa-p.png', rel: 'icon', type: 'image/png', sizes: '512x512' }
    ]
  },
  openGraph: {
    title: '양성화.com | 인건(仁建) 위반건축물 양성화 전문 플랫폼',
    description: '양성화.com은 인건(仁建)의 위반건축물·불법건축물 양성화 상담 서비스입니다. 특정건축물 정리, 추인허가, 이행강제금 상담을 제공합니다.',
    url: 'https://www.archlegal.co.kr',
    type: 'website',
    images: [
      {
        url: 'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/archlegal-og.png'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: '양성화.com | 인건(仁建) 위반건축물 양성화 전문 플랫폼',
    description: '양성화.com은 인건(仁建)의 위반건축물·불법건축물 양성화 상담 서비스입니다. 특정건축물 정리, 추인허가, 이행강제금 상담을 제공합니다.',
    images: ['https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/archlegal-og.png']
  },

};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const initialSession = isUserSessionExpired(cookieStore) ? null : session;

  return (
    <html lang="ko" className="theme" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body className={cn('min-h-screen bg-background text-foreground antialiased select-none', inter.className)}>
        <CopyProtection />
        <SupabaseProvider initialSession={initialSession}>
          <QueryProvider>{children}</QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
