import { JsonLd } from './JsonLd';
import { BRAND_CONFIG, SITE_URL } from '@/lib/constants';

export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND_CONFIG.name,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return <JsonLd data={data} />;
}
