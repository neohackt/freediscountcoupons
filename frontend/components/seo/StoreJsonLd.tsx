import { JsonLd } from './JsonLd';
import { BRAND_CONFIG, SITE_URL } from '@/lib/constants';
import type { Store, Coupon } from '@/types';

interface StoreJsonLdProps {
  store: Store;
  coupons: Coupon[];
}

export function StoreJsonLd({ store, coupons }: StoreJsonLdProps) {
  const activeCoupons = coupons.filter((c) => !c.is_expired);

  const storeData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: store.name,
    url: `${SITE_URL}/store/${store.slug}`,
    ...(store.description ? { description: store.description } : {}),
    ...(store.logo?.url
      ? { logo: store.logo.url.startsWith('http') ? store.logo.url : `http://localhost:1337${store.logo.url}` }
      : {}),
  };

  const itemList = activeCoupons.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${store.name} Coupons`,
        numberOfItems: activeCoupons.length,
        itemListElement: activeCoupons.slice(0, 20).map((coupon, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Offer',
            name: coupon.title,
            ...(coupon.description ? { description: coupon.description } : {}),
            ...(coupon.code ? { discountCode: coupon.code } : {}),
            ...(coupon.discount_text ? { discount: coupon.discount_text } : {}),
            url: `${SITE_URL}/store/${store.slug}`,
            availability: coupon.is_expired
              ? 'https://schema.org/SoldOut'
              : 'https://schema.org/InStock',
            validThrough: coupon.expires_at || undefined,
            seller: {
              '@type': 'Organization',
              name: BRAND_CONFIG.name,
            },
          },
        })),
      }
    : null;

  return (
    <>
      <JsonLd data={storeData} />
      {itemList && <JsonLd data={itemList} />}
    </>
  );
}
