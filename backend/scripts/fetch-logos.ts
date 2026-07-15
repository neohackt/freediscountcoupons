/**
 * One-time script to fetch logos for existing stores that don't have one.
 *
 * Usage:
 *   cd backend && npx tsx scripts/fetch-logos.ts
 */

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { downloadLogo, getLogoFilename } from '../src/import-engine/logoHandler';

const UPLOADS_DIR = path.resolve(__dirname, '..', 'public', 'uploads');

async function main() {
  console.log('🚀 Bootstrapping Strapi...\n');

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const strapiFactory = require('@strapi/strapi');
  const app = strapiFactory.createStrapi({
    dir: path.resolve(__dirname, '..'),
    distDir: path.resolve(__dirname, '..', 'dist'),
  });

  await app.start();

  try {
    const stores = await app.db.query('api::store.store').findMany({
      populate: ['logo'],
      orderBy: { name: 'asc' },
    });

    console.log(`📦 Found ${stores.length} stores\n`);

    let fetched = 0;
    let skipped = 0;
    let failed = 0;

    for (const store of stores) {
      const hasLogo = store.logo && (store.logo.id || store.logo.documentId);
      if (hasLogo) {
        console.log(`⏭️  ${store.name} — already has logo, skipping`);
        skipped++;
        continue;
      }

      if (!store.website_url) {
        console.log(`⚠️  ${store.name} — no website_url, skipping`);
        skipped++;
        continue;
      }

      process.stdout.write(`🔄 ${store.name} — fetching logo...`);

      try {
        const logoResult = await downloadLogo(store.website_url);
        if (!logoResult) {
          console.log(` ❌ no logo found`);
          failed++;
          continue;
        }

        // Generate filename and write to uploads directory
        const filename = getLogoFilename(store.website_url);
        const filepath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filepath, logoResult.buffer);

        // Create the file entry in Strapi's file table
        const hash = crypto.createHash('md5').update(logoResult.buffer).digest('hex');
        const fileEntry = await app.db.query('plugin::upload.file').create({
          data: {
            name: filename,
            alternativeText: `${store.name} logo`,
            caption: `${store.name} logo`,
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

        // Associate logo with store
        await app.db.query('api::store.store').update({
          where: { id: store.id },
          data: { logo: fileEntry.id },
        });

        // Publish if needed
        if (store.publishedAt === null && store.documentId) {
          try {
            await app.documents('api::store.store').publish({
              documentId: store.documentId,
            });
          } catch {
            // Already published — ignore
          }
        }

        const sizeKB = (logoResult.buffer.byteLength / 1024).toFixed(1);
        console.log(` ✅ ${logoResult.mimeType} (${sizeKB} KB, was ${logoResult.originalFormat})`);
        fetched++;

        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.log(` ❌ error: ${error instanceof Error ? error.message : error}`);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Fetched: ${fetched}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed:  ${failed}`);
    console.log(`   📦 Total:   ${stores.length}`);
  } finally {
    await app.destroy();
    console.log('\n👋 Done.');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
