// ISO 4217 supported currencies
export const SUPPORTED_CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'AED', 'AUD', 'CAD', 'SGD', 'JPY', 'CNY'
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number];

// ISO 3166-1 alpha-2 country → ISO 4217 currency mapping
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  AE: 'AED',
  AU: 'AUD',
  CA: 'CAD',
  SG: 'SGD',
  JP: 'JPY',
  CN: 'CNY',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
};

// Locale for each currency (for Intl.NumberFormat)
const CURRENCY_LOCALE_MAP: Record<string, string> = {
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AED: 'ar-AE',
  AUD: 'en-AU',
  CAD: 'en-CA',
  SGD: 'en-SG',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
};

/**
 * Resolve effective currency for a coupon
 * Priority: coupon.currency → store.currency → store.country → null
 * Returns null if currency cannot be determined (NEVER defaults to USD)
 */
export function resolveCouponCurrency(
  coupon: { currency?: string | null },
  store?: { currency?: string | null; country?: string | null } | null
): string | null {
  // 1. Coupon-level override
  if (coupon.currency) {
    const normalized = coupon.currency.trim().toUpperCase();
    if ((SUPPORTED_CURRENCIES as readonly string[]).includes(normalized)) {
      return normalized;
    }
  }

  // 2. Store currency
  if (store?.currency) {
    const normalized = store.currency.trim().toUpperCase();
    if ((SUPPORTED_CURRENCIES as readonly string[]).includes(normalized)) {
      return normalized;
    }
  }

  // 3. Store country → currency mapping
  if (store?.country) {
    const countryCode = store.country.trim().toUpperCase();
    const mapped = COUNTRY_CURRENCY_MAP[countryCode];
    if (mapped) return mapped;
  }

  // 4. Cannot determine - return null (NOT USD)
  return null;
}

/**
 * Format currency value using Intl.NumberFormat
 * Uses locale-aware formatting with no manual symbol maintenance
 */
export function formatCurrency(value: number, currency: string): string {
  const locale = CURRENCY_LOCALE_MAP[currency] || 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Centralized discount formatting
 * Determines effective currency and formats based on discount_type
 *
 * FIXED: 2000 + INR → ₹2,000 OFF
 * PERCENTAGE: 20 → 20% OFF
 * CASHBACK: 1500 + INR → ₹1,500 Cashback
 * FREE_SHIPPING: → Free Shipping
 * BOGO: → Buy 1 Get 1
 * UNKNOWN/DEAL: → Deal
 */
export function formatDiscount(coupon: {
  discount_type: string;
  discount_value?: number | null;
  discount_text?: string | null;
  currency?: string | null;
}, store?: { currency?: string | null; country?: string | null } | null): string {
  // Custom discount text takes priority
  if (coupon.discount_text) return coupon.discount_text;

  const value = coupon.discount_value || 0;

  switch (coupon.discount_type) {
    case 'percentage':
      return `${value}% OFF`;

    case 'fixed': {
      const currency = resolveCouponCurrency(coupon, store);
      return currency
        ? `${formatCurrency(value, currency)} OFF`
        : `${value} OFF`;
    }

    case 'cashback': {
      const currency = resolveCouponCurrency(coupon, store);
      return currency
        ? `${formatCurrency(value, currency)} Cashback`
        : `${value} Cashback`;
    }

    case 'free_shipping':
      return 'Free Shipping';

    case 'bogo':
      return 'Buy 1 Get 1';

    case 'unknown':
    default:
      return 'Deal';
  }
}
