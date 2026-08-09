import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { StoreSidebar } from '@/components/features/StoreSidebar';
import { HolyCouponCard } from '@/components/features/HolyCouponCard';
import { BrandStats } from '@/components/features/BrandStats';
import { StoreInfoGrid } from '@/components/ui/StoreInfoGrid';
import { FaqAccordion } from '@/components/ui/FaqAccordion';
import { StoreJsonLd } from '@/components/seo/StoreJsonLd';
import { BreadcrumbJsonLd, buildBreadcrumbEntries } from '@/components/seo/BreadcrumbJsonLd';
import { SITE_URL, STRAPI_URL, BRAND_CONFIG } from '@/lib/strapi';
import { formatCurrency, resolveCouponCurrency } from '@/lib/formatters/currency';
import type { Store, StoreFaq, StoreFaqJsonLd } from '@/types';

export const revalidate = 60;

function normalizeFaqs(raw: StoreFaq[] | StoreFaqJsonLd | null | undefined): StoreFaq[] {
  if (!raw) return [];

  // JSON-LD FAQPage format
  if (!Array.isArray(raw) && Array.isArray(raw.mainEntity)) {
    return raw.mainEntity
      .filter((q) => q.name && q.acceptedAnswer?.text)
      .map((q) => ({
        question: q.name,
        answer: q.acceptedAnswer.text,
      }));
  }

  // Flat array format
  if (Array.isArray(raw)) {
    return raw.filter((f) => f.question && f.answer);
  }

  return [];
}

export async function generateStaticParams() {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/stores?fields=slug&pagination[pageSize]=100`
    );
    const data = await response.json();
    return (data.data || []).map((store: { slug: string }) => ({
      slug: store.slug,
    }));
  } catch {
    return [];
  }
}

async function getSimilarStores(slug: string): Promise<Store[]> {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/stores/similar/${slug}`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.data || []) as Store[];
  } catch {
    return [];
  }
}

