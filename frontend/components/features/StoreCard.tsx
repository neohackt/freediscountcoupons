'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Store } from '@/types';

interface StoreCardProps {
  store: Store;
}

function getGoogleFaviconUrl(websiteUrl?: string, size = 128): string {
  if (!websiteUrl) return '';
  const domain = websiteUrl
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .toLowerCase();
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE&size=${size}&url=http://${domain}`;
}

function getStoreLogoUrl(store: Store): string {
  if (store.logo?.url) {
    if (store.logo.url.startsWith('http')) {
      return store.logo.url;
    }
    return `http://localhost:1337${store.logo.url}`;
  }

  const googleFavicon = getGoogleFaviconUrl(store.website_url);
  if (googleFavicon) {
    return googleFavicon;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&size=120&background=2563eb&color=fff&font-size=0.4`;
}

export function StoreCard({ store }: StoreCardProps) {
  const storeLogoUrl = getStoreLogoUrl(store);
  const couponCount = store.coupons?.length ?? 0;

  return (
    <Link
      href={`/store/${store.slug}`}
      className="group block bg-white rounded-xl border border-gray-100 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-200 hover:-translate-y-0.5"
    >
      <article className="flex items-center gap-4">
        <figure className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          <Image
            src={storeLogoUrl}
            alt={store.name}
            fill
            className="object-contain p-1"
            unoptimized
          />
        </figure>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {store.name}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {couponCount} {couponCount === 1 ? 'Coupon' : 'Coupons'}
          </p>
        </div>
      </article>
    </Link>
  );
}
