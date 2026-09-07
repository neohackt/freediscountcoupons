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

  return <StoreSidebar store={store} stats={stats} similarStores={similarStores} websiteUrl={websiteUrl} />;
}