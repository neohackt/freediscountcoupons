import type { ParsedRow, ValidationResult, StoreData, CouponData, CategoryData, ImportError } from './types';
import { DISCOUNT_TYPES } from './types';

const STORE_REQUIRED_FIELDS = ['name'];
const COUPON_REQUIRED_FIELDS = ['title', 'code'];
const CATEGORY_REQUIRED_FIELDS = ['name'];

export function validateStoreRow(row: ParsedRow): ValidationResult {
  const errors: string[] = [];
  const data = row.data as unknown as StoreData;

  if (!data.name || String(data.name).trim() === '') {
    errors.push('name is required');
  }

  if (data.website_url && !isValidUrl(String(data.website_url))) {
    errors.push('website_url must be a valid URL');
  }

  if (data.affiliate_url && !isValidUrl(String(data.affiliate_url))) {
    errors.push('affiliate_url must be a valid URL');
  }

  if (data.logo_url && !isValidUrl(String(data.logo_url))) {
    errors.push('logo_url must be a valid URL');
  }

  if (data.is_popular !== undefined) {
    const val = String(data.is_popular).toLowerCase();
    if (val !== 'true' && val !== 'false' && val !== '1' && val !== '0') {
      errors.push('is_popular must be true/false');
    }
  }

  if (data.is_featured !== undefined) {
    const val = String(data.is_featured).toLowerCase();
    if (val !== 'true' && val !== 'false' && val !== '1' && val !== '0') {
      errors.push('is_featured must be true/false');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateCouponRow(row: ParsedRow): ValidationResult {
  const errors: string[] = [];
  const data = row.data as unknown as CouponData;

  if (!data.title || String(data.title).trim() === '') {
    errors.push('title is required');
  }

  if (!data.code || String(data.code).trim() === '') {
    errors.push('code is required');
  }

  if (data.discount_type && !DISCOUNT_TYPES.includes(data.discount_type as typeof DISCOUNT_TYPES[number])) {
    errors.push(`discount_type must be one of: ${DISCOUNT_TYPES.join(', ')}`);
  }

  if (data.discount_value && isNaN(Number(data.discount_value))) {
    errors.push('discount_value must be a number');
  }

  if (data.store_slug && typeof data.store_slug !== 'string') {
    errors.push('store_slug must be a string');
  }

  if (data.affiliate_url && !isValidUrl(String(data.affiliate_url))) {
    errors.push('affiliate_url must be a valid URL');
  }

  if (data.expires_at && !isValidDate(String(data.expires_at))) {
    errors.push('expires_at must be a valid date (YYYY-MM-DD or ISO format)');
  }

  if (data.verified !== undefined) {
    const val = String(data.verified).toLowerCase();
    if (val !== 'true' && val !== 'false' && val !== '1' && val !== '0') {
      errors.push('verified must be true/false');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateCategoryRow(row: ParsedRow): ValidationResult {
  const errors: string[] = [];
  const data = row.data as unknown as CategoryData;

  if (!data.name || String(data.name).trim() === '') {
    errors.push('name is required');
  }

  return { valid: errors.length === 0, errors };
}

export function validateStores(rows: ParsedRow[]): { valid: ParsedRow[]; invalid: ParsedRow[]; errors: ImportError[] } {
  const valid: ParsedRow[] = [];
  const invalid: ParsedRow[] = [];
  const errors: ImportError[] = [];

  for (const row of rows) {
    const result = validateStoreRow(row);
    if (result.valid) {
      valid.push(row);
    } else {
      row.errors = result.errors;
      invalid.push(row);
      for (const error of result.errors) {
        errors.push({
          row: row.row,
          field: 'general',
          message: error,
          value: row.data,
        });
      }
    }
  }

  return { valid, invalid, errors };
}

export function validateCoupons(rows: ParsedRow[]): { valid: ParsedRow[]; invalid: ParsedRow[]; errors: ImportError[] } {
  const valid: ParsedRow[] = [];
  const invalid: ParsedRow[] = [];
  const errors: ImportError[] = [];

  for (const row of rows) {
    const result = validateCouponRow(row);
    if (result.valid) {
      valid.push(row);
    } else {
      row.errors = result.errors;
      invalid.push(row);
      for (const error of result.errors) {
        errors.push({
          row: row.row,
          field: 'general',
          message: error,
          value: row.data,
        });
      }
    }
  }

  return { valid, invalid, errors };
}

export function validateCategories(rows: ParsedRow[]): { valid: ParsedRow[]; invalid: ParsedRow[]; errors: ImportError[] } {
  const valid: ParsedRow[] = [];
  const invalid: ParsedRow[] = [];
  const errors: ImportError[] = [];

  for (const row of rows) {
    const result = validateCategoryRow(row);
    if (result.valid) {
      valid.push(row);
    } else {
      row.errors = result.errors;
      invalid.push(row);
      for (const error of result.errors) {
        errors.push({
          row: row.row,
          field: 'general',
          message: error,
          value: row.data,
        });
      }
    }
  }

  return { valid, invalid, errors };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function normalizeStoreData(data: Record<string, unknown>): StoreData {
  const result: StoreData = {};

  if (data.name) result.name = String(data.name).trim();
  if (data.slug) result.slug = String(data.slug).trim();
  else if (data.name) result.slug = String(data.name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');

  if (data.description) result.description = String(data.description).trim();
  if (data.website_url) result.website_url = String(data.website_url).trim();
  if (data.affiliate_url) result.affiliate_url = String(data.affiliate_url).trim();
  if (data.logo_url) result.logo_url = String(data.logo_url).trim();

  if (data.is_popular !== undefined) {
    const val = String(data.is_popular).toLowerCase();
    result.is_popular = val === 'true' || val === '1' || val === 'yes';
  }

  if (data.is_featured !== undefined) {
    const val = String(data.is_featured).toLowerCase();
    result.is_featured = val === 'true' || val === '1' || val === 'yes';
  }

  if (data.category_names) result.category_names = String(data.category_names).trim();

  return result;
}

export function normalizeCouponData(data: Record<string, unknown>): CouponData {
  const result: CouponData = {};

  if (data.title) result.title = String(data.title).trim();
  if (data.code) result.code = String(data.code).trim().toUpperCase();
  if (data.description) result.description = String(data.description).trim();

  if (data.discount_type) {
    const dt = String(data.discount_type).toLowerCase();
    if (DISCOUNT_TYPES.includes(dt as typeof DISCOUNT_TYPES[number])) {
      result.discount_type = dt as CouponData['discount_type'];
    } else {
      result.discount_type = 'unknown';
    }
  }

  if (data.discount_value !== undefined) {
    result.discount_value = parseFloat(String(data.discount_value));
  }

  if (data.discount_text) result.discount_text = String(data.discount_text).trim();
  if (data.store_slug) result.store_slug = String(data.store_slug).trim();
  if (data.affiliate_url) result.affiliate_url = String(data.affiliate_url).trim();
  if (data.expires_at) result.expires_at = String(data.expires_at).trim();

  if (data.verified !== undefined) {
    const val = String(data.verified).toLowerCase();
    result.verified = val === 'true' || val === '1' || val === 'yes';
  }

  if (data.is_featured !== undefined) {
    const val = String(data.is_featured).toLowerCase();
    result.is_featured = val === 'true' || val === '1' || val === 'yes';
  }

  if (data.is_expired !== undefined) {
    const val = String(data.is_expired).toLowerCase();
    result.is_expired = val === 'true' || val === '1' || val === 'yes';
  }

  if (data.category_names) result.category_names = String(data.category_names).trim();

  return result;
}

export function normalizeCategoryData(data: Record<string, unknown>): CategoryData {
  const result: CategoryData = {};

  if (data.name) result.name = String(data.name).trim();
  if (data.slug) result.slug = String(data.slug).trim();
  else if (data.name) result.slug = String(data.name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');

  if (data.icon) result.icon = String(data.icon).trim();
  if (data.description) result.description = String(data.description).trim();

  return result;
}