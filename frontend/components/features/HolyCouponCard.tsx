'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CouponButton } from './CouponButton';
import type { Coupon } from '@/types';

interface HolyCouponCardProps {
  coupon: Coupon;
  storeLogo?: string;
  variant?: 'default' | 'highlight';
  isExpired?: boolean;
}

export function HolyCouponCard({ coupon, storeLogo, variant = 'default', isExpired = false }: HolyCouponCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const store = coupon.store;
  const websiteUrl = store?.affiliate_url || store?.website_url || '#';
  const couponLink = coupon.affiliate_url || websiteUrl;

  const discountText = getDiscountText(coupon);
  const badgeType = getBadgeType(coupon);
  const timeAgo = getTimeAgo(coupon.createdAt);

  const handleReveal = () => {
    setIsRevealed(true);
    if (couponLink) {
      window.open(couponLink, '_blank');
    }
    copyToClipboard(coupon.code);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border transition-all',
        variant === 'highlight' ? 'border-green-500' : 'border-gray-200'
      )}
    >
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-4 sm:block sm:flex-shrink-0">
            <div className={cn(
              "flex-shrink-0 w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center border border-dashed rounded-md bg-white",
              isExpired ? "border-gray-200" : "border-gray-300"
            )}>
              <span className={cn(
                "text-xl sm:text-2xl font-bold tracking-wider",
                isExpired ? "text-gray-400" : "text-gray-900"
              )}>
                {discountText}
              </span>
            </div>
            
            <div className="flex-1 min-w-0 sm:hidden">
              {isExpired ? (
                <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-500 mb-1">
                  Expired
                </span>
              ) : (
                <>
                  {badgeType === 'highest' && (
                    <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-600 mb-1">
                      Highest Discount
                    </span>
                  )}
                  {badgeType === 'likely' && (
                    <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-600 mb-1">
                      Likely to work
                    </span>
                  )}
                  {badgeType === 'default' && (
                    <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 mb-1">
                      Active
                    </span>
                  )}
                </>
              )}
              <h3 className={cn(
                "text-base font-semibold truncate",
                isExpired ? "text-gray-500" : "text-gray-900"
              )}>
                {coupon.title}
              </h3>
            </div>
          </div>
          
          <div className="hidden sm:block flex-1 min-w-0">
            {isExpired ? (
              <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-500 mb-2">
                Expired
              </span>
            ) : (
              <>
                {badgeType === 'highest' && (
                  <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-600 mb-2">
                    Highest Discount
                  </span>
                )}
                {badgeType === 'likely' && (
                  <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-600 mb-2">
                    Likely to work
                  </span>
                )}
                {badgeType === 'default' && (
                  <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 mb-2">
                    Active
                  </span>
                )}
              </>
            )}
            
            <h3 className={cn(
              "text-lg font-semibold mb-2",
              isExpired ? "text-gray-500" : "text-gray-900"
            )}>
              {coupon.title}
            </h3>
            
            <div className="flex items-center gap-4 text-sm">
              {coupon.verified && !isExpired && (
                <span className="text-green-600 font-medium">✓ Verified</span>
              )}
              {isExpired ? (
                <span className="text-gray-400 font-medium">Expired</span>
              ) : (
                timeAgo && (
                  <span className="text-gray-500">Worked {timeAgo}</span>
                )
              )}
            </div>
          </div>

          {isExpired ? (
            <p className="text-xs text-gray-400 sm:hidden">Expired</p>
          ) : (
            timeAgo && (
              <p className="text-xs text-gray-500 sm:hidden">Worked {timeAgo}</p>
            )
          )}

          <div className="sm:flex-shrink-0">
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
              onCopy={() => {
                copyToClipboard(coupon.code);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getDiscountText(coupon: Coupon): string {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value || 0}%`;
  }
  if (coupon.discount_type === 'fixed') {
    return `$${coupon.discount_value || 0}`;
  }
  if (coupon.discount_text) {
    return coupon.discount_text;
  }
  return 'DEAL';
}

function getBadgeType(coupon: Coupon): string {
  if (coupon.verified) return 'likely';
  if (coupon.is_featured) return 'highest';
  if (coupon.success_rate && coupon.success_rate > 70) return 'likely';
  return 'default';
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
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}