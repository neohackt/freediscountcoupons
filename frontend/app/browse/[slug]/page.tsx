import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { CouponGrid } from '@/components/features/CouponGrid';
import { BreadcrumbJsonLd, buildBreadcrumbEntries } from '@/components/seo/BreadcrumbJsonLd';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';
import { SITE_URL, BRAND_CONFIG } from '@/lib/constants';
import type { Coupon } from '@/types';

export const revalidate = 10800;

export async function generateStaticParams() {
  try {
    const response = await fetch(
      `http://localhost:1337/api/categories?fields=slug&pagination[pageSize]=100`
    );
    const data = await response.json();
    return (data.data || []).map((cat: { slug: string }) => ({
      slug: cat.slug,
    }));
  } catch {
    return [];
  }
}

async function getCategoryBySlug(slug: string) {
  try {
    const params = new URLSearchParams();
    params.set('filters[slug][$eq]', slug);
    params.append('populate[stores]', 'true');
    params.append('populate[coupons]', 'true');

    const response = await fetch(
      `http://localhost:1337/api/categories?${params.toString()}`,
      { next: { revalidate: 10800 } }
    );
    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

async function getCouponsByCategory(categorySlug: string) {
  try {
    const params = new URLSearchParams();
    params.set('filters[categories][slug][$eq]', categorySlug);
    params.set('filters[is_expired][$ne]', 'true');
    params.append('populate[store]', 'true');
    params.append('populate[categories]', 'true');
    params.set('pagination[pageSize]', '100');

    const response = await fetch(
      `http://localhost:1337/api/coupons?${params.toString()}`,
      { next: { revalidate: 10800 } }
    );
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    return { title: 'Category Not Found' };
  }

  const title = category.seo_title || `${category.name} Coupons & Deals`;
  const description = category.seo_description || `Find the best ${category.name} coupons, promo codes, and deals. Save money on ${category.name.toLowerCase()} with verified discounts at ${BRAND_CONFIG.name}.`;
  const url = `${SITE_URL}/browse/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: BRAND_CONFIG.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: !category.noindex,
      follow: true,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    return (
      <Container className="py-8">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h1>
          <p className="text-gray-500 mb-4">The category you're looking for doesn't exist.</p>
          <Link href="/browse" className="text-blue-600 hover:text-blue-700">
            Browse all categories →
          </Link>
        </div>
      </Container>
    );
  }

  const coupons = await getCouponsByCategory(slug);

  return (
    <>
      <BreadcrumbJsonLd
        items={buildBreadcrumbEntries([
          { label: 'Categories', path: '/browse' },
          { label: category.name, path: `/browse/${slug}` },
        ])}
      />
      {coupons.length > 0 && (
        <ItemListJsonLd
          name={`${category.name} Coupons`}
          items={coupons.map((c: any) => ({
            name: c.title,
            url: `/store/${c.store?.slug || ''}`,
            description: c.description,
          }))}
        />
      )}

      <Container className="py-8">
        <Breadcrumbs
          items={[
            { label: 'Categories', href: '/browse' },
            { label: category.name },
          ]}
          className="mb-6"
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
        </div>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {category.name} Deals ({coupons.length})
            </h2>
          </div>
          
          {coupons.length > 0 ? (
            <CouponGrid coupons={coupons as Coupon[]} />
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500 mb-2">No deals available in this category yet.</p>
              <p className="text-gray-400 text-sm">Check back soon for new offers!</p>
            </div>
          )}
        </section>
      </Container>
    </>
  );
}