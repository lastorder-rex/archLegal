import type { NextAuthOptions } from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import { assertNextAuthEnv } from './env';
import { createSupabaseAdminClient } from '@/supabase/admin';

assertNextAuthEnv();

function ensureEnv(name: 'KAKAO_CLIENT_ID' | 'KAKAO_CLIENT_SECRET' | 'NEXTAUTH_SECRET') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function extractProfileDetails(profile?: unknown) {
  const kakaoProfile = profile as
    | {
        kakao_account?: {
          email?: string;
          phone_number?: string;
          profile?: { nickname?: string };
        };
        properties?: { nickname?: string };
      }
    | undefined;

  const account = kakaoProfile?.kakao_account;
  const nickname = account?.profile?.nickname ?? kakaoProfile?.properties?.nickname ?? null;

  return {
    email: account?.email ?? null,
    phone: account?.phone_number ?? null,
    name: nickname
  };
}

export const authOptions: NextAuthOptions = {
  secret: ensureEnv('NEXTAUTH_SECRET'),
  providers: [
    KakaoProvider({
      clientId: ensureEnv('KAKAO_CLIENT_ID'),
      clientSecret: ensureEnv('KAKAO_CLIENT_SECRET')
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // FIX: Normalize Kakao identifiers to stabilize downstream profile lookups.
      if (account?.providerAccountId) {
        token.sub = account.providerAccountId;
      }

      const { email, name, phone } = extractProfileDetails(profile);

      if (email) {
        token.email = email;
      }

      if (name) {
        token.name = name;
      }

      if (phone) {
        (token as Record<string, unknown>).phone = phone;
      }

      return token;
    },
    async session({ session, token }) {
      // FIX: Expose normalized identifiers and contact info to the client session.
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.phone = (token as Record<string, string | undefined>).phone ?? null;
      }

      return session;
    }
  },
  events: {
    async signIn({ user, profile, account }) {
      // FIX: Sync Kakao profile to Supabase for downstream queries.
      try {
        const admin = createSupabaseAdminClient();
        const authId = account?.providerAccountId ?? user.id;
        const { email, name, phone } = extractProfileDetails(profile);

        await admin
          .from('users')
          .upsert(
            {
              auth_id: authId,
              email: email ?? user.email ?? null,
              full_name: name ?? user.name ?? null,
              phone: phone ?? (user as Record<string, string | null | undefined>).phone ?? null
            },
            { onConflict: 'auth_id' }
          );
      } catch (error) {
        console.error('Failed to sync Kakao profile to Supabase', error);
      }
    }
  }
};
