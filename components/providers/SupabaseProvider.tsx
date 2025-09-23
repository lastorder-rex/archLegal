'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useEffect, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

type Props = {
  children: React.ReactNode;
  initialSession: Session | null;
};

export default function SupabaseProvider({ children, initialSession }: Props) {
  const [supabase] = useState<SupabaseClient>(() => createClientComponentClient());

  useEffect(() => {
    // refresh session when auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      // Next.js App Router handles revalidation via router.refresh in client components
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}
