'use client';

import { useSearchParams } from 'next/navigation';
import { StoreSidebar } from './StoreSidebar';
import type { Store } from '@/types';

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
  const searchParams = useSearchParams();
  const gclid = searchParams.get('gclid') || '';
  const keyword = searchParams.get('keyword') || '';

  let websiteUrl = store?.affiliate_url || store?.website_url || '#';
  websiteUrl = websiteUrl
    .replaceAll('{gclid}', encodeURIComponent(gclid))
    .replaceAll('{keyword}', encodeURIComponent(keyword));

  return <StoreSidebar store={store} stats={stats} similarStores={similarStores} websiteUrl={websiteUrl} />;
}