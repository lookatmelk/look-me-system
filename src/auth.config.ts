import type { NextAuthConfig } from 'next-auth';

/**
 * Auth configuration that is safe to use in Edge runtime (middleware).
 * Does NOT include the Credentials provider or bcryptjs.
 */
const authConfig: NextAuthConfig = {
  providers: [], // Providers are added in the full auth.ts
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
  },
};

export default authConfig;
