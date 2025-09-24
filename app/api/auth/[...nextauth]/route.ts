import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// FIX: Delegate auth route handling to NextAuth with centralized options.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
