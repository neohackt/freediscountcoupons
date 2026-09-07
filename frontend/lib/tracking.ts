'use client';

const GCLID_COOKIE = 'fdc_gclid';
const KEYWORD_COOKIE = 'fdc_keyword';
const COOKIE_EXPIRY_DAYS = 90;

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function getCookieOptions(): { expires: Date; path: string; sameSite: 'Lax'; secure: boolean } {
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_EXPIRY_DAYS);
  
  return {
    expires,
    path: '/',
    sameSite: 'Lax' as const,
    secure: isProduction(),
  };
}

function setCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  
  const options = getCookieOptions();
  const cookieString = `${name}=${encodeURIComponent(value)}; expires=${options.expires.toUTCString()}; path=${options.path}; SameSite=${options.sameSite}${options.secure ? '; Secure' : ''}`;
  
  document.cookie = cookieString;
}

function getCookie(cookieName: string): string {
  if (typeof document === 'undefined') return '';
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split('=');
    if (name === cookieName) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return '';
}

export function getUrlParams(searchParams: URLSearchParams): { gclid: string; keyword: string } {
  return {
    gclid: searchParams.get('gclid') || '',
    keyword: searchParams.get('keyword') || '',
  };
}

export function getStoredTracking(): { gclid: string; keyword: string } {
  if (typeof document === 'undefined') return { gclid: '', keyword: '' };
  
  return {
    gclid: getCookie(GCLID_COOKIE) || '',
    keyword: getCookie(KEYWORD_COOKIE) || '',
  };
}

export function getTrackingValues(searchParams?: URLSearchParams): { gclid: string; keyword: string } {
  const stored = getStoredTracking();
  
  if (!searchParams) {
    return stored;
  }
  
  const urlParams = getUrlParams(searchParams);
  
  // Use URL params if present, otherwise fall back to stored values
  const gclid = urlParams.gclid || stored.gclid;
  const keyword = urlParams.keyword || stored.keyword;
  
  return { gclid, keyword };
}

export function initializeTracking(searchParams?: URLSearchParams): void {
  if (typeof window === 'undefined') return;
  
  if (!searchParams) {
    // Try to get searchParams from current URL
    try {
      searchParams = new URLSearchParams(window.location.search);
    } catch {
      return;
    }
  }
  
  const urlParams = getUrlParams(searchParams);
  
  // Update cookies if URL has explicit tracking params
  if (urlParams.gclid) {
    setCookie(GCLID_COOKIE, urlParams.gclid);
  }
  if (urlParams.keyword) {
    setCookie(KEYWORD_COOKIE, urlParams.keyword);
  }
}

export function applyTrackingToUrl(url: string, gclid: string, keyword: string): string {
  let result = url;
  
  if (gclid) {
    result = result.replaceAll('{gclid}', encodeURIComponent(gclid));
  }
  if (keyword) {
    result = result.replaceAll('{keyword}', encodeURIComponent(keyword));
  }
  
  return result;
}

export function getTrackedWebsiteUrl(
  affiliateUrl: string | null | undefined,
  websiteUrl: string | null | undefined,
  gclid: string,
  keyword: string
): string {
  const baseUrl = affiliateUrl || websiteUrl || '#';
  return applyTrackingToUrl(baseUrl, gclid, keyword);
}

export function getTrackedCouponLink(
  couponAffiliateUrl: string | null | undefined,
  websiteUrl: string,
  gclid: string,
  keyword: string
): string {
  const baseUrl = couponAffiliateUrl || websiteUrl || '#';
  return applyTrackingToUrl(baseUrl, gclid, keyword);
}