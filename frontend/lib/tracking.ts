'use client';

const GCLID_COOKIE = 'fdc_gclid';
const KEYWORD_COOKIE = 'fdc_keyword';
const SRC_COOKIE = 'fdc_src';
const CAMP_COOKIE = 'fdc_camp';
const ACC_COOKIE = 'fdc_acc';
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

export interface TrackingValues {
  gclid: string;
  keyword: string;
  src: string;
  camp: string;
  acc: string;
}

export function getUrlParams(searchParams: URLSearchParams): TrackingValues {
  // Unified click ID: Google `gclid` takes precedence; Microsoft `msclkid`
  // fills the same field (and downstream `aff_sub1` slot) when `gclid` is absent.
  return {
    gclid: searchParams.get('gclid') || searchParams.get('msclkid') || '',
    keyword: searchParams.get('keyword') || '',
    src: searchParams.get('src') || '',
    camp: searchParams.get('camp') || '',
    acc: searchParams.get('acc') || '',
  };
}

export function getStoredTracking(): TrackingValues {
  if (typeof document === 'undefined') return { gclid: '', keyword: '', src: '', camp: '', acc: '' };
  
  return {
    gclid: getCookie(GCLID_COOKIE) || '',
    keyword: getCookie(KEYWORD_COOKIE) || '',
    src: getCookie(SRC_COOKIE) || '',
    camp: getCookie(CAMP_COOKIE) || '',
    acc: getCookie(ACC_COOKIE) || '',
  };
}

export function getTrackingValues(searchParams?: URLSearchParams): TrackingValues {
  const stored = getStoredTracking();
  
  if (!searchParams) {
    return stored;
  }
  
  const urlParams = getUrlParams(searchParams);
  
  // Use URL params if present, otherwise fall back to stored values
  const gclid = urlParams.gclid || stored.gclid;
  const keyword = urlParams.keyword || stored.keyword;
  const src = urlParams.src || stored.src;
  const camp = urlParams.camp || stored.camp;
  const acc = urlParams.acc || stored.acc;
  
  return { gclid, keyword, src, camp, acc };
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
  if (urlParams.src) {
    setCookie(SRC_COOKIE, urlParams.src);
  }
  if (urlParams.camp) {
    setCookie(CAMP_COOKIE, urlParams.camp);
  }
  if (urlParams.acc) {
    setCookie(ACC_COOKIE, urlParams.acc);
  }
}

export function applyTrackingToUrl(
  url: string,
  gclid: string,
  keyword: string,
  src?: string,
  camp?: string,
  acc?: string
): string {
  let result = url;
  
  if (gclid) {
    result = result.replaceAll('{gclid}', encodeURIComponent(gclid));
  }
  if (keyword) {
    result = result.replaceAll('{keyword}', encodeURIComponent(keyword));
  }
  // For src/camp/acc: substitute if present, otherwise remove the macro cleanly
  // so literal {src}, {camp}, {acc} are never sent to Offer18.
  if (src) {
    result = result.replaceAll('{src}', encodeURIComponent(src));
  } else {
    result = result.replaceAll('{src}', '');
  }
  if (camp) {
    result = result.replaceAll('{camp}', encodeURIComponent(camp));
  } else {
    result = result.replaceAll('{camp}', '');
  }
  if (acc) {
    result = result.replaceAll('{acc}', encodeURIComponent(acc));
  } else {
    result = result.replaceAll('{acc}', '');
  }
  
  return result;
}

export function getTrackedWebsiteUrl(
  affiliateUrl: string | null | undefined,
  websiteUrl: string | null | undefined,
  gclid: string,
  keyword: string,
  src?: string,
  camp?: string,
  acc?: string
): string {
  const baseUrl = affiliateUrl || websiteUrl || '#';
  return applyTrackingToUrl(baseUrl, gclid, keyword, src, camp, acc);
}

export function getTrackedCouponLink(
  couponAffiliateUrl: string | null | undefined,
  websiteUrl: string,
  gclid: string,
  keyword: string,
  src?: string,
  camp?: string,
  acc?: string
): string {
  const baseUrl = couponAffiliateUrl || websiteUrl || '#';
  return applyTrackingToUrl(baseUrl, gclid, keyword, src, camp, acc);
}
