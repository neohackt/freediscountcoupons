import Image from 'next/image';
import Link from 'next/link';
import type { RelatedStore } from '@/types/blog';

interface RelatedStoresProps {
  stores: RelatedStore[];
}

export default function RelatedStores({ stores }: RelatedStoresProps) {
  if (stores.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Stores</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/store/${store.slug}`}
            className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all"
          >
            {store.logo?.url ? (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <Image
                  src={store.logo.url}
                  alt={store.logo.alternativeText || store.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600 flex-shrink-0">
                {store.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{store.name}</h3>
              {store.activeCouponCount !== undefined && (
                <p className="text-xs text-gray-500">{store.activeCouponCount} active coupons</p>
              )}
            </div>
            <span className="text-blue-600 text-sm font-medium flex-shrink-0">View &rarr;</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