async function getStoreBySlug(slug: string) {
  try {
    const url = `${STRAPI_URL}/api/stores/slug/${slug}`;
    
    const response = await fetch(url, { next: { revalidate: 60 } });
    
    if (!response.ok) {
      console.error('[StorePage] Response not OK:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    const store = data.data || null;
    
    return store;
  } catch (error) {
    console.error('[StorePage] Error fetching store:', error);
    return null;
  }
}

function calculateStats(coupons: any[], store?: { currency?: string | null; country?: string | null }) {
  const totalOffers = coupons.length;
  const verifiedCoupons = coupons.filter(c => c.verified).length;
  const usedToday = coupons.reduce((sum, c) => sum + (c.times_used || 0), 0);
  const bestDiscount = getBestDiscount(coupons, store);
  
  return { totalOffers, verifiedCoupons, usedToday, bestDiscount };
}

function getBestDiscount(coupons: any[], store?: { currency?: string | null; country?: string | null }): string {
  if (coupons.length === 0) return 'N/A';
  
  const percentageCoupons = coupons.filter(c => c.discount_type === 'percentage');
  const fixedCoupons = coupons.filter(c => c.discount_type === 'fixed');
  
  const maxPercentage = percentageCoupons.reduce((max, c) => Math.max(max, c.discount_value || 0), 0);
  const maxFixed = fixedCoupons.reduce((max, c) => Math.max(max, c.discount_value || 0), 0);
  
  if (maxPercentage >= maxFixed && maxPercentage > 0) {
    return `${maxPercentage}% OFF`;
  }
  if (maxFixed > 0) {
    // Use first fixed coupon to resolve currency
    const fixedCoupon = fixedCoupons.find(c => c.discount_value === maxFixed);
    const currency = resolveCouponCurrency(fixedCoupon || {}, store);
    return currency
      ? `${formatCurrency(maxFixed, currency)} OFF`
      : `${maxFixed} OFF`;
  }
  return 'DEALS';
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    return { title: 'Store Not Found' };
  }

  const activeCoupons = (store.coupons || []).filter((c: any) => !c.is_expired);
  const hasNoActiveCoupons = activeCoupons.length === 0;

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const title = store.seo_title || `${store.name} Promo Codes, Coupons & Discounts | ${currentMonth}`;
  const description = store.seo_description || `Save with verified ${store.name} coupon codes for ${currentMonth}. Find the latest ${store.name} deals and exclusive discounts at ${BRAND_CONFIG.name}.`;
  const url = `${SITE_URL}/store/${slug}`;

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
      index: !store.noindex && !hasNoActiveCoupons,
      follow: true,
    },
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const [allCoupons, similarStores] = await Promise.all([
    Promise.resolve(store.coupons || []),
    getSimilarStores(slug),
  ]);
  const activeCoupons = allCoupons.filter((c: any) => !c.is_expired);
  const expiredCoupons = allCoupons.filter((c: any) => c.is_expired);
  const verifiedCoupons = activeCoupons.filter((c: any) => c.verified);
  const regularCoupons = activeCoupons.filter((c: any) => !c.verified);
  const stats = calculateStats(activeCoupons, store);

  return (
    <>
      <StoreJsonLd store={store as Store} coupons={allCoupons} />
      <BreadcrumbJsonLd
        items={buildBreadcrumbEntries([
          { label: 'Stores', path: '/stores' },
          { label: store.name, path: `/store/${slug}` },
        ])}
      />

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-8">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Stores', href: '/stores' },
              { label: store.name },
            ]}
            className="text-blue-100 [&_a:hover]:text-white [&_span:not(:last-child)]:text-blue-200"
          />
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <StoreSidebar store={store as Store} stats={stats} similarStores={similarStores} />

          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {store.name} Coupon Codes for <span className="text-blue-600">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </h1>
              
              <p className="text-gray-600 mb-2">
                Save with popular {store.name} promo codes.
              </p>

              <p className="text-lg font-semibold text-gray-900">
                {allCoupons.length} Available Coupons
              </p>
            </div>

            {verifiedCoupons.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Top Verified
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Verified {store.name} Coupons
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {verifiedCoupons.map((coupon: any) => (
                    <HolyCouponCard
                      key={coupon.id}
                      coupon={{ ...coupon, store }}
                    />
                  ))}
                </div>
              </section>
            )}

            {regularCoupons.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    More {store.name} Coupon Codes
                  </h2>
                  <p className="text-gray-500">{regularCoupons.length} More Coupons</p>
                </div>
                
                <div className="space-y-4">
                  {regularCoupons.map((coupon: any) => (
                    <HolyCouponCard
                      key={coupon.id}
                      coupon={{ ...coupon, store }}
                    />
                  ))}
                </div>
              </section>
            )}

            {expiredCoupons.length > 0 && (
              <section className="mt-10">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Expired Coupons
                </h2>
                
                <div className="space-y-4">
                  {expiredCoupons.map((coupon: any) => (
                    <HolyCouponCard
                      key={coupon.id}
                      coupon={{ ...coupon, store }}
                      isExpired
                    />
                  ))}
                </div>
              </section>
            )}

            {activeCoupons.length === 0 && expiredCoupons.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-500 mb-2">No coupons available for this store yet.</p>
                <p className="text-gray-400 text-sm">Check back soon for new deals!</p>
              </div>
            )}

            <BrandStats
              totalOffers={stats.totalOffers}
              verifiedCoupons={stats.verifiedCoupons}
              usedToday={stats.usedToday}
              bestDiscount={stats.bestDiscount}
            />

            {(store.description_html || store.description) && (
              <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{store.name} Store Info</h2>
                <StoreInfoGrid html={store.description_html || store.description} />
              </div>
            )}

            {(() => {
              const faqs = normalizeFaqs(store.faqs);
              return faqs.length > 0 ? (
                <FaqAccordion faqs={faqs} title={`${store.name} Frequently Asked Questions`} />
              ) : null;
            })()}

            <div className="mt-8 text-sm text-gray-400">
              Last updated: {new Date(store.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}