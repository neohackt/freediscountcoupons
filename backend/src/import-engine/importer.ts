// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StrapiType = any;

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { ParsedRow, ImportError, ImportType } from './types';
import { normalizeStoreData, normalizeCouponData, normalizeCategoryData } from './validator';
import { downloadLogo, getLogoFilename } from './logoHandler';
import { parseFile } from './parsers';

interface ImportContext {
  strapi: StrapiType;
  jobId: number;
  format: string;
  type: ImportType;
  content: ArrayBuffer | string | Buffer;
  sourceUrl?: string;
}

export async function processImport(context: ImportContext): Promise<{
  imported: number;
  skipped: number;
  errors: ImportError[];
}> {
  const { strapi, jobId, format, type, content, sourceUrl } = context;

  await strapi.db.query('api::import-job.import-job').update({
    where: { id: jobId },
    data: { status: 'processing', source_url: sourceUrl || null },
  });

  let parsedRows: ParsedRow[];

  try {
    parsedRows = await parseFile(content, format as 'csv' | 'xlsx' | 'json' | 'google_sheet');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to parse file';
    await strapi.db.query('api::import-job.import-job').update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error_count: 1,
        errors: [{ row: 0, field: 'file', message: errorMsg, value: null }],
      },
    });
    throw new Error(errorMsg);
  }

  await strapi.db.query('api::import-job.import-job').update({
    where: { id: jobId },
    data: { total_rows: parsedRows.length, data: parsedRows.slice(0, 100).map(r => r.data) },
  });

  let imported = 0;
  let skipped = 0;
  const allErrors: ImportError[] = [];

  for (let i = 0; i < parsedRows.length; i++) {
    const row = parsedRows[i];

    try {
      if (type === 'stores') {
        const result = await importStoreRow(strapi, row.data);
        if (result.skipped) {
          skipped++;
        } else {
          imported++;
        }
      } else if (type === 'categories') {
        const result = await importCategoryRow(strapi, row.data);
        if (result.skipped) {
          skipped++;
        } else {
          imported++;
        }
      } else {
        const result = await importCouponRow(strapi, row.data);
        if (result.skipped) {
          skipped++;
        } else {
          imported++;
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      allErrors.push({
        row: row.row,
        field: 'import',
        message: errorMsg,
        value: row.data,
      });
      skipped++;
    }

    if ((i + 1) % 10 === 0 || i === parsedRows.length - 1) {
      await strapi.db.query('api::import-job.import-job').update({
        where: { id: jobId },
        data: {
          imported_count: imported,
          skipped_count: skipped,
          error_count: allErrors.length,
        },
      });
    }
  }

  await strapi.db.query('api::import-job.import-job').update({
    where: { id: jobId },
    data: {
      status: allErrors.length === parsedRows.length ? 'failed' : 'completed',
      imported_count: imported,
      skipped_count: skipped,
      error_count: allErrors.length,
      errors: allErrors,
    },
  });

  return { imported, skipped, errors: allErrors };
}

async function importStoreRow(
  strapi: StrapiType,
  data: Record<string, unknown>
): Promise<{ id: number; skipped: boolean }> {
  const normalized = normalizeStoreData(data);

  const existingStore = await strapi.db.query('api::store.store').findOne({
    where: { slug: normalized.slug },
  });

  if (existingStore) {
    return { id: existingStore.id, skipped: true };
  }

  let logoId = null;

  if (normalized.website_url) {
    const logoResult = await downloadLogo(normalized.website_url, normalized.logo_url);
    if (logoResult) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = getLogoFilename(normalized.website_url);
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, logoResult.buffer);

        const hash = crypto.createHash('md5').update(logoResult.buffer).digest('hex');
        const fileEntry = await strapi.db.query('plugin::upload.file').create({
          data: {
            name: filename,
            alternativeText: `${normalized.name} logo`,
            caption: `${normalized.name} logo`,
            hash,
            ext: '.webp',
            mime: logoResult.mimeType,
            size: logoResult.buffer.byteLength / 1024,
            width: null,
            height: null,
            url: `/uploads/${filename}`,
            previewUrl: null,
            provider: 'local',
            provider_metadata: null,
          },
        });
        logoId = fileEntry.id;
      } catch (e) {
        console.error('Failed to upload logo:', e);
      }
    }
  }

  const createData: Record<string, unknown> = {
    name: normalized.name,
    slug: normalized.slug || normalized.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').replace(/^-|-$/g, ''),
    description: normalized.description || '',
    website_url: normalized.website_url || '',
    affiliate_url: normalized.affiliate_url || '',
    is_popular: normalized.is_popular || false,
    is_featured: normalized.is_featured || false,
  };

  if (logoId) {
    createData.logo = logoId;
  }

  const created = await strapi.entityService.create('api::store.store', {
    data: createData,
  });

  // Publish the entry so it appears in the admin panel
  try {
    const entry = await strapi.db.query('api::store.store').findOne({
      where: { id: created.id },
    });
    if (entry?.documentId) {
      await strapi.documents('api::store.store').publish({
        documentId: entry.documentId,
      });
    }
  } catch (e) {
    console.error('Failed to publish store:', e);
  }

  return { id: created.id, skipped: false };
}

