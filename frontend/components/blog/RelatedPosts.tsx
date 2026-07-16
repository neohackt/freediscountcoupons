import Image from 'next/image';
import Link from 'next/link';
import type { RelatedPost } from '@/types/blog';

interface RelatedPostsProps {
  posts: RelatedPost[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <article key={post.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {post.featuredImage?.url && (
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={post.featuredImage.url}
                  alt={post.featuredImage.alternativeText || post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-4">
              {post.category && (
                <Link
                  href={`/blog?category=${post.category.slug}`}
                  className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {post.category.name}
                </Link>
              )}
              <h3 className="text-base font-bold text-gray-900 mt-2 line-clamp-2 hover:text-blue-600 transition-colors">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{post.readingTime} min read</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
