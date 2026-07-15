import { marked } from 'marked';

const REVALIDATE_URL = process.env.REVALIDATE_URL || 'http://localhost:3000';
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'your-secret-key';

function convertDescriptionToHtml(data: any) {
  if (data && data.description && typeof data.description === 'string') {
    data.description_html = marked.parse(data.description) as string;
  }
}

function convertEntityDescriptionToHtml(entry: any) {
  if (entry && entry.description && typeof entry.description === 'string') {
    entry.description_html = marked.parse(entry.description) as string;
  }
}

async function revalidateStore(slug: string) {
  try {
    await fetch(`${REVALIDATE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': REVALIDATE_SECRET,
      },
      body: JSON.stringify({ paths: [`/store/${slug}`] }),
    });
    console.log(`[Store Lifecycle] Revalidated /store/${slug}`);
  } catch (err) {
    console.error('[Store Lifecycle] Revalidation failed:', err);
  }
}

export default {
  beforeCreate(event: any) {
    convertDescriptionToHtml(event.params.data);
  },

  beforeUpdate(event: any) {
    convertDescriptionToHtml(event.params.data);
  },

  beforePublish(event: any) {
    // Strapi v5 admin "Publish" triggers this lifecycle
    // Regenerate description_html from description before publishing
    const entries = event.params?.entries || [event.entry];
    if (Array.isArray(entries)) {
      entries.forEach((entry: any) => {
        convertEntityDescriptionToHtml(entry);
      });
    } else {
      convertEntityDescriptionToHtml(entries);
    }
  },

  async afterCreate(event: any) {
    const slug = event.params.data?.slug;
    if (slug) await revalidateStore(slug);
  },

  async afterUpdate(event: any) {
    const slug = event.result?.slug || event.params.data?.slug;
    if (slug) await revalidateStore(slug);
  },

  async afterPublish(event: any) {
    // Revalidate after publishing
    const entries = event.params?.entries || [event.entry];
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        if (entry.slug) await revalidateStore(entry.slug);
      }
    } else if (entries?.slug) {
      await revalidateStore(entries.slug);
    }
  },
};
