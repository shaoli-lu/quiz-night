import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Paths that don't require authentication
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Check if password protection is enabled
  const password = process.env.APP_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = req.cookies.get('app-auth');
  
  if (authCookie?.value === 'authenticated') {
    return NextResponse.next();
  }

  // Redirect to login page
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


