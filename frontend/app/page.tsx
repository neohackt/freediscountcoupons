import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { HeroBanner } from '@/components/features/HeroBanner';
import { StoreGrid } from '@/components/features/StoreGrid';
import { CategoryGrid } from '@/components/features/CategoryGrid';
import { CouponGrid } from '@/components/features/CouponGrid';
import { Newsletter } from '@/components/features/Newsletter';
import { SITE_URL } from '@/lib/constants';
import type { Store, Category, Coupon } from '@/types';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'CouponDeals - Best Coupons & Promo Codes',
  description: 'Save money with the latest coupons, promo codes, and deals from thousands of stores. Find verified discount codes and start saving today!',
  openGraph: {
    title: 'CouponDeals - Best Coupons & Promo Codes',
    description: 'Save money with the latest coupons, promo codes, and deals from thousands of stores.',
    url: SITE_URL,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

async function getHomepageData() {
  try {
    const [storesRes, categoriesRes, couponsRes] = await Promise.all([
      fetch('http://localhost:1337/api/stores?populate%5B%5D=coupons&populate%5B%5D=logo&pagination%5BpageSize%5D=100', { next: { revalidate: 3600 } }),
      fetch('http://localhost:1337/api/categories', { next: { revalidate: 3600 } }),
      fetch('http://localhost:1337/api/coupons?populate%5B%5D=store.logo&populate%5B%5D=store&populate%5B%5D=categories&pagination%5BpageSize%5D=100', { next: { revalidate: 3600 } })
    ]);
    
    const storesData = await storesRes.json();
    const categoriesData = await categoriesRes.json();
    const couponsData = await couponsRes.json();

    console.log('[HomePage] Coupons response:', JSON.stringify(couponsData.data?.[0]?.store, null, 2));

    const allStores = storesData.data || [];
    const popularStores = allStores.filter((s: any) => s.is_popular === true);
    
    const allCoupons = couponsData.data || [];
    const featuredCoupons = allCoupons.filter((c: any) => c.is_featured === true);

    return {
      stores: popularStores,
      categories: categoriesData.data || [],
      coupons: featuredCoupons,
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return {
      stores: [],
      categories: [],
      coupons: [],
    };
  }
}

export default async function HomePage() {
  const { stores, categories, coupons } = await getHomepageData();

  return (
    <>
      <HeroBanner />

      <Container className="py-12">
        <section className="mb-12 -mx-4 px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Popular Stores</h2>
            <a href="/stores" className="text-blue-600 hover:text-blue-700 font-medium">
              View all stores →
            </a>
          </div>
          {stores.length > 0 ? (
            <StoreGrid stores={stores as Store[]} hideFilter />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-gray-500">Load popular stores from your Strapi admin panel</p>
            </div>
          )}
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Today's Trending Coupons & Deals</h2>
          </div>
          {coupons.length > 0 ? (
            <CouponGrid coupons={coupons as Coupon[]} />
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">No trending coupons yet. Add coupons from your Strapi admin panel.</p>
            </div>
          )}
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Popular Categories</h2>
            <a href="/browse" className="text-blue-600 hover:text-blue-700 font-medium">
              View all categories →
            </a>
          </div>
          {categories.length > 0 ? (
            <CategoryGrid categories={categories as Category[]} columns={5} />
          ) : (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">Load categories from your Strapi admin panel</p>
            </div>
          )}
        </section>
      </Container>

      <Newsletter />
    </>
  );
}