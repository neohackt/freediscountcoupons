'use client';

import { useState, useEffect } from 'react';
import { StoreLogoFigure } from './StoreCard';
import { getStoreLogo } from '@/lib/strapi';
import { getTrackingValues, initializeTracking, applyTrackingToUrl, type TrackingValues } from '@/lib/tracking';
import type { EventStore } from '@/types/event';

interface EventStoreCardProps {
  store: EventStore;
}

export function EventStoreCard({ store }: EventStoreCardProps) {
  const [trackingValues, setTrackingValues] = useState<TrackingValues>({
    gclid: '', keyword: '', src: '', camp: '', acc: '',
  });

  useEffect(() => {
    initializeTracking();
    setTrackingValues(getTrackingValues());
  }, []);

  const { gclid, keyword, src, camp, acc } = trackingValues;

  const storeLogoUrl = getStoreLogo(store);

  let destinationUrl = store?.affiliate_url || store?.website_url || '#';
  destinationUrl = applyTrackingToUrl(destinationUrl, gclid, keyword, src, camp, acc);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 text-center transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-200">
      <div className="flex justify-center">
        <StoreLogoFigure name={store.name} logoUrl={storeLogoUrl} />
      </div>
      <div className="text-lg font-semibold text-gray-900 mt-3 mb-4">
        {store.name}
      </div>
      <a
        href={destinationUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded-lg text-center transition-colors"
      >
        Go to Store
      </a>
    </div>
  );
}
