import { BRAND_CONFIG } from './constants';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}wk ago`;
  return formatDate(date);
}

export function formatDiscountText(coupon: { discount_type: string; discount_value?: number; discount_text?: string }): string {
  if (coupon.discount_text) return coupon.discount_text;

  switch (coupon.discount_type) {
    case 'percentage':
      return `${coupon.discount_value}% Off`;
    case 'fixed':
      return `$${coupon.discount_value} Off`;
    case 'free_shipping':
      return 'Free Shipping';
    case 'bogo':
      return 'Buy 1 Get 1';
    default:
      return 'Deal';
  }
}

export function getExpiryStatus(expiresAt?: string): { isExpiringSoon: boolean; daysLeft: number } {
  if (!expiresAt) return { isExpiringSoon: false, daysLeft: Infinity };

  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    isExpiringSoon: diffDays <= 7 && diffDays > 0,
    daysLeft: diffDays,
  };
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function getStoreLogoUrl(
  store: { logo?: { url: string } | null; website_url?: string; name?: string }, 
  defaultSize = 80
): string {
  if (store.logo?.url) return store.logo.url;
  
  if (store.website_url) {
    const domain = store.website_url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .toLowerCase();
    return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE&size=${defaultSize}&url=http://${domain}`;
  }
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name || 'Store')}&size=${defaultSize}&background=${BRAND_CONFIG.colors.primary[600].slice(1)}&color=fff`;
}

export function maskCouponCode(code: string): string {
  if (code.length <= 4) return '****';
  const visibleChars = Math.ceil(code.length / 2);
  const maskedChars = code.length - visibleChars;
  return code.slice(0, visibleChars) + '*'.repeat(maskedChars);
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

export function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}