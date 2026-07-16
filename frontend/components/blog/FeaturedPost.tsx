import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost } from '@/types/blog';

interface FeaturedPostProps {
  post: BlogPost;
}

export default function FeaturedPost({ post }: FeaturedPostProps) {
  const imageUrl = post.featuredImage?.url || post.og_image?.url;
  const categorySlug = post.category?.slug;
  const categoryName = post.category?.name;

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="grid lg:grid-cols-2 gap-0">
        {imageUrl && (
          <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full">
            <Image
              src={imageUrl}
              alt={post.featuredImage?.alternativeText || post.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        )}
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            {categoryName && (
              <Link
                href={`/blog?category=${categorySlug}`}
                className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
              >
                {categoryName}
              </Link>
            )}
            <span className="text-xs text-gray-400">Featured</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h2>
          <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            {post.author?.name && <span>{post.author.name}</span>}
            <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>{post.readingTime} min read</span>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            Read More
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
