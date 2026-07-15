import { JsonLd } from './JsonLd';
import { SITE_URL } from '@/lib/constants';

interface ItemListEntry {
  name: string;
  url: string;
  description?: string;
}

interface ItemListJsonLdProps {
  name: string;
  items: ItemListEntry[];
}

export function ItemListJsonLd({ name, items }: ItemListJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
      name: item.name,
      ...(item.description ? { description: item.description } : {}),
    })),
  };

  return <JsonLd data={data} />;
}
