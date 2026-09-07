'use client';

import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

interface StoreSidebarUrlTrackerProps {
  store: {
    affiliate_url?: string | null;
    website_url?: string | null;
  };
  children: (websiteUrl: string) => ReactNode;
}

export function StoreSidebarUrlTracker({ store, children }: StoreSidebarUrlTrackerProps) {
  const searchParams = useSearchParams();
  const gclid = searchParams.get('gclid') || '';
  const keyword = searchParams.get('keyword') || '';

  let websiteUrl = store?.affiliate_url || store?.website_url || '#';
  websiteUrl = websiteUrl
    .replaceAll('{gclid}', encodeURIComponent(gclid))
    .replaceAll('{keyword}', encodeURIComponent(keyword));

  return <>{children(websiteUrl)}</>;
}