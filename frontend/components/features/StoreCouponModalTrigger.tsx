'use client';

import { useEffect, useState } from 'react';
import { CouponDetailsModal } from './CouponDetailsModal';
import { getTrackingValues, getTrackedCouponLink, initializeTracking } from '@/lib/tracking';
import type { Coupon, Store } from '@/types';

export function StoreCouponModalTrigger({ coupon, store }: { coupon: Coupon; store: Store }) {
  const [isOpen, setIsOpen] = useState(true);

  // Initialize tracking client-side
  useEffect(() => {
    initializeTracking();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Remove coupon param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('coupon');
    window.history.replaceState({}, '', url.toString());
  };

  const handleRedeem = () => {
    // Reuse existing tracked coupon link logic
    const { gclid, keyword } = getTrackingValues();
    const couponLink = getTrackedCouponLink(
      coupon.affiliate_url,
      store.website_url || '#',
      gclid,
      keyword
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