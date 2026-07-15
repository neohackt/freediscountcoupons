import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { CategoryGrid } from '@/components/features/CategoryGrid';
import { BreadcrumbJsonLd, buildBreadcrumbEntries } from '@/components/seo/BreadcrumbJsonLd';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';
import { SITE_URL } from '@/lib/constants';
import type { Category } from '@/types';

export const revalidate = 3600;

async function getCategories() {
  try {
    const response = await fetch('http://localhost:1337/api/categories?pagination[pageSize]=50', {
      next: { revalidate: 3600 }
    });
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export const metadata: Metadata = {
  title: 'Browse Categories',
  description: 'Browse coupons and deals by category. Find discounts on electronics, clothing, beauty, home goods, and more.',
  openGraph: {
    title: 'Browse Categories | CouponDeals',
    description: 'Browse coupons and deals by category. Find discounts on electronics, clothing, beauty, home goods, and more.',
    url: `${SITE_URL}/browse`,
  },
  alternates: {
    canonical: `${SITE_URL}/browse`,
  },
};

export default async function BrowsePage() {
  const categories = await getCategories();

  return (
    <>
      <BreadcrumbJsonLd
        items={buildBreadcrumbEntries([
          { label: 'Categories', path: '/browse' },
        ])}
      />
      {categories.length > 0 && (
        <ItemListJsonLd
          name="All Categories"
          items={categories.map((c: any) => ({
            name: c.name,
            url: `/browse/${c.slug}`,
            description: c.description,
          }))}
        />
      )}

      <Container className="py-8">
        <Breadcrumbs items={[{ label: 'Categories' }]} className="mb-6" />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse by Category</h1>
          <p className="text-gray-600">
            Find the best deals and coupons from your favorite categories
          </p>
        </div>

        {categories.length > 0 ? (
          <CategoryGrid categories={categories as Category[]} columns={4} />
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500">No categories available yet.</p>
            <p className="text-gray-400 text-sm mt-2">Add categories from your Strapi admin panel.</p>
          </div>
        )}
      </Container>
    </>
  );
}