'use client';

import React from 'react';
import type { SearchResultStore, SearchResultCategory, SearchResultCoupon } from '@/types';

interface SearchResultsProps {
  stores: SearchResultStore[];
  categories: SearchResultCategory[];
  coupons: SearchResultCoupon[];
  query: string;
}

function StoreCard({ store }: { store: SearchResultStore }) {
  return (
    <a
      href={`/store/${store.slug}`}
      className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all"
    >
      {store.logo?.url ? (
        <img
          src={store.logo.url}
          alt={`${store.name} logo`}
          className="w-12 h-12 rounded-lg object-cover bg-gray-100"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600">
          {store.name.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 truncate">{store.name}</h3>
        <p className="text-xs text-gray-500">{store.matchType}</p>
      </div>
      <span className="text-blue-600 text-sm font-medium">View &rarr;</span>
    </a>
  );
}

function CouponCard({ coupon }: { coupon: SearchResultCoupon }) {
  return (
    <a
      href={`/store/${coupon.store?.slug || ''}`}
      className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-green-200 hover:shadow-md transition-all"
    >
      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-lg">
        {coupon.discount_type === 'percentage' ? '💰' : coupon.discount_type === 'free_shipping' ? '🚚' : '🏷️'}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 truncate">{coupon.title}</h3>
        <p className="text-xs text-gray-500">
          {coupon.store ? `${coupon.store.name} · ` : ''}{coupon.matchType}
        </p>
      </div>
      {coupon.code && (
        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
          {coupon.code}
        </span>
      )}
    </a>
  );
}

function CategoryCard({ category }: { category: SearchResultCategory }) {
  return (
    <a
      href={`/deals/${category.slug}`}
      className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-md transition-all"
    >
      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-xl">
        {category.icon || '📂'}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 truncate">{category.name}</h3>
        <p className="text-xs text-gray-500">Category</p>
      </div>
      <span className="text-purple-600 text-sm font-medium">View &rarr;</span>
    </a>
  );
}

export default function SearchResults({ stores, categories, coupons, query }: SearchResultsProps) {
  const hasResults = stores.length > 0 || categories.length > 0 || coupons.length > 0;

  if (!hasResults) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No results found</h2>
        <p className="text-gray-500">
          No matching coupons or stores found for &ldquo;{query}&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {stores.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🏪</span> Stores
            <span className="text-sm font-normal text-gray-500">({stores.length})</span>
          </h2>
          <div className="grid gap-3">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </section>
      )}

      {coupons.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🏷️</span> Coupons
            <span className="text-sm font-normal text-gray-500">({coupons.length})</span>
          </h2>
          <div className="grid gap-3">
            {coupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📂</span> Categories
            <span className="text-sm font-normal text-gray-500">({categories.length})</span>
          </h2>
          <div className="grid gap-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
