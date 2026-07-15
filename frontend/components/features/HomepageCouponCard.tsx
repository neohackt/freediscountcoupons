'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CouponButton } from './CouponButton';
import type { Coupon } from '@/types';

interface HomepageCouponCardProps {
  coupon: Coupon;
}

export function HomepageCouponCard({ coupon }: HomepageCouponCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const store = coupon.store;
  const couponLink = coupon.affiliate_url || store?.affiliate_url || store?.website_url || '#';

  const discountText = getDiscountText(coupon);
  const timeAgo = getTimeAgo(coupon.createdAt);
  const hasCode = coupon.code && coupon.code.length > 0;

  // Get store logo URL
  const getStoreLogoUrl = () => {
    if (store?.logo?.url) {
      if (store.logo.url.startsWith('http')) {
        return store.logo.url;
      }
      return `http://localhost:1337${store.logo.url}`;
    }
    
    if (store?.website_url) {
      const domain = store.website_url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .toLowerCase();
      return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE&size=80&url=http://${domain}`;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(store?.name || 'S')}&size=80&background=2563eb&color=fff&font-size=0.4`;
  };

  const storeLogoUrl = getStoreLogoUrl();

  const handleReveal = () => {
    setIsRevealed(true);
    if (couponLink) {
      window.open(couponLink, '_blank');
    }
    if (hasCode) {
      navigator.clipboard.writeText(coupon.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border transition-all hover:shadow-md',
        hasCode ? 'border-gray-200' : 'border-orange-300 border-dashed'
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div className="flex items-center gap-4 sm:flex-shrink-0">
            <div className="flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center bg-gray-50 rounded-lg p-2">
              <Image
                src={storeLogoUrl}
                alt={store?.name || 'Store'}
                width={64}
                height={64}
                className="object-contain"
                unoptimized
              />
            </div>
            
            <div className="flex-1 min-w-0 sm:hidden">
              <div className="flex items-center gap-2 mb-1">
                {coupon.verified && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">
                    ✓ Verified
                  </span>
                )}
                <span className="text-sm font-semibold text-gray-900">{discountText}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {coupon.title}
              </h3>
            </div>
          </div>

          <div className="hidden sm:block flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {coupon.verified && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">
                  ✓ Verified
                </span>
              )}
              <span className="text-base font-semibold text-gray-900">{discountText}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">
              {coupon.title}
            </h3>
            {timeAgo && (
              <p className="text-sm text-gray-400">Worked {timeAgo}</p>
            )}
          </div>

          {timeAgo && (
            <p className="text-xs text-gray-400 sm:hidden">Worked {timeAgo}</p>
          )}

          <div className="sm:flex-shrink-0">
            {hasCode ? (
              <CouponButton
                code={coupon.code}
                isRevealed={isRevealed}
                isCopied={isCopied}
                onReveal={() => {
                  setIsRevealed(true);
                  if (couponLink) {
                    window.open(couponLink, '_blank');
                  }
                }}
              />
            ) : (
              <button
                onClick={() => {
                  if (couponLink) {
                    window.open(couponLink, '_blank');
                  }
                }}
                className="w-full px-6 py-3 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all whitespace-nowrap hover:scale-[1.01] hover:shadow-lg"
              >
                View Deal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getDiscountText(coupon: Coupon): string {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value || 0}% OFF`;
  }
  if (coupon.discount_type === 'fixed') {
    return `$${coupon.discount_value || 0} OFF`;
  }
  if (coupon.discount_text) {
    return coupon.discount_text;
  }
  return 'DEAL';
}

function getTimeAgo(dateString?: string): string | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return null;
}