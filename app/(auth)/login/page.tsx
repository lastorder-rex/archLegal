import { getServerSession } from 'next-auth';
import AuthPanel from '@/components/auth/AuthPanel';
import { authOptions } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/supabase/admin';
import type { UserProfile } from '@/types/profile';

export const revalidate = 0;

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  let profile: UserProfile | null = null;

  if (session?.user?.id) {
    try {
      // FIX: Query Supabase with service role to mirror NextAuth identities.
      const admin = createSupabaseAdminClient();
      const { data } = await admin
        .from('users')
        .select('auth_id, full_name, email, phone')
        .eq('auth_id', session.user.id)
        .limit(1);

      const row = data?.[0] as UserProfile | undefined;

      if (row) {
        profile = row;
      } else {
        profile = {
          auth_id: session.user.id,
          full_name: session.user.name ?? null,
          email: session.user.email ?? null,
          phone: session.user.phone ?? null
        };
      }
    } catch (error) {
      console.error('Failed to fetch profile from Supabase', error);
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