async function importCouponRow(
  strapi: StrapiType,
  data: Record<string, unknown>
): Promise<{ id: number; skipped: boolean }> {
  const normalized = normalizeCouponData(data);

  let storeId = null;

  if (normalized.store_slug) {
    const store = await strapi.db.query('api::store.store').findOne({
      where: { slug: normalized.store_slug },
    });
    storeId = store?.id || null;
  }

  if (!storeId) {
    throw new Error(`Store not found: ${normalized.store_slug}`);
  }

  const existingCoupon = await strapi.db.query('api::coupon.coupon').findOne({
    where: {
      code: normalized.code,
      store: storeId,
    },
  });

  if (existingCoupon) {
    return { id: existingCoupon.id, skipped: true };
  }

  const createData: Record<string, unknown> = {
    title: normalized.title,
    code: normalized.code,
    description: normalized.description || '',
    discount_type: normalized.discount_type || 'unknown',
    discount_value: normalized.discount_value || null,
    discount_text: normalized.discount_text || '',
    affiliate_url: normalized.affiliate_url || '',
    verified: normalized.verified || false,
    verified_at: normalized.verified ? new Date().toISOString() : null,
    expires_at: normalized.expires_at || null,
    is_featured: normalized.is_featured || false,
    is_expired: normalized.is_expired || false,
    success_rate: 0,
    times_used: 0,
    store: storeId,
  };

  const created = await strapi.entityService.create('api::coupon.coupon', {
    data: createData,
  });

  // Publish the entry so it appears in the admin panel
  try {
    const entry = await strapi.db.query('api::coupon.coupon').findOne({
      where: { id: created.id },
    });
    if (entry?.documentId) {
      await strapi.documents('api::coupon.coupon').publish({
        documentId: entry.documentId,
      });
    }
  } catch (e) {
    console.error('Failed to publish coupon:', e);
  }

  return { id: created.id, skipped: false };
}

async function importCategoryRow(
  strapi: StrapiType,
  data: Record<string, unknown>
): Promise<{ id: number; skipped: boolean }> {
  const normalized = normalizeCategoryData(data);

  const existingCategory = await strapi.db.query('api::category.category').findOne({
    where: { slug: normalized.slug },
  });

  if (existingCategory) {
    return { id: existingCategory.id, skipped: true };
  }

  const createData: Record<string, unknown> = {
    name: normalized.name,
    slug: normalized.slug || normalized.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').replace(/^-|-$/g, ''),
    icon: normalized.icon || '',
    description: normalized.description || '',
  };

  const created = await strapi.entityService.create('api::category.category', {
    data: createData,
  });

  // Publish the entry so it appears in the admin panel
  try {
    const entry = await strapi.db.query('api::category.category').findOne({
      where: { id: created.id },
    });
    if (entry?.documentId) {
      await strapi.documents('api::category.category').publish({
        documentId: entry.documentId,
      });
    }
  } catch (e) {
    console.error('Failed to publish category:', e);
  }

  return { id: created.id, skipped: false };
}

export async function deleteExpiredCoupons(strapi: StrapiType): Promise<number> {
  const now = new Date().toISOString();

  const result = await strapi.db.query('api::coupon.coupon').updateMany({
    where: {
      $and: [
        { expires_at: { $notNull: true } },
        { expires_at: { $lt: now } },
      ],
    },
    data: {
      is_expired: true,
    },
  });

  return result.count || 0;
}

export async function cleanupOldExpiredCoupons(strapi: StrapiType, daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoff = cutoffDate.toISOString();

  const result = await strapi.db.query('api::coupon.coupon').deleteMany({
    where: {
      $and: [
        { is_expired: true },
        { expires_at: { $notNull: true } },
        { expires_at: { $lt: cutoff } },
      ],
    },
  });

  return result.count || 0;
}