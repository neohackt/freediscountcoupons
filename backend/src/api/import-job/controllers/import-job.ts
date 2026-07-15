import { factories } from '@strapi/strapi';
import { processImport, deleteExpiredCoupons, cleanupOldExpiredCoupons } from '../../../import-engine/importer';
import { isGoogleSheetUrl, convertGoogleSheetUrl } from '../../../import-engine/parsers';
import type { ImportFormat, ImportType } from '../../../import-engine/types';

export default factories.createCoreController('api::import-job.import-job', ({ strapi }) => ({
  async uploadAndImport(ctx) {
    const files = ctx.request.files as Record<string, unknown> | undefined;
    const formData = ctx.request.body as Record<string, unknown> | undefined;
    const type = formData?.type as ImportType | undefined;
    const sourceUrl = formData?.sourceUrl as string | undefined;
    const schedule = formData?.schedule as string | undefined;

    if (!files?.file && !sourceUrl) {
      return ctx.badRequest('Either file or sourceUrl is required');
    }

    if (!type || !['stores', 'coupons', 'categories'].includes(type)) {
      return ctx.badRequest('type must be "stores", "coupons", or "categories"');
    }

    let filename: string | undefined;
    let format: ImportFormat = 'csv';
    let content: Buffer | string | undefined;
    let actualSourceUrl: string | undefined;

    if (files?.file) {
      const fileObj = files.file as Record<string, unknown>;
      const fname = fileObj?.newFilename as string || fileObj?.filename as string || 'import.csv';
      filename = fname;
      format = getFormatFromFilename(fname);

      // Strapi v5 file upload structure - try multiple approaches
      const fs = require('fs');
      let contentBuffer: Buffer | null = null;

      // Method 1: filepath (Strapi v5 default)
      const filepath = fileObj?.filepath as string;
      if (filepath && fs.existsSync(filepath)) {
        contentBuffer = fs.readFileSync(filepath);
        console.log('Read file from filepath:', filepath);
      }

      // Method 2: toBuffer function
      if (!contentBuffer && typeof fileObj?.toBuffer === 'function') {
        contentBuffer = fileObj.toBuffer() as Buffer;
        console.log('Read file from toBuffer');
      }

      // Method 3: data property
      if (!contentBuffer && fileObj?.data) {
        const fileData = fileObj.data;
        if (Buffer.isBuffer(fileData)) {
          contentBuffer = fileData;
        } else if (typeof fileData === 'string') {
          contentBuffer = Buffer.from(fileData);
        } else if (fileData instanceof ArrayBuffer) {
          contentBuffer = Buffer.from(fileData);
        }
        console.log('Read file from data, type:', typeof fileData);
      }

      // Method 4: stream (pipe readable stream)
      if (!contentBuffer && fileObj?.stream) {
        const chunks: Buffer[] = [];
        const stream = fileObj.stream as NodeJS.ReadableStream;
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
        }
        contentBuffer = Buffer.concat(chunks);
        console.log('Read file from stream');
      }

      content = contentBuffer || Buffer.from('');
      console.log('Final content length:', content.toString().length);
    } else if (sourceUrl) {
      if (isGoogleSheetUrl(sourceUrl)) {
        format = 'google_sheet';
        actualSourceUrl = convertGoogleSheetUrl(sourceUrl);
        content = actualSourceUrl;
        filename = 'google-sheet-import';
      } else {
        return ctx.badRequest('Invalid source URL. Use Google Sheets URL for now.');
      }
    }

    let job = await strapi.db.query('api::import-job.import-job').create({
      data: {
        filename: filename || null,
        format,
        type,
        status: 'pending',
        total_rows: 0,
        imported_count: 0,
        skipped_count: 0,
        error_count: 0,
        data: [],
        errors: [],
        source_url: actualSourceUrl || null,
        schedule: schedule || null,
        is_auto_sync: !!schedule,
      },
    });

    // Process synchronously instead of setImmediate
    const contentLength = content ? content.toString().length : 0;
    console.log('Content length to process:', contentLength);
    if (content && contentLength > 0) {
      console.log('Starting import process...');
      try {
        const result = await processImport({
          strapi,
          jobId: job.id,
          format,
          type,
          content: content instanceof Buffer ? content : content || '',
          sourceUrl: actualSourceUrl,
        });
        // Refresh job data after import
        job = await strapi.db.query('api::import-job.import-job').findOne({
          where: { id: job.id },
        });
      } catch (error) {
        console.error('Import processing failed:', error);
      }
    }

    const sanitized = await this.sanitizeOutput(job, ctx);
    return this.transformResponse(sanitized);
  },

  async getJobs(ctx) {
    const type = ctx.query?.type as string | undefined;
    const status = ctx.query?.status as string | undefined;
    const page = (ctx.query?.page as string) || '1';
    const pageSize = (ctx.query?.pageSize as string) || '25';

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

    const jobs = await strapi.db.query('api::import-job.import-job').findMany({
      where,
      limit: pageSizeNum,
      offset: (pageNum - 1) * pageSizeNum,
    });

    const total = await strapi.db.query('api::import-job.import-job').count({ where });

    return this.transformResponse({
      data: jobs,
      meta: {
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          pageCount: Math.ceil(total / pageSizeNum),
          total,
        },
      },
    });
  },

  async findOne(ctx) {
    const { id } = ctx.params;

    const job = await strapi.db.query('api::import-job.import-job').findOne({
      where: { id: parseInt(id as string) },
    });

    if (!job) {
      return ctx.notFound('Import job not found');
    }

    const sanitized = await this.sanitizeOutput(job, ctx);
    return this.transformResponse(sanitized);
  },

  async retryJob(ctx) {
    const { id } = ctx.params;

    const job = await strapi.db.query('api::import-job.import-job').findOne({
      where: { id: parseInt(id as string) },
    });

    if (!job) {
      return ctx.notFound('Import job not found');
    }

    if (job.status === 'processing') {
      return ctx.badRequest('Job is already processing');
    }

    await strapi.db.query('api::import-job.import-job').update({
      where: { id: job.id },
      data: {
        status: 'pending',
        imported_count: 0,
        skipped_count: 0,
        error_count: 0,
        errors: [],
      },
    });

    if (job.source_url || job.filename) {
      setImmediate(async () => {
        try {
          const importContent = job.source_url || job.filename!;
          await processImport({
            strapi,
            jobId: job.id,
            format: job.format,
            type: job.type,
            content: importContent,
            sourceUrl: job.source_url || undefined,
          });
        } catch (error) {
          console.error('Retry import failed:', error);
        }
      });
    }

    const updatedJob = await strapi.db.query('api::import-job.import-job').findOne({
      where: { id: job.id },
    });

    const sanitized = await this.sanitizeOutput(updatedJob, ctx);
    return this.transformResponse(sanitized);
  },

  async cleanupExpired(ctx) {
    const deleteFlag = (ctx.query?.delete as string) || 'false';
    const daysOld = parseInt((ctx.query?.daysOld as string) || '90');

    const marked = await deleteExpiredCoupons(strapi);

    let deleted = 0;
    if (deleteFlag === 'true') {
      deleted = await cleanupOldExpiredCoupons(strapi, daysOld);
    }

    return this.transformResponse({
      marked_as_expired: marked,
      deleted,
    });
  },

  async getStats(ctx) {
    const totalStores = await strapi.db.query('api::store.store').count();
    const totalCoupons = await strapi.db.query('api::coupon.coupon').count();
    const totalCategories = await strapi.db.query('api::category.category').count();
    const expiredCoupons = await strapi.db.query('api::coupon.coupon').count({
      where: { is_expired: true },
    });
    const verifiedCoupons = await strapi.db.query('api::coupon.coupon').count({
      where: { verified: true },
    });

    return this.transformResponse({
      total_stores: totalStores,
      total_coupons: totalCoupons,
      total_categories: totalCategories,
      expired_coupons: expiredCoupons,
      verified_coupons: verifiedCoupons,
    });
  },

  async linkCouponsToStores(ctx) {
    const stores = await strapi.db.query('api::store.store').findMany({});
    const storeMap = new Map(stores.map((s: { id: number; slug: string }) => [s.slug, s.id]));
    console.log('Store map:', Object.fromEntries(storeMap));

    const coupons = await strapi.db.query('api::coupon.coupon').findMany({});
    const jobs = await strapi.db.query('api::import-job.import-job').findMany({
      where: { type: 'coupons' },
    });
    const couponJob = jobs.find((j: { data: unknown[] }) => j.data?.length > 0);
    const couponDataMap = new Map(
      (couponJob?.data || []).map((d: { code: string; store_slug: string }) => [d.code, d.store_slug as string])
    );
    console.log('Found coupon data entries:', couponJob?.data?.length || 0);

    let linked = 0;
    for (const coupon of coupons) {
      const couponCode = coupon.code as string;
      const storeSlug = couponDataMap.get(couponCode);
      if (storeSlug) {
        const storeId = storeMap.get(storeSlug as string);
        if (storeId) {
          await strapi.db.query('api::coupon.coupon').update({
            where: { id: coupon.id },
            data: { store: storeId },
          });
          linked++;
        }
      }
    }

    return this.transformResponse({ linked });
  },
}));

function getFormatFromFilename(filename: string): ImportFormat {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'csv':
      return 'csv';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    case 'json':
      return 'json';
    default:
      return 'csv';
  }
}