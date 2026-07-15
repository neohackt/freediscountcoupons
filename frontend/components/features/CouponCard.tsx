'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CouponButton } from '@/components/features/CouponButton';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { formatDiscountText, getExpiryStatus, formatRelativeTime } from '@/lib/utils';
import type { Coupon } from '@/types';

interface CouponCardProps {
  coupon: Coupon;
  showStore?: boolean;
}

export function CouponCard({ coupon, showStore = true }: CouponCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copiedText, copyToClipboard] = useCopyToClipboard();

  const store = coupon.store;
  const discountDisplay = formatDiscountText(coupon);
  const { daysLeft } = getExpiryStatus(coupon.expires_at);
  const hasCode = coupon.code && coupon.code.length > 0;
  
  const timesUsed = coupon.times_used || 0;
  const isVerified = coupon.verified;

  const handleClick = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      if (coupon.affiliate_url || store?.affiliate_url) {
        window.open(coupon.affiliate_url || store?.affiliate_url, '_blank');
      }
    }
    copyToClipboard(coupon.code);
  };

  return (
    <Card className="hover:shadow-lg transition-all border-gray-200 h-full">
      <div className="p-5 flex flex-col h-full">
        {/* Top Section */}
        <div className="flex items-start justify-between gap-2 mb-3">
          {showStore && store && (
            <span className="text-sm text-gray-500">{store.name}</span>
          )}
          {isVerified && (
            <Badge variant="success" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified
            </Badge>
          )}
        </div>

        {/* Discount Amount Display */}
        <div className="bg-orange-50 border-2 border-orange-200 border-dashed rounded-lg p-3 mb-3 text-center">
          <span className="text-2xl font-bold text-orange-600">{discountDisplay}</span>
        </div>

        {/* Description */}
        {coupon.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">
            {coupon.description}
          </p>
        )}

        {/* Usage Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          {timesUsed > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Used {timesUsed.toLocaleString()} times
            </span>
          )}
          {coupon.createdAt && (
            <span className="flex items-center gap-1">
              Worked {formatRelativeTime(coupon.createdAt)}
            </span>
          )}
        </div>

        {/* Expiry */}
        {daysLeft !== Infinity && daysLeft > 0 && (
          <p className="text-xs text-orange-500 mb-4">
            Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
          </p>
        )}

        {/* Button */}
        <div className="mt-auto">
          {hasCode ? (
            <CouponButton
              code={coupon.code}
              isRevealed={isRevealed}
              isCopied={copiedText === coupon.code}
              onReveal={() => {
                setIsRevealed(true);
                if (coupon.affiliate_url || store?.affiliate_url) {
                  window.open(coupon.affiliate_url || store?.affiliate_url, '_blank');
                }
              }}
            />
          ) : (
            <button
              onClick={() => {
                if (coupon.affiliate_url || store?.affiliate_url) {
                  window.open(coupon.affiliate_url || store?.affiliate_url, '_blank');
                }
              }}
              className="w-full px-6 py-3 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all hover:scale-[1.01] hover:shadow-lg"
            >
              View Deal
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
