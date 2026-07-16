import type { Metadata } from 'next';
import { getBlogPosts, getFeaturedPost, getBlogCategories, getTrendingPosts } from '@/lib/blog';
import BlogPageClient from './BlogPageClient';

interface BlogPageProps {
  searchParams: Promise<{ page?: string; category?: string; q?: string }>;
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category;
  const q = params.q;

  let title = 'Blog - FreeDiscountCoupons';
  let description = 'Expert shopping guides, coupon tips, deal alerts, and money-saving strategies from FreeDiscountCoupons.com.';

  if (category) {
    const categories = await getBlogCategories();
    const cat = categories.find((c) => c.slug === category);
    if (cat) {
      title = `${cat.name} Blog - FreeDiscountCoupons`;
      description = cat.description || `Browse ${cat.name} articles and shopping guides.`;
    }
  }

  if (q) {
    title = `Search: ${q} - Blog - FreeDiscountCoupons`;
    description = `Search results for "${q}" on the FreeDiscountCoupons blog.`;
  }

  return {
    title,
    description,
    robots: { index: !q, follow: true },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const category = params.category || undefined;
  const search = params.q || undefined;

  const [postsResponse, featuredPost, categories, trendingPosts] = await Promise.all([
    getBlogPosts({ page, pageSize: 9, category, search }),
    page === 1 && !category && !search ? getFeaturedPost() : Promise.resolve(null),
    getBlogCategories(),
    getTrendingPosts(5),
  ]);

  const posts = postsResponse.data;
  const pagination = postsResponse.meta.pagination || { page: 1, pageSize: 9, pageCount: 0, total: 0 };

  return (
    <>
      <BlogPageClient
        initialPosts={posts}
        featuredPost={featuredPost}
        categories={categories}
        trendingPosts={trendingPosts}
        currentPage={page}
        pageCount={pagination.pageCount}
        total={pagination.total}
        initialCategory={category}
        initialSearch={search}
      />
    </>
  );
}
