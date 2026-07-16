import type { Metadata } from 'next';
import SearchPageClient from './SearchPageClient';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || '';

  return {
    title: query ? `Search: ${query} - FreeDiscountCoupons` : 'Search Coupons & Stores - FreeDiscountCoupons',
    description: `Search for ${query || 'coupons, deals, and stores'} at FreeDiscountCoupons.`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';

  return (
    <>
      <meta name="robots" content="noindex,follow" />
      <SearchPageClient initialQuery={query} />
    </>
  );
}
