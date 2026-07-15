import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { StoreGrid } from '@/components/features/StoreGrid';
import { BreadcrumbJsonLd, buildBreadcrumbEntries } from '@/components/seo/BreadcrumbJsonLd';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';
import { SITE_URL } from '@/lib/constants';
import type { Store } from '@/types';

export const revalidate = 3600;

async function getStores() {
  try {
    const params = new URLSearchParams();
    params.set('populate[0]', 'logo');
    params.set('populate[1]', 'coupons');
    params.set('pagination[pageSize]', '100');
    params.set('sort', 'name:asc');

    const response = await fetch(`http://localhost:1337/api/stores?${params.toString()}`, {
      next: { revalidate: 3600 }
    });
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
}

export const metadata: Metadata = {
  title: 'All Stores',
  description: 'Browse all stores and find coupons, promo codes, and deals from your favorite retailers. Save money with verified discount codes.',
  openGraph: {
    title: 'All Stores | CouponDeals',
    description: 'Browse all stores and find coupons, promo codes, and deals from your favorite retailers.',
    url: `${SITE_URL}/stores`,
  },
  alternates: {
    canonical: `${SITE_URL}/stores`,
  },
};

export default async function StoresPage() {
  const stores = await getStores();

  return (
    <>
      <BreadcrumbJsonLd
        items={buildBreadcrumbEntries([
          { label: 'Stores', path: '/stores' },
        ])}
      />
      {stores.length > 0 && (
        <ItemListJsonLd
          name="All Stores"
          items={stores.map((s: any) => ({
            name: s.name,
            url: `/store/${s.slug}`,
            description: s.description,
          }))}
        />
      )}

      <Container className="py-8">
        <Breadcrumbs items={[{ label: 'Stores' }]} className="mb-6" />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Stores</h1>
          <p className="text-gray-600">
            Browse coupons and deals from {stores.length}+ stores
          </p>
        </div>

        {stores.length > 0 ? (
          <StoreGrid stores={stores as Store[]} />
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500">No stores available yet.</p>
            <p className="text-gray-400 text-sm mt-2">Add stores from your Strapi admin panel.</p>
          </div>
        )}
      </Container>
    </>
  );
}