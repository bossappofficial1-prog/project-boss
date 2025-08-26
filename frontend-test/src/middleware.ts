import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;
    const storedLocale = request.cookies.get(`locale`)?.value || `id`

    // If no locale parameter exists, add it
    if (!searchParams.has('locale') || !searchParams.get('locale')) {
        const url = request.nextUrl.clone();
        url.searchParams.set('locale', storedLocale);
        return NextResponse.redirect(url);
    }

    // Continue with the request
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
