import { NextRequest, NextResponse } from 'next/server';
import { LanguageType } from './constants';

export function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;
    const storedLocale = (request.cookies.get(`locale`)?.value || `id`) as LanguageType

    // If no locale parameter exists, add it
    if (!searchParams.has('locale') || !searchParams.get('locale')) {
        const url = request.nextUrl.clone();
        url.searchParams.set('locale', storedLocale);
        return NextResponse.redirect(url);
    }

    // Check if the locale parameter is valid
    const currentLocale = searchParams.get('locale') as string;
    const validLocales: LanguageType[] = ['id', 'en'];

    if (!validLocales.includes(currentLocale as LanguageType)) {
        const url = request.nextUrl.clone();
        url.searchParams.set('locale', 'id');
        return NextResponse.redirect(url);
    }

    // Continue with the request
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
