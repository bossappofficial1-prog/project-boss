import { NextRequest, NextResponse } from 'next/server';
import { LanguageType } from './constants';

export function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;
    const validLocales: LanguageType[] = ['id', 'en'];
    const cookieLocale = request.cookies.get('locale')?.value;
    const localeFromCookie = validLocales.includes(cookieLocale as LanguageType)
        ? (cookieLocale as LanguageType)
        : 'id';
    const localeFromQuery = searchParams.get('locale');
    const fallbackLocale = validLocales.includes(localeFromQuery as LanguageType)
        ? (localeFromQuery as LanguageType)
        : localeFromCookie;

    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];

    if (validLocales.includes(firstSegment as LanguageType)) {
        const locale = firstSegment as LanguageType;
        const response = NextResponse.next();
        response.cookies.set('locale', locale, { path: '/' });
        return response;
    }

    const isPotentialLocaleSegment = typeof firstSegment === 'string' && firstSegment.length === 2;
    const normalizedPath = isPotentialLocaleSegment
        ? `/${segments.slice(1).join('/')}` || '/'
        : pathname;

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = normalizedPath === '/' ? `/${fallbackLocale}` : `/${fallbackLocale}${normalizedPath}`;
    redirectUrl.searchParams.delete('locale');

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('locale', fallbackLocale, { path: '/' });
    return response;
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
