import Link from 'next/link';
import { BRAND_CONFIG, API_CONFIG } from '@/lib/constants';

interface FooterStore {
  name: string;
  slug: string;
}

interface FooterCategory {
  name: string;
  slug: string;
}

async function getFooterStores(): Promise<FooterStore[]> {
  try {
    const response = await fetch(
      `${API_CONFIG.strapiUrl}/api/stores?filters[is_popular][$eq]=true&fields=name,slug&pagination[pageSize]=5&sort=name:asc`,
      { next: { revalidate: 86400 } }
    );
    const data = await response.json();
    return (data.data || []).map((s: { name: string; slug: string }) => ({ name: s.name, slug: s.slug }));
  } catch {
    return [];
  }
}

async function getFooterCategories(): Promise<FooterCategory[]> {
  try {
    const response = await fetch(
      `${API_CONFIG.strapiUrl}/api/categories?fields=name,slug&pagination[pageSize]=10&sort=name:asc`,
      { next: { revalidate: 86400 } }
    );
    const data = await response.json();
    return (data.data || []).map((c: { name: string; slug: string }) => ({ name: c.name, slug: c.slug }));
  } catch {
    return [];
  }
}

const companyLinks = [
  { name: 'About Us', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Use', href: '/terms' },
  { name: 'Affiliate Disclosure', href: '/affiliate-disclosure' },
  { name: 'Disclaimer', href: '/disclaimer' },
  { name: 'DMCA Policy', href: '/dmca' },
];

export async function Footer() {
  const [stores, categories] = await Promise.all([getFooterStores(), getFooterCategories()]);

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CD</span>
              </div>
              <span className="font-bold text-xl text-white">{BRAND_CONFIG.name}</span>
            </Link>
            <p className="text-gray-400 text-sm">
              {BRAND_CONFIG.description}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Popular Stores</h3>
            <ul className="space-y-2">
              {stores.length > 0 ? (
                stores.map((store) => (
                  <li key={store.slug}>
                    <Link href={`/store/${store.slug}`} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {store.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/store/amazon" className="text-gray-400 hover:text-white transition-colors text-sm">Amazon</Link></li>
                  <li><Link href="/store/ebay" className="text-gray-400 hover:text-white transition-colors text-sm">eBay</Link></li>
                  <li><Link href="/store/walmart" className="text-gray-400 hover:text-white transition-colors text-sm">Walmart</Link></li>
                  <li><Link href="/store/target" className="text-gray-400 hover:text-white transition-colors text-sm">Target</Link></li>
                </>
              )}
              <li>
                <Link href="/stores" className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
                  View all stores →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <li key={category.slug}>
                    <Link href={`/browse/${category.slug}`} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/browse/electronics" className="text-gray-400 hover:text-white transition-colors text-sm">Electronics</Link></li>
                  <li><Link href="/browse/clothing" className="text-gray-400 hover:text-white transition-colors text-sm">Clothing</Link></li>
                  <li><Link href="/browse/beauty" className="text-gray-400 hover:text-white transition-colors text-sm">Beauty</Link></li>
                  <li><Link href="/browse/home-and-garden" className="text-gray-400 hover:text-white transition-colors text-sm">Home &amp; Garden</Link></li>
                </>
              )}
              <li>
                <Link href="/browse" className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
                  View all categories →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <p className="text-gray-400 text-sm font-bold mb-2">
            Affiliate Disclosure: This website may earn commissions from qualifying purchases through affiliate links, at no extra cost to you.
          </p>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} {BRAND_CONFIG.name}. All rights reserved. | Designed &amp; Developed by Whiz Adsbay LLP
          </p>
        </div>
      </div>
    </footer>
  );
}
