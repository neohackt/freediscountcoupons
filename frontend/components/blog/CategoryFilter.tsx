'use client';

import React from 'react';
import type { BlogCategory } from '@/types/blog';

interface CategoryFilterProps {
  categories: BlogCategory[];
  activeCategory?: string;
  onCategoryChange: (slug: string) => void;
}

export default function CategoryFilter({ categories, activeCategory, onCategoryChange }: CategoryFilterProps) {
  const allCategories = [{ slug: '', name: 'All', postCount: 0 } as BlogCategory, ...categories];

  return (
    <nav aria-label="Blog categories" className="mb-8">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist">
        {allCategories.map((cat) => {
          const isActive = (cat.slug || '') === (activeCategory || '');
          return (
            <button
              key={cat.slug || 'all'}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onCategoryChange(cat.slug)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
              {cat.postCount !== undefined && cat.postCount > 0 && (
                <span className="ml-1 text-xs opacity-70">({cat.postCount})</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
