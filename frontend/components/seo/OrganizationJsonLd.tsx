import { JsonLd } from './JsonLd';
import { BRAND_CONFIG, SITE_URL } from '@/lib/constants';

export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_CONFIG.name,
    url: SITE_URL,
    description: BRAND_CONFIG.description,
  };

  return <JsonLd data={data} />;
}
