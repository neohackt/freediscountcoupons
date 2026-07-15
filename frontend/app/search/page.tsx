'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { CouponGrid } from '@/components/features/CouponGrid';
import { StoreGrid } from '@/components/features/StoreGrid';
import { SearchBar } from '@/components/features/SearchBar';
import { strapi } from '@/lib/strapi';
import type { Coupon, Store } from '@/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'coupons' | 'stores'>('coupons');

  useEffect(() => {
    async function searchData() {
      if (!query) return;

      setLoading(true);
      try {
        const [couponsRes, storesRes] = await Promise.all([
          strapi.searchCoupons(query),
          strapi.searchStores(query),
        ]);

        setCoupons(couponsRes.data || []);
        setStores(storesRes.data || []);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    }

    searchData();
  }, [query]);

  return (
    <>
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-12">
        <Container>
          <h1 className="text-3xl font-bold text-white text-center mb-6">
            Search Results
          </h1>
          <SearchBar />
        </Container>
      </div>

      <Container className="py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Search</span>
          {query && (
            <>
              <span>/</span>
              <span className="text-gray-900">{query}</span>
            </>
          )}
        </nav>

        {query && (
          <p className="text-gray-600 mb-6">
            Showing results for "<span className="font-semibold">{query}</span>"
          </p>
        )}

        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'coupons'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Coupons ({coupons.length})
            </button>
            <button
              onClick={() => setActiveTab('stores')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'stores'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Stores ({stores.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Searching...</p>
          </div>
        ) : (
          <>
            {activeTab === 'coupons' && (
              coupons.length > 0 ? (
                <CouponGrid coupons={coupons} />
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <p className="text-gray-500">No coupons found for "{query}"</p>
                </div>
              )
            )}

            {activeTab === 'stores' && (
              stores.length > 0 ? (
                <StoreGrid stores={stores} />
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <p className="text-gray-500">No stores found for "{query}"</p>
                </div>
              )
            )}
          </>
        )}
      </Container>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}