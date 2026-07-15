import Image from 'next/image';
import Link from 'next/link';
import { RatingWidget } from './RatingWidget';
import { BrandStats } from './BrandStats';
import type { Store } from '@/types';

interface StoreSidebarProps {
  store: Store;
  stats: {
    totalOffers: number;
    verifiedCoupons: number;
    usedToday: number;
    bestDiscount: string;
  };
  similarStores?: Store[];
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
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&size=200&background=2563eb&color=fff`;
}

export function StoreSidebar({ store, stats, similarStores = [] }: StoreSidebarProps) {
  const logoUrl = getStoreLogoUrl(store);
  
  const websiteUrl = store.affiliate_url || store.website_url || '#';

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
      />

      {similarStores.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">
            Similar Stores
          </h3>
          <div className="border-t border-gray-100 pt-3">
            <ul className="space-y-2">
              {similarStores.map((s) => (
                <li key={s.id || s.slug}>
                  <Link
                    href={`/store/${s.slug}`}
                    className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={`/category/${store.categories?.[0]?.slug || ''}`}
              className="block mt-4 text-xs font-semibold text-blue-600 hover:text-blue-800 uppercase tracking-wide"
            >
              View All →
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}