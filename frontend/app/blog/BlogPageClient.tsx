'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BlogHero from '@/components/blog/BlogHero';
import FeaturedPost from '@/components/blog/FeaturedPost';
import CategoryFilter from '@/components/blog/CategoryFilter';
import BlogGrid from '@/components/blog/BlogGrid';
import BlogSidebar from '@/components/blog/BlogSidebar';
import Pagination from '@/components/blog/Pagination';
import type { BlogPost, BlogCategory } from '@/types/blog';

interface BlogPageClientProps {
  initialPosts: BlogPost[];
  featuredPost: BlogPost | null;
  categories: BlogCategory[];
  trendingPosts: BlogPost[];
  currentPage: number;
  pageCount: number;
  total: number;
  initialCategory?: string;
  initialSearch?: string;
}

export default function BlogPageClient({
  initialPosts,
  featuredPost,
  categories,
  trendingPosts,
  currentPage,
  pageCount,
  total,
  initialCategory,
  initialSearch,
}: BlogPageClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch || '');

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`/blog?${params.toString()}`);
  }, [router]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    updateParam('q', q);
  }, [updateParam]);

  const handleCategoryChange = useCallback((slug: string) => {
    updateParam('category', slug);
  }, [updateParam]);

  const postsToShow = search
    ? initialPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.excerpt.toLowerCase().includes(search.toLowerCase())
      )
    : initialPosts;

  return (
    <main className="min-h-screen bg-gray-50">
      <BlogHero initialSearch={search} onSearch={handleSearch} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {featuredPost && !search && !initialCategory && currentPage === 1 && (
          <div className="mb-10">
            <FeaturedPost post={featuredPost} />
          </div>
        )}

        <CategoryFilter
          categories={categories}
          activeCategory={initialCategory}
          onCategoryChange={handleCategoryChange}
        />

        {search && (
          <p className="text-sm text-gray-500 mb-4">
            {total} result{total !== 1 ? 's' : ''} for &ldquo;<span className="font-semibold text-gray-900">{search}</span>&rdquo;
          </p>
        )}

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          <div>
            <BlogGrid posts={postsToShow} />
            <Pagination
              currentPage={currentPage}
              pageCount={pageCount}
              category={initialCategory}
              search={search}
            />
          </div>
          <BlogSidebar trendingPosts={trendingPosts} categories={categories} />
        </div>
      </div>
    </main>
  );
}
