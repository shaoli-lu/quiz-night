import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Check if password protection is enabled via environment variable
  const password = process.env.APP_PASSWORD;
  
  if (!password) {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get('authorization');
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1] || '';
    
    // Decode base64 value
    const decodedValue = atob(authValue);
    const splitIndex = decodedValue.indexOf(':');
    
    // Extract password, username isn't strictly checked here
    const pwd = decodedValue.substring(splitIndex + 1);

    if (pwd === password) {
      return NextResponse.next();
    }
  }

  // Request basic auth
  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
