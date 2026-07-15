import { JsonLd } from './JsonLd';
import { BRAND_CONFIG, SITE_URL } from '@/lib/constants';
import type { Coupon } from '@/types';

interface CouponJsonLdProps {
  coupon: Coupon;
  storeSlug: string;
}

export function CouponJsonLd({ coupon, storeSlug }: CouponJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: coupon.title,
    ...(coupon.description ? { description: coupon.description } : {}),
    ...(coupon.code ? { discountCode: coupon.code } : {}),
    url: `${SITE_URL}/store/${storeSlug}`,
    availability: coupon.is_expired
      ? 'https://schema.org/SoldOut'
      : 'https://schema.org/InStock',
    ...(coupon.expires_at ? { validThrough: coupon.expires_at } : {}),
    seller: {
      '@type': 'Organization',
      name: BRAND_CONFIG.name,
    },
  };

  return <JsonLd data={data} />;
}
