'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

type Props = {
  children: React.ReactNode;
  session: Session | null;
};

export default function AppSessionProvider({ children, session }: Props) {
  // FIX: Expose NextAuth session to client components.
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
