export type ImportFormat = 'csv' | 'xlsx' | 'json' | 'google_sheet';
export type ImportType = 'stores' | 'coupons' | 'categories';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ParsedRow {
  row: number;
  data: Record<string, unknown>;
  errors: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: unknown;
}

export interface StoreData {
  name?: string;
  slug?: string;
  description?: string;
  website_url?: string;
  affiliate_url?: string;
  logo_url?: string;
  country?: string;
  currency?: string;
  is_popular?: boolean;
  is_featured?: boolean;
  category_names?: string;
}

export interface CouponData {
  title?: string;
  code?: string;
  description?: string;
  discount_type?: 'percentage' | 'fixed' | 'free_shipping' | 'bogo' | 'unknown';
  discount_value?: number;
  currency?: string;
  discount_text?: string;
  store_slug?: string;
  affiliate_url?: string;
  expires_at?: string;
  verified?: boolean;
  is_featured?: boolean;
  is_expired?: boolean;
  category_names?: string;
}

export interface CategoryData {
  name?: string;
  slug?: string;
  icon?: string;
  description?: string;
}

export interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
}

export interface ImportJobData {
  id?: number;
  filename?: string;
  format?: ImportFormat;
  type: ImportType;
  status: ImportStatus;
  total_rows?: number;
  imported_count?: number;
  skipped_count?: number;
  error_count?: number;
  data?: Record<string, unknown>[];
  errors?: ImportError[];
  schedule?: string;
  source_url?: string;
  is_auto_sync?: boolean;
}

export interface LogoResult {
  buffer: Buffer;
  mimeType: string;
  originalFormat: string;
}

export const DISCOUNT_TYPES = ['percentage', 'fixed', 'free_shipping', 'bogo', 'unknown'] as const;
export const CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'AED', 'AUD', 'CAD', 'SGD', 'JPY', 'CNY'
] as const;

export type CurrencyCode = typeof CURRENCIES[number];

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

export const GOOGLE_FAVICON_BASE = 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE&url=';