import { JsonLd } from './JsonLd';
import { SITE_URL } from '@/lib/constants';

export interface BreadcrumbEntry {
  name: string;
  url?: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbEntry[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    ...(item.url ? { item: item.url } : {}),
  }));

  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };

  return <JsonLd data={data} />;
}

export function buildBreadcrumbEntries(
  segments: Array<{ label: string; path?: string }>
): BreadcrumbEntry[] {
  return segments.map((seg) => ({
    name: seg.label,
    ...(seg.path ? { url: `${SITE_URL}${seg.path}` } : {}),
  }));
}
