import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isApiProtected =
    pathname.startsWith('/api/suppliers') ||
    pathname.startsWith('/api/categories') ||
    pathname.startsWith('/api/purchasing');
  const isLoginPage = pathname === '/login';

  const session = req.auth;

  // Redirect authenticated users away from login page
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/admin/purchasing', req.url));
  }

  // Protect admin routes — redirect to login
  if (isAdminRoute && !session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect API routes — return 401 JSON
  if (isApiProtected && !session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/api/suppliers/:path*',
    '/api/categories/:path*',
    '/api/purchasing/:path*',
  ],
};
