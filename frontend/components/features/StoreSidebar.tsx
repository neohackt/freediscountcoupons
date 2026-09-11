'use client';

import Image from 'next/image';
import Link from 'next/link';
import { RatingWidget } from './RatingWidget';
import { BrandStats } from './BrandStats';
import { SimilarStores } from './SimilarStores';
import type { Store } from '@/types';
import { getStoreLogo } from '@/lib/strapi';

interface SimilarStore {
  id: number | string;
  slug: string;
  name: string;
}

interface StoreSidebarProps {
  store: Store;
  stats: {
    totalOffers: number;
    verifiedCoupons: number;
    usedToday: number;
    bestDiscount: string;
  };
  similarStores?: Store[];
  websiteUrl: string;
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

export function StoreSidebar({ store, stats, similarStores = [], websiteUrl }: StoreSidebarProps) {
  const logoUrl = getStoreLogo(store);

  const similarStoresData = similarStores.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
  }));

  const categorySlug = store.categories?.[0]?.slug;

  return (
    <aside className="w-full lg:w-80 flex-shrink-0">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-5">
          <Link
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="block"
          >
            <div className="w-full bg-gray-50 rounded-lg flex items-center justify-center p-4 mb-4">
              <Image
                src={logoUrl}
                alt={store.name}
                width={160}
                height={80}
                className="object-contain max-h-20"
                unoptimized
              />
            </div>
          </Link>

          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded-lg text-center mb-4 transition-colors"
          >
            Shop Now at {store.name}
          </a>
           
          <RatingWidget 
            storeId={store.id} 
            storeName={store.name}
            initialRating={5}
            initialVotes={3}
          />
        </div>
      </div>

      <BrandStats
        totalOffers={stats.totalOffers}
        verifiedCoupons={stats.verifiedCoupons}
        usedToday={stats.usedToday}
        bestDiscount={stats.bestDiscount}
        className="hidden lg:block"
      />

      <SimilarStores
        similarStores={similarStoresData}
        categorySlug={categorySlug}
        className="hidden lg:block"
      />
    </aside>
  );
}