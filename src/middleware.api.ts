import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAuthEdgeServer } from '@/auth/edge';

import { defaultCookieOptions } from './hooks/useCookiesWithOptions';

const authEdgeServer = getAuthEdgeServer();

export const middleware = async (request: NextRequest) => {
  if (request.nextUrl.pathname.startsWith('/login')) {
    const referer = request.cookies.get('auth0.redirect_uri');

    if (!referer) {
      return;
    }

    try {
      const response = NextResponse.redirect(referer);
      const { accessToken, idToken } = await authEdgeServer.getSession(
        request,
        response,
      );
      response.cookies.set('token', accessToken, defaultCookieOptions);
      response.cookies.set('idToken', idToken, defaultCookieOptions);
      response.cookies.set('auth0.redirect_uri', '', { maxAge: 0 });
      return response;
    } catch (err) {
      const response = NextResponse.next();
      response.cookies.set('auth0.redirect_uri', '', { maxAge: 0 });
      return response;
    }
  }

  if (request.nextUrl.pathname.startsWith('/event')) {
    const shouldHideBetaVersion =
      process.env.NEXT_PUBLIC_SHOULD_SHOW_BETA_VERSION !== 'true';

    const hasSeenConversionPage =
      request.cookies.get('has_seen_beta_conversion_page') === 'true';

    if (shouldHideBetaVersion || hasSeenConversionPage) return;

    const url = new URL('/beta-version', request.url);
    return NextResponse.redirect(url);
  }

  const isOwnershipPage =
    request.nextUrl.pathname.split('/').at(-1) === 'ownership';

  if (isOwnershipPage && !process.env.NEXT_PUBLIC_CLAIM_OWNERSHIP_ENABLED) {
    const url = new URL('/organizers/:id/ownership', request.url);
    return NextResponse.redirect(url);
  }
};

export const config = {
  matcher: ['/event', '/login', '/organizers/:id/ownership'],
};
