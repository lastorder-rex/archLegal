import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import AuthPanel from '../components/auth/AuthPanel';
import type { UserProfile } from '../types/profile';

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  let profile: UserProfile | null = null;

  if (session?.user) {
    const { data: profileRows } = await supabase
      .from('users')
      .select('auth_id, full_name, email, phone')
      .eq('auth_id', session.user.id)
      .limit(1);

    const data = profileRows?.[0] as UserProfile | undefined;

    if (data) {
      profile = data;
    } else {
      profile = {
        auth_id: session.user.id,
        full_name: (session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email) ?? null,
        email: session.user.email,
        phone: session.user.phone ?? null
      };
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <AuthPanel sessionUser={session?.user ?? null} profile={profile} />
      </div>
    </main>
  );
}
