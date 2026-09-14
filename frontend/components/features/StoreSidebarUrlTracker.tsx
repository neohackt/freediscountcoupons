'use client';

import { StoreSidebar } from './StoreSidebar';
import type { Store } from '@/types';
import { getTrackingValues, initializeTracking } from '@/lib/tracking';

interface StoreSidebarUrlTrackerProps {
  store: Store;
  stats: {
    totalOffers: number;
    verifiedCoupons: number;
    usedToday: number;
    bestDiscount: string;
  };
  similarStores?: Store[];
}

export function StoreSidebarUrlTracker({ store, stats, similarStores }: StoreSidebarUrlTrackerProps) {
  initializeTracking();
  const { gclid, keyword } = getTrackingValues();

  let websiteUrl = store?.affiliate_url || store?.website_url || '#';
  websiteUrl = websiteUrl
    .replaceAll('{gclid}', encodeURIComponent(gclid))
    .replaceAll('{keyword}', encodeURIComponent(keyword));

  // Project store to minimal serializable object for StoreSidebar
  const sanitizedStore = store
    ? {
        id: store.id,
        name: store.name,
        website_url: store.website_url,
        affiliate_url: store.affiliate_url,
        categories: store.categories?.map((c) => ({ slug: c.slug })) || [],
      }
    : null;

  // Project similarStores to minimal serializable objects
  const sanitizedSimilarStores = similarStores
    ? similarStores.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
      }))
    : [];

  return (
    <StoreSidebar
      store={sanitizedStore}
      stats={stats}
      similarStores={sanitizedSimilarStores}
      websiteUrl={websiteUrl}
    />
  );
}