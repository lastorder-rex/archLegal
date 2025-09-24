import NextAuth, { type DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// FIX: Augment NextAuth types with Kakao-specific metadata.

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      id?: string | null;
      phone?: string | null;
    };
  }

  interface User {
    phone?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    phone?: string | null;
  }
}
