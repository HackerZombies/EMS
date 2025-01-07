import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const response = NextResponse.next();

  // Check if the request seems to be for a 404 page
  // This is a heuristic approach, as middleware runs before the page is rendered
  // and we don't have the final status code here.
  // You might need to adjust this condition based on your application's routing patterns.
  if (pathname.startsWith('/404') || pathname.startsWith('/api/404')) {
    // Clear the JWT token (assuming it's stored in a cookie named 'jwt_token')
    response.cookies.delete('jwt_token');

    // Optionally, if you store the token in localStorage, you might need to handle
    // that on the client-side after redirection.

    // Redirect to the login page
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  return response;
}

// See the Next.js middleware docs for the 'matcher' configuration:
// https://nextjs.org/docs/middleware#matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};