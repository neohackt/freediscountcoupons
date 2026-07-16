import Link from 'next/link';
import type { BlogPost, BlogCategory } from '@/types/blog';

interface BlogSidebarProps {
  trendingPosts: BlogPost[];
  categories: BlogCategory[];
}

function TrendingPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-lg">🔥</span> Trending Articles
      </h3>
      <ul className="space-y-4">
        {posts.map((post, idx) => (
          <li key={post.id} className="flex gap-3">
            <span className="text-2xl font-bold text-blue-100 flex-shrink-0 w-8">{String(idx + 1).padStart(2, '0')}</span>
            <div>
              <Link href={`/blog/${post.slug}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                {post.title}
              </Link>
              <span className="text-xs text-gray-400">{post.readingTime} min read</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PopularCategories({ categories }: { categories: BlogCategory[] }) {
  const withCount = categories.filter((c) => c.postCount && c.postCount > 0);
  if (withCount.length === 0) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-lg">📂</span> Popular Categories
      </h3>
      <ul className="space-y-2">
        {withCount.map((cat) => (
          <li key={cat.slug}>
            <Link href={`/blog?category=${cat.slug}`} className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600 transition-colors">
              <span>{cat.name}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{cat.postCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewsletterSignup() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
      <h3 className="font-bold mb-2">Get Weekly Deals & Coupons</h3>
      <p className="text-blue-100 text-sm mb-4">Subscribe to our newsletter for the latest savings.</p>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
        <input
          type="email"
          placeholder="Your email address"
          className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-white"
        />
        <button
          type="submit"
          className="w-full px-4 py-2 bg-white text-blue-700 font-semibold rounded-lg text-sm hover:bg-blue-50 transition-colors"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}

function CurrentEvents() {
  const events = [
    { name: 'Prime Day Deals', emoji: '📦' },
    { name: 'Black Friday', emoji: '🖤' },
    { name: 'Cyber Monday', emoji: '💻' },
    { name: 'Back to School', emoji: '🎓' },
    { name: 'Summer Sale', emoji: '☀️' },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-lg">🛒</span> Shopping Events
      </h3>
      <ul className="space-y-2">
        {events.map((event) => (
          <li key={event.name} className="flex items-center gap-2 text-sm text-gray-700">
            <span>{event.emoji}</span>
            <span>{event.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BlogSidebar({ trendingPosts, categories }: BlogSidebarProps) {
  return (
    <aside className="hidden lg:block space-y-6">
      <TrendingPosts posts={trendingPosts} />
      <PopularCategories categories={categories} />
      <NewsletterSignup />
      <CurrentEvents />
    </aside>
  );
}
