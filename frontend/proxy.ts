import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Only run on /store/:slug paths
export const config = {
  matcher: ['/store/:slug*'],
};

// Validate destination is a safe local path
function isSafeLocalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('://');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle /store/:slug (not /store or /store/ with trailing)
  const match = pathname.match(/^\/store\/([^/]+)$/);
  if (!match) return NextResponse.next();

  const slug = match[1];

  try {
    // Query Strapi for redirect records (short-lived cache via fetch)
    const url = `${STRAPI_URL}/api/store-redirects?filters[source_slug][$eq]=${encodeURIComponent(slug)}&filters[is_active][$eq]=true&pagination[pageSize]=1`;
    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      // Don't cache missing redirects indefinitely — pass through
      return NextResponse.next();
    }

    const data = await response.json();
    const redirect = data?.data?.[0];

    if (redirect) {
      const destination = redirect.destination_path || '/';
      const statusCode = redirect.status_code || 301;

      if (isSafeLocalPath(destination)) {
        const redirectUrl = new URL(destination, request.url);
        return NextResponse.redirect(redirectUrl, statusCode);
      }
    }
  } catch (err) {
    // On error, pass through to the page (which will handle 404)
    console.error('[Proxy] Redirect lookup failed:', err);
  }

  return NextResponse.next();
}