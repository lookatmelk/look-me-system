import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import authConfig from '@/auth.config';

const DEV_FALLBACK_EMAIL = 'admin@lookatme.com';
// Hash for password: Admin@1234
const DEV_FALLBACK_HASH = '$2b$10$K3PIJcQQLM3P2zZpa4YW5eMMvnvu8eKvKh2Giap9ZR0QwGwvavIXC';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const adminEmail =
          process.env.ADMIN_EMAIL ||
          (process.env.NODE_ENV !== 'production' ? DEV_FALLBACK_EMAIL : undefined);
        const adminPasswordHash =
          process.env.ADMIN_PASSWORD_HASH ||
          (process.env.NODE_ENV !== 'production' ? DEV_FALLBACK_HASH : undefined);

        if (!adminEmail || !adminPasswordHash) {
          console.error('ADMIN_EMAIL or ADMIN_PASSWORD_HASH is not set in environment variables.');
          return null;
        }

        if (credentials.email !== adminEmail) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          adminPasswordHash,
        );

        if (!isValid) return null;

        return {
          id: '1',
          name: 'Admin',
          email: adminEmail,
        };
      },
    }),
  ],
});
