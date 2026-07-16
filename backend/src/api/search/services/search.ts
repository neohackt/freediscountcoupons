interface SearchResult {
  stores: Array<{ id: number; documentId: string; name: string; slug: string; logo?: { url: string } | null; score: number; matchType: string }>;
  categories: Array<{ id: number; documentId: string; name: string; slug: string; icon?: string; score: number; matchType: string }>;
  coupons: Array<{ id: number; documentId: string; title: string; code: string; discount_type: string; store?: { name: string; slug: string; logo?: { url: string } | null } | null; score: number; matchType: string }>;
}

interface ScoredItem {
  id: number;
  documentId: string;
  score: number;
  matchType: string;
}

export default ({ strapi }) => ({
  async search(query: string): Promise<SearchResult> {
    const q = query.toLowerCase().trim();

    const [stores, categories, coupons] = await Promise.all([
      strapi.db.query('api::store.store').findMany({
        where: {
          $or: [
            { name: { $containsi: q } },
          ],
        },
        populate: ['logo', 'categories'],
      }),
      strapi.db.query('api::category.category').findMany({
        where: {
          $or: [
            { name: { $containsi: q } },
          ],
        },
      }),
      strapi.db.query('api::coupon.coupon').findMany({
        where: {
          $or: [
            { title: { $containsi: q } },
            { description: { $containsi: q } },
          ],
        },
        populate: ['store', 'store.logo', 'categories'],
      }),
    ]);

    const scoredStores: SearchResult['stores'] = stores.map((store) => {
      let score = 0;
      let matchType = '';

      if (store.name.toLowerCase() === q) {
        score = 100;
        matchType = 'Exact Store Match';
      } else if (store.name.toLowerCase().includes(q)) {
        score = 80;
        matchType = 'Store Name Contains Query';
      } else {
        const aliases: string[] = Array.isArray(store.aliases) ? store.aliases : [];
        if (aliases.some((a: string) => a.toLowerCase() === q)) {
          score = 95;
          matchType = 'Store Alias Match';
        } else if (aliases.some((a: string) => a.toLowerCase().includes(q))) {
          score = 75;
          matchType = 'Store Alias Contains Query';
        } else {
          score = 40;
          matchType = 'Store Match';
        }
      }

      return {
        id: store.id,
        documentId: store.documentId,
        name: store.name,
        slug: store.slug,
        logo: store.logo || null,
        score,
        matchType,
      };
    });

    const scoredCategories: SearchResult['categories'] = categories.map((cat) => ({
      id: cat.id,
      documentId: cat.documentId,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      score: 60,
      matchType: 'Category Match',
    }));

    const scoredCoupons: SearchResult['coupons'] = coupons.map((coupon) => {
      let score = 0;
      let matchType = '';

      if (coupon.title.toLowerCase().includes(q)) {
        score = 40;
        matchType = 'Coupon Title Match';
      } else {
        score = 20;
        matchType = 'Coupon Description Match';
      }

      return {
        id: coupon.id,
        documentId: coupon.documentId,
        title: coupon.title,
        code: coupon.code,
        discount_type: coupon.discount_type,
        store: coupon.store ? { name: (coupon.store as any).name, slug: (coupon.store as any).slug, logo: (coupon.store as any).logo || null } : null,
        score,
        matchType,
      };
    });

    scoredStores.sort((a, b) => b.score - a.score);
    scoredCategories.sort((a, b) => b.score - a.score);
    scoredCoupons.sort((a, b) => b.score - a.score);

    return {
      stores: scoredStores.slice(0, 10),
      categories: scoredCategories.slice(0, 5),
      coupons: scoredCoupons.slice(0, 20),
    };
  },

  async autocomplete(query: string) {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return { stores: [], categories: [], coupons: [] };

    const [stores, categories, coupons] = await Promise.all([
      strapi.db.query('api::store.store').findMany({
        where: {
          $or: [
            { name: { $containsi: q } },
          ],
        },
        populate: ['logo'],
        limit: 4,
      }),
      strapi.db.query('api::category.category').findMany({
        where: {
          name: { $containsi: q },
        },
        limit: 2,
      }),
      strapi.db.query('api::coupon.coupon').findMany({
        where: {
          title: { $containsi: q },
          is_expired: false,
        },
        populate: ['store', 'store.logo'],
        limit: 4,
      }),
    ]);

    return {
      stores: stores.map((s) => ({ id: s.id, name: s.name, slug: s.slug, logo: s.logo || null, type: 'store' as const })),
      categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, type: 'category' as const })),
      coupons: coupons.map((c) => ({ id: c.id, title: c.title, code: c.code, store: c.store ? { name: (c.store as any).name, slug: (c.store as any).slug } : null, type: 'coupon' as const })),
    };
  },
});
