import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { BreadcrumbJsonLd, buildBreadcrumbEntries } from '@/components/seo/BreadcrumbJsonLd';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';
import BlogContent from '@/components/blog/BlogContent';
import { EventStoreCard } from '@/components/features/EventStoreCard';
import { SITE_URL, STRAPI_URL, BRAND_CONFIG, getMediaUrl } from '@/lib/strapi';
import type { Event } from '@/types/event';

export const revalidate = 60;

async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/events/slug/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return (data.data || null) as Event | null;
  } catch (error) {
    console.error('[EventPage] Error fetching event:', error);
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const response = await fetch(`${STRAPI_URL}/api/events/active`);
    const data = await response.json();
    return (data.data || []).map((event: { slug: string }) => ({
      slug: event.slug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return { title: 'Event Not Found' };
  }

  const title = event.seoTitle || `${event.name} Deals & Store Offers`;
  const description =
    event.seoDescription ||
    event.shortDescription ||
    `Shop the best ${event.name} deals and store offers at ${BRAND_CONFIG.name}.`;
  const url = `${SITE_URL}/events/${slug}`;
  const image = event.ogImage?.url || event.heroImage?.url;
  const images = image ? [{ url: getMediaUrl(image) }] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: BRAND_CONFIG.name,
      type: 'website',
      ...(images ? { images } : {}),
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
      index: true,
      follow: true,
    },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const stores = event.stores || [];

  return (
    <>
      <BreadcrumbJsonLd
        items={buildBreadcrumbEntries([
          { label: 'Home', path: '/' },
          { label: event.name, path: `/events/${slug}` },
        ])}
      />
      {stores.length > 0 && (
        <ItemListJsonLd
          name={`${event.name} Stores`}
          items={stores.map((s) => ({
            name: s.name,
            url: `/store/${s.slug}`,
          }))}
        />
      )}

      <Container className="py-8">
        <Breadcrumbs
          items={[{ label: event.name }]}
          className="mb-6 text-gray-700 [&_a:hover]:text-gray-900 [&_span:not(:last-child)]:text-gray-400"
        />

        {event.heroImage?.url && (
          <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden bg-gray-100 mb-8">
            <Image
              src={getMediaUrl(event.heroImage.url)}
              alt={event.heroImage.alternativeText || event.name}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          </div>
        )}

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {event.name}
        </h1>

        {event.shortDescription && (
          <p className="text-lg text-gray-600 mb-8">{event.shortDescription}</p>
        )}

        {stores.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Featured {event.name} Stores
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map((store) => (
                <EventStoreCard key={store.documentId || store.id} store={store} />
              ))}
            </div>
          </section>
        )}

        {event.content && (
          <section className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
            <BlogContent content={event.content} />
          </section>
        )}
      </Container>
    </>
  );
}
