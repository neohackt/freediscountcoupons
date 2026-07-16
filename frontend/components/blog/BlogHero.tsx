'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface BlogHeroProps {
  initialSearch?: string;
  onSearch: (query: string) => void;
}

export default function BlogHero({ initialSearch = '', onSearch }: BlogHeroProps) {
  const [query, setQuery] = useState(initialSearch);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(value), 300);
  }, [onSearch]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Savings Blog & Shopping Guides</h1>
        <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
          Expert shopping guides, coupon tips, deal alerts, and money-saving strategies.
        </p>
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Search articles..."
              className="w-full px-5 py-3 pr-12 rounded-xl border border-transparent bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-white shadow-sm"
              aria-label="Search blog articles"
            />
            <button
              type="button"
              onClick={() => onSearch(query)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              aria-label="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
