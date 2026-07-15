'use client';

import { useState } from 'react';
import Link from 'next/link';

const navigation = [
  { name: 'Stores', href: '/stores' },
  { name: 'Categories', href: '/browse' },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-50">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
