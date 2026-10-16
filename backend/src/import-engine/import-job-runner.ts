// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StrapiType = any;

import fs from 'fs';
import crypto from 'crypto';
import { processImport } from './importer';
import type { ImportFormat, ImportType } from './types';

export interface UploadedFileContent {
  filename: string;
  content: Buffer;
}

/**
 * Read raw bytes from a Strapi/koa-body uploaded file object.
 * Same 4-method fallback previously inline in the import-job controller.
 */
export async function extractUploadContent(
  fileObj: Record<string, unknown>
): Promise<UploadedFileContent> {
  const fname =
    (fileObj?.newFilename as string) || (fileObj?.filename as string) || 'import.csv';
  let contentBuffer: Buffer | null = null;

  // Method 1: data property (most reliable for fresh uploads)
  if (fileObj?.data) {
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

  // Method 2: stream (pipe readable stream)
  if (!contentBuffer && fileObj?.stream) {
    const chunks: Buffer[] = [];
    const stream = fileObj.stream as NodeJS.ReadableStream;
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
    contentBuffer = Buffer.concat(chunks);
    console.log('Read file from stream');
  }

  // Method 3: toBuffer function
  if (!contentBuffer && typeof fileObj?.toBuffer === 'function') {
    contentBuffer = (fileObj.toBuffer as () => Buffer)();
    console.log('Read file from toBuffer');
  }

  // Method 4: filepath (Strapi v5 default - may be cached)
  const filepath = fileObj?.filepath as string;
  if (!contentBuffer && filepath && fs.existsSync(filepath)) {
    contentBuffer = fs.readFileSync(filepath);
    console.log('Read file from filepath:', filepath);
  }

  // Log content hash for debugging
  if (contentBuffer) {
    const hash = crypto.createHash('md5').update(contentBuffer).digest('hex');
    const preview = contentBuffer.toString().slice(0, 200);
    console.log('File content hash:', hash);
    console.log('File content preview:', preview);
  }

  return { filename: fname, content: contentBuffer || Buffer.from('') };
}

export interface RunImportJobParams {
  strapi: StrapiType;
  type: ImportType;
  filename?: string;
  format: ImportFormat;
  content?: Buffer | string;
  sourceUrl?: string;
  schedule?: string;
}

/**
 * Shared import orchestration: create the ImportJob record, run the engine
 * synchronously, then return the refreshed job. Used by both the public
 * import API controller and the csv-import admin plugin controller so the
 * two entry points cannot drift apart.
 */
export async function runImportJob(params: RunImportJobParams) {
  const { strapi, type, filename, format, content, sourceUrl, schedule } = params;

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
      source_url: sourceUrl || null,
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
      await processImport({
        strapi,
        jobId: job.id,
        format,
        type,
        content: content instanceof Buffer ? content : content || '',
        sourceUrl,
      });
    } catch (error) {
      console.error('Import processing failed:', error);
    }
    // Refresh job data after import, including the failure path: processImport
    // records parse failures on the job before re-throwing, and the caller
    // must see the final state (failed + errors), not the initial pending row.
    job = await strapi.db.query('api::import-job.import-job').findOne({
      where: { id: job.id },
    });
  }

  return job;
}
