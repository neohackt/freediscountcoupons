import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/strapi';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_URL}/search`,
  },
  openGraph: {
    url: `${SITE_URL}/search`,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
