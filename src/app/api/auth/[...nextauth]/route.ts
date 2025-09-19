import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

console.log('DEBUG: NEXTAUTH_URL at API route:', process.env.NEXTAUTH_URL);

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
