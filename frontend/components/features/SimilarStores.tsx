'use client';

import Link from 'next/link';
import type { Store } from '@/types';

interface SimilarStoresProps {
  similarStores: Store[];
  storeCategories?: Store['categories'];
  className?: string;
}

export function SimilarStores({ similarStores, storeCategories, className }: SimilarStoresProps) {
  if (!similarStores || similarStores.length === 0) return null;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 mt-6 ${className || ''}`}>
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
          href={`/category/${storeCategories?.[0]?.slug || ''}`}
          className="block mt-4 text-xs font-semibold text-blue-600 hover:text-blue-800 uppercase tracking-wide"
        >
          View All →
        </Link>
      </div>
    </div>
  );
}