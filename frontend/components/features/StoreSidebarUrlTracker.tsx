'use client';

import { useState, useEffect } from 'react';
import { StoreSidebar } from './StoreSidebar';
import type { Store } from '@/types';
import { getTrackingValues, initializeTracking, applyTrackingToUrl, type TrackingValues } from '@/lib/tracking';

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
  // Reactive tracking values — initialized empty for SSR/hydration consistency
  const [trackingValues, setTrackingValues] = useState<TrackingValues>({
    gclid: '', keyword: '', src: '', camp: '', acc: '',
  });

  useEffect(() => {
    initializeTracking();
    setTrackingValues(getTrackingValues());
  }, []);

  const { gclid, keyword, src, camp, acc } = trackingValues;

  let websiteUrl = store?.affiliate_url || store?.website_url || '#';
  websiteUrl = applyTrackingToUrl(websiteUrl, gclid, keyword, src, camp, acc);

  // Project store to minimal serializable object for StoreSidebar
  const sanitizedStore = store
    ? {
        id: store.id,
        name: store.name,
        website_url: store.website_url,
        affiliate_url: store.affiliate_url,
        logo: store.logo?.url ? { url: store.logo.url } : null,
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