import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPostBySlug, getRelatedPosts, getBlogCategories } from '@/lib/blog';
import { SITE_URL } from '@/lib/constants';
import BlogPageClient from './BlogPageClient';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt;
  const imageUrl = post.og_image?.url || post.featuredImage?.url;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    robots: { index: !post.noindex, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      images: imageUrl ? [{ url: imageUrl, alt: post.featuredImage?.alternativeText || post.title }] : [],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const categories = await getBlogCategories();
  const categoryId = post.category?.id || null;
  const relatedPosts = await getRelatedPosts(post.id, categoryId, 6);
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const siteConfig = { organizationName: 'FreeDiscountCoupons', organizationLogo: `${SITE_URL}/logo.png`, siteUrl: SITE_URL };

  const faqItems = post.faqItems || [];

  return (
    <BlogPageClient
      post={post}
      relatedPosts={relatedPosts}
      categories={categories}
      canonicalUrl={canonicalUrl}
      siteConfig={siteConfig}
      faqItems={faqItems}
    />
  );
}
