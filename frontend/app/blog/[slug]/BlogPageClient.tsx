'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogContent, { extractHeadings } from '@/components/blog/BlogContent';
import AuthorBox from '@/components/blog/AuthorBox';
import FAQSection from '@/components/blog/FAQSection';
import RelatedPosts from '@/components/blog/RelatedPosts';
import RelatedStores from '@/components/blog/RelatedStores';
import CouponWidget from '@/components/blog/CouponWidget';
import SocialShare from '@/components/blog/SocialShare';
import type { BlogPost, RelatedPost, BlogCategory, FAQItem, SiteConfig } from '@/types/blog';

const NewsletterWidget = dynamic(() => import('@/components/blog/NewsletterWidget'), { ssr: false });
const CommentsSection = dynamic(() => import('@/components/blog/CommentsSection'), { ssr: false });

interface BlogPostClientProps {
  post: BlogPost;
  relatedPosts: RelatedPost[];
  categories: BlogCategory[];
  canonicalUrl: string;
  siteConfig: SiteConfig;
  faqItems: FAQItem[];
}

export default function BlogPageClient({ post, relatedPosts, categories, canonicalUrl, siteConfig, faqItems }: BlogPostClientProps) {
  const headings = extractHeadings(post.content);
  const imageUrl = post.featuredImage?.url || post.og_image?.url;
  const categoryName = post.category?.name;
  const categorySlug = post.category?.slug;
  const showUpdated = post.updatedAt && post.publishedAt &&
    new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > 86400000;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: imageUrl,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.author ? {
      '@type': 'Person',
      name: post.author.name,
    } : undefined,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organizationName,
      logo: { '@type': 'ImageObject', url: siteConfig.organizationLogo },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteConfig.siteUrl}/blog` },
      ...(categoryName ? [{ '@type': 'ListItem', position: 3, name: categoryName, item: `${siteConfig.siteUrl}/blog?category=${categorySlug}` }] : []),
      { '@type': 'ListItem', position: categoryName ? 4 : 3, name: post.title },
    ],
  };

  const faqJsonLd = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 flex-wrap">
              <li><Link href="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
              <li>/</li>
              <li><Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link></li>
              {categoryName && (
                <>
                  <li>/</li>
                  <li><Link href={`/blog?category=${categorySlug}`} className="hover:text-blue-600 transition-colors">{categoryName}</Link></li>
                </>
              )}
              <li>/</li>
              <li className="text-gray-900 font-medium truncate max-w-[200px]">{post.title}</li>
            </ol>
          </nav>

          <article>
            <header className="max-w-[750px] mx-auto mb-8">
              {categoryName && (
                <Link
                  href={`/blog?category=${categorySlug}`}
                  className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors mb-4"
                >
                  {categoryName}
                </Link>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                {post.author?.name && <span className="font-medium text-gray-700">{post.author.name}</span>}
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </time>
                {showUpdated && (
                  <span>Updated {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                )}
                <span>{post.readingTime} min read</span>
              </div>
            </header>

            {imageUrl && (
              <div className="relative aspect-[16/9] max-w-[900px] mx-auto rounded-2xl overflow-hidden mb-10">
                <Image
                  src={imageUrl}
                  alt={post.featuredImage?.alternativeText || post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 900px"
                  priority
                />
              </div>
            )}

            <div className="grid lg:grid-cols-[1fr_280px] gap-10">
              <div>
                {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
                    <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-lg">💡</span> Key Takeaways
                    </h2>
                    <ul className="space-y-2">
                      {post.keyTakeaways.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-600 mt-0.5">✓</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <BlogContent content={post.content} />

                {post.relatedStores && post.relatedStores.length > 0 && (
                  <CouponWidget store={post.relatedStores[0]} />
                )}

                <SocialShare url={canonicalUrl} title={post.title} />

                {post.author && <div className="mt-8"><AuthorBox author={post.author} /></div>}

                <FAQSection items={faqItems} />

                <RelatedPosts posts={relatedPosts} />

                {post.relatedStores && post.relatedStores.length > 0 && (
                  <RelatedStores stores={post.relatedStores} />
                )}

                <div className="mt-8">
                  <NewsletterWidget />
                </div>

                <CommentsSection />
              </div>

              <div className="hidden lg:block">
                <TableOfContents headings={headings} />
              </div>
            </div>
          </article>
        </div>
      </main>
    </>
  );
}
