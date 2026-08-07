import type { Core } from '@strapi/strapi';

const REVALIDATE_URL = process.env.REVALIDATE_URL || 'http://localhost:3000/api/revalidate';
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'your-secret-key';

export type ContentType = 'store' | 'coupon' | 'category' | 'blog' | 'blogCategory' | 'author' | 'homepage' | 'sitemap';

interface RouteRule {
  paths: string[];
  tags?: string[];
}

const ROUTE_RULES: Record<ContentType, (identifiers: Record<string, string>) => RouteRule> = {
  store: ({ slug }) => ({
    paths: [`/`, `/stores`, `/browse`, `/store/${slug}`, `/sitemap.xml`],
    tags: ['stores', 'homepage'],
  }),
  coupon: ({ storeSlug, slug }) => ({
    paths: [`/`, `/stores`, `/browse`, `/store/${storeSlug}`, slug ? `/coupon/${slug}` : null, `/sitemap.xml`].filter(Boolean) as string[],
    tags: ['coupons', 'stores', 'homepage'],
  }),
  category: ({ slug }) => ({
    paths: [`/browse`, `/browse/${slug}`, `/stores`, `/sitemap.xml`],
    tags: ['categories', 'stores', 'homepage'],
  }),
  blog: ({ slug }) => ({
    paths: [`/blog`, `/blog/${slug}`, `/sitemap.xml`],
    tags: ['blog', 'homepage'],
  }),
  blogCategory: ({ slug }) => ({
    paths: [`/blog`, slug ? `/blog/category/${slug}` : null, `/sitemap.xml`].filter(Boolean) as string[],
    tags: ['blog', 'categories'],
  }),
  author: () => ({
    paths: [`/blog`, `/sitemap.xml`],
    tags: ['blog', 'authors'],
  }),
  homepage: () => ({
    paths: [`/`],
    tags: ['homepage'],
  }),
  sitemap: () => ({
    paths: [`/sitemap.xml`],
    tags: ['sitemap'],
  }),
};

interface RevalidationPayload {
  paths: string[];
  tags: string[];
}

interface RevalidationResponse {
  success: boolean;
  revalidated: string[];
  failed?: { path: string; error: string }[];
  message?: string;
}

interface PendingRevalidation {
  paths: Set<string>;
  tags: Set<string>;
}

class RevalidationService {
  private static instance: RevalidationService;
  private pending: PendingRevalidation = { paths: new Set(), tags: new Set() };
  private flushTimeout: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private strapi: Core.Strapi | null = null;

  private constructor() {}

  static getInstance(): RevalidationService {
    if (!RevalidationService.instance) {
      RevalidationService.instance = new RevalidationService();
    }
    return RevalidationService.instance;
  }

  setStrapi(strapi: Core.Strapi): void {
    this.strapi = strapi;
  }

  addRoutes(type: ContentType, identifiers: Record<string, string>[]): void {
    const rule = ROUTE_RULES[type];
    if (!rule) {
      this.log(`Unknown content type for revalidation: ${type}`);
      return;
    }

    for (const id of identifiers) {
      const { paths, tags } = rule(id);
      for (const path of paths) {
        this.pending.paths.add(path);
      }
      if (tags) {
        for (const tag of tags) {
          this.pending.tags.add(tag);
        }
      }
    }

    this.scheduleFlush();
  }

  addTags(tags: string[]): void {
    for (const tag of tags) {
      this.pending.tags.add(tag);
    }
    this.scheduleFlush();
  }

  addPaths(paths: string[]): void {
    for (const path of paths) {
      this.pending.paths.add(path);
    }
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) return;
    this.flushTimeout = setTimeout(() => {
      this.flushTimeout = null;
      this.flush();
    }, 100);
  }

  async flush(): Promise<RevalidationResponse> {
    if (this.isFlushing || (this.pending.paths.size === 0 && this.pending.tags.size === 0)) {
      return { success: true, revalidated: [] };
    }

    this.isFlushing = true;
    const paths = [...this.pending.paths];
    const tags = [...this.pending.tags];
    this.pending.paths.clear();
    this.pending.tags.clear();

    const startTime = Date.now();
    let result: RevalidationResponse;

    try {
      result = await this.sendWithRetry({ paths, tags });
    } catch (error) {
      this.log(`Revalidation failed after retries: ${error}`);
      result = {
        success: false,
        revalidated: [],
        failed: paths.map(p => ({ path: p, error: error instanceof Error ? error.message : 'Unknown error' })),
        message: 'Revalidation failed after retries',
      };
    }

    const duration = Date.now() - startTime;
    this.logRevalidation(result, duration);

    this.isFlushing = false;
    return result;
  }

  private async sendWithRetry(payload: RevalidationPayload, retries = 3): Promise<RevalidationResponse> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(REVALIDATE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-revalidate-secret': REVALIDATE_SECRET,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json() as RevalidationResponse;

        if (!response.ok) {
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        return {
          success: data.success ?? true,
          revalidated: data.revalidated ?? [],
          failed: data.failed,
          message: data.message,
        };
      } catch (error) {
        this.log(`Revalidation attempt ${attempt}/${retries} failed: ${error}`);
        if (attempt === retries) throw error;
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retries exceeded');
  }

  private log(message: string): void {
    if (this.strapi?.log) {
      this.strapi.log.info(`[Revalidation] ${message}`);
    } else {
      console.log(`[Revalidation] ${message}`);
    }
  }

  private logRevalidation(result: RevalidationResponse, duration: number): void {
    const lines = [
      'Import Completed',
      `Revalidated Routes: ${result.revalidated.length}`,
      ...result.revalidated.map(p => `  ${p}`),
      `Total Routes: ${result.revalidated.length}`,
      `Time: ${(duration / 1000).toFixed(1)} seconds`,
      `Revalidation: ${result.success ? 'SUCCESS' : 'FAILED'}`,
    ].filter(Boolean);

    this.log(lines.join('\n'));

    if (!result.success && result.failed) {
      this.log(`Failed routes: ${result.failed.map(f => `${f.path}: ${f.error}`).join(', ')}`);
    }
  }

  getPendingCount(): { paths: number; tags: number } {
    return { paths: this.pending.paths.size, tags: this.pending.tags.size };
  }

  clearPending(): void {
    this.pending.paths.clear();
    this.pending.tags.clear();
  }
}

export const revalidationService = RevalidationService.getInstance();
export type { RevalidationResponse };