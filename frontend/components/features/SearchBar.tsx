'use client';

import React from 'react';
import { useAutocomplete } from '@/hooks/useSearch';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export default function SearchBar({ className = '', placeholder = 'Search stores, coupons, deals...' }: SearchBarProps) {
  const {
    query,
    setQuery,
    results,
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    isLoading,
    allItems,
    inputRef,
    containerRef,
    handleKeyDown,
  } = useAutocomplete();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const getIcon = (type: string) => {
    if (type === 'store') return '🏪';
    if (type === 'category') return '📂';
    return '🏷️';
  };

  const getSubtitle = (item: any) => {
    if (item.type === 'store') return 'Store';
    if (item.type === 'category') return 'Category';
    return item.store ? item.store.name : 'Coupon';
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-5 py-3 pr-12 rounded-xl border border-gray-300 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-shadow hover:shadow-md"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-listbox"
          aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          aria-label="Search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </button>
      </form>

      {isOpen && allItems.length > 0 && (
        <ul
          id="search-listbox"
          role="listbox"
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto"
        >
          {results.stores.length > 0 && (
            <li className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              Stores
            </li>
          )}
          {results.stores.slice(0, 4).map((item, idx) => (
            <li
              key={`store-${item.id}`}
              id={`search-option-${idx}`}
              role="option"
              aria-selected={activeIndex === idx}
              className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${
                activeIndex === idx ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => { window.location.href = `/store/${item.slug}`; }}
            >
              <span className="text-lg">{getIcon('store')}</span>
              <span className="flex-1 text-sm font-medium">{item.name}</span>
              <span className="text-xs text-gray-400">{getSubtitle({ type: 'store' })}</span>
            </li>
          ))}

          {results.coupons.length > 0 && (
            <li className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              Coupons
            </li>
          )}
          {results.coupons.slice(0, 4).map((item, idx) => {
            const globalIdx = results.stores.length + idx;
            return (
              <li
                key={`coupon-${item.id}`}
                id={`search-option-${globalIdx}`}
                role="option"
                aria-selected={activeIndex === globalIdx}
                className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${
                  activeIndex === globalIdx ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setActiveIndex(globalIdx)}
                onClick={() => { window.location.href = `/store/${item.store?.slug || ''}`; }}
              >
                <span className="text-lg">{getIcon('coupon')}</span>
                <span className="flex-1 text-sm font-medium">{item.title}</span>
                <span className="text-xs text-gray-400">{getSubtitle({ type: 'coupon', store: item.store })}</span>
              </li>
            );
          })}

          {results.categories.length > 0 && (
            <li className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              Categories
            </li>
          )}
          {results.categories.slice(0, 2).map((item, idx) => {
            const globalIdx = results.stores.length + results.coupons.length + idx;
            return (
              <li
                key={`cat-${item.id}`}
                id={`search-option-${globalIdx}`}
                role="option"
                aria-selected={activeIndex === globalIdx}
                className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${
                  activeIndex === globalIdx ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setActiveIndex(globalIdx)}
                onClick={() => { window.location.href = `/deals/${item.slug}`; }}
              >
                <span className="text-lg">{getIcon('category')}</span>
                <span className="flex-1 text-sm font-medium">{item.name}</span>
                <span className="text-xs text-gray-400">Category</span>
              </li>
            );
          })}

          {query.trim().length >= 2 && (
            <li className="border-t border-gray-100">
              <button
                onClick={() => { window.location.href = `/search?q=${encodeURIComponent(query.trim())}`; }}
                className="w-full px-4 py-3 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                View all results for &ldquo;{query}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}

      {isOpen && query.length >= 2 && allItems.length === 0 && !isLoading && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-sm text-gray-500">
          No matching coupons or stores found.
        </div>
      )}
    </div>
  );
}
