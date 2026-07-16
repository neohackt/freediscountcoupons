'use client';

import React, { useEffect } from 'react';
import SearchBar from '@/components/features/SearchBar';
import SearchResults from '@/components/features/SearchResults';
import { useSearch } from '@/hooks/useSearch';

interface SearchPageClientProps {
  initialQuery: string;
}

export default function SearchPageClient({ initialQuery }: SearchPageClientProps) {
  const { query, setQuery, results, total, isLoading, error, search } = useSearch(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery, setQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(query.trim())}`);
      search(query.trim());
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Deals & Coupons</h1>
          <p className="text-gray-500">Find the best coupons, deals, and stores</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <SearchBar className="w-full" placeholder="Search stores, coupons, deals..." />
        </form>

        {initialQuery && (
          <p className="text-sm text-gray-500 mb-6">
            {isLoading ? (
              'Searching...'
            ) : error ? (
              <span className="text-red-600">Error: {error}</span>
            ) : (
              <>Showing <span className="font-semibold text-gray-900">{total}</span> results for &ldquo;<span className="font-semibold text-gray-900">{initialQuery}</span>&rdquo;</>
            )}
          </p>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isLoading && !error && initialQuery && (
          <SearchResults
            stores={results.stores}
            categories={results.categories}
            coupons={results.coupons}
            query={initialQuery}
          />
        )}

        {!initialQuery && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Start searching</h2>
            <p className="text-gray-500">
              Type a store name, coupon code, or category to find deals.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
