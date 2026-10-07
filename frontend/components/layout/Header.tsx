import Link from 'next/link';
import Image from 'next/image';
import { MobileMenu } from './MobileMenu';
import { EventsDropdown } from '@/components/features/EventsDropdown';
import { STRAPI_URL } from '@/lib/strapi';
import type { EventNavItem } from '@/types/event';

const navigation = [
  { name: 'Stores', href: '/stores' },
  { name: 'Categories', href: '/browse' },
  { name: 'Blog', href: '/blog' },
];

async function getActiveEvents(): Promise<EventNavItem[]> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/events/active`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.data || []) as EventNavItem[];
  } catch {
    return [];
  }
}

export async function Header() {
  const events = await getActiveEvents();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/FDC-01.png"
                alt="FreeDiscountCoupons"
                width={150}
                height={40}
                className="h-10 w-auto"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <EventsDropdown events={events} />
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <MobileMenu events={events} />
          </div>
        </div>
      </div>
    </header>
  );
}
