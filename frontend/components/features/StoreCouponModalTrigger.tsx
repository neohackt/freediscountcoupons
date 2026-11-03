'use client';

import { useEffect, useState } from 'react';
import { CouponDetailsModal } from './CouponDetailsModal';
import { getTrackingValues, getTrackedCouponLink, initializeTracking, type TrackingValues } from '@/lib/tracking';
import type { Coupon, Store } from '@/types';

export function StoreCouponModalTrigger({ coupon, store }: { coupon: Coupon; store: Store }) {
  const [isOpen, setIsOpen] = useState(true);

  // Reactive tracking values — initialized empty for SSR/hydration consistency
  const [trackingValues, setTrackingValues] = useState<TrackingValues>({
    gclid: '', keyword: '', src: '', camp: '', acc: '',
  });

  // Initialize tracking client-side and update reactive state
  useEffect(() => {
    initializeTracking();
    setTrackingValues(getTrackingValues());
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Remove coupon param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('coupon');
    window.history.replaceState({}, '', url.toString());
  };

  const handleRedeem = () => {
    // Ensure tracking is initialized and read latest values from cookies
    initializeTracking();
    const { gclid, keyword, src, camp, acc } = getTrackingValues();
    const couponLink = getTrackedCouponLink(
      coupon.affiliate_url,
      store.website_url || '#',
      gclid,
      keyword,
      src,
      camp,
      acc
    );
    if (couponLink) {
      window.location.href = couponLink;
    }
  };

  if (!isOpen) return null;

  return (
    <CouponDetailsModal
      coupon={coupon}
      store={store}
      isOpen={isOpen}
      onClose={handleClose}
      onRedeem={handleRedeem}
    />
  );
}