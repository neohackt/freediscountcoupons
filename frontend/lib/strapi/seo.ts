import { SITE_URL } from "./constants";
import { getSeoImage, buildJsonLdLogo, buildOgImage } from "./media";
import type { Store, Coupon, Category } from "@/types";
import type { BlogPost } from "@/types/blog";

export interface JsonLdData {
    "@context": string;
    "@type": string;
    [key: string]: unknown;
}

export function buildStoreJsonLd(store: Store, coupons: Coupon[]): JsonLdData[] {
    const activeCoupons = coupons.filter((c) => !c.is_expired);

    const storeData: JsonLdData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: store.name,
        url: `${SITE_URL}/store/${store.slug}`,
        ...(store.description ? { description: store.description } : {}),
        ...(store.logo?.url ? { logo: buildJsonLdLogo(store) } : {}),
    };

    const itemList = activeCoupons.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${store.name} Coupons`,
            numberOfItems: activeCoupons.length,
            itemListElement: activeCoupons.slice(0, 20).map((coupon, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                    "@type": "Offer",
                    name: coupon.title,
                    ...(coupon.description ? { description: coupon.description } : {}),
                    ...(coupon.code ? { discountCode: coupon.code } : {}),
                    ...(coupon.discount_text ? { discount: coupon.discount_text } : {}),
                    url: `${SITE_URL}/store/${store.slug}`,
                    availability: coupon.is_expired
                        ? "https://schema.org/SoldOut"
                        : "https://schema.org/InStock",
                    validThrough: coupon.expires_at || undefined,
                    seller: {
                        "@type": "Organization",
                        name: "FreeDiscountCoupons",
                    },
                },
            })),
        }
        : null;

    return itemList ? [storeData, itemList] : [storeData];
}

export function buildCouponJsonLd(coupon: Coupon, store: Store): JsonLdData {
    return {
        "@context": "https://schema.org",
        "@type": "Offer",
        name: coupon.title,
        description: coupon.description,
        ...(coupon.code ? { discountCode: coupon.code } : {}),
        ...(coupon.discount_text ? { discount: coupon.discount_text } : {}),
        url: `${SITE_URL}/store/${store.slug}`,
        availability: coupon.is_expired
            ? "https://schema.org/SoldOut"
            : "https://schema.org/InStock",
        validThrough: coupon.expires_at,
        seller: {
            "@type": "Organization",
            name: store.name,
            url: `${SITE_URL}/store/${store.slug}`,
            ...(store.logo?.url ? { logo: buildJsonLdLogo(store) } : {}),
        },
    };
}

export function buildBlogJsonLd(post: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage?: { url: string } | null;
    og_image?: { url: string } | null;
    category?: { name: string } | null;
    author?: { name: string } | null;
    publishedAt: string;
    updatedAt: string;
    seo_title?: string;
    seo_description?: string;
    noindex: boolean;
}): JsonLdData {
    const image = buildOgImage(post);

    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.seo_title || post.title,
        description: post.seo_description || post.excerpt,
        image: image ? [image] : undefined,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author: post.author
            ? { "@type": "Person", name: post.author.name }
            : undefined,
        publisher: {
            "@type": "Organization",
            name: "FreeDiscountCoupons",
            logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${SITE_URL}/blog/${post.slug}`,
        },
        ...(post.category ? { articleSection: post.category.name } : {}),
        keywords: post.title.split(" ").join(", "),
    };
}

export function buildCategoryJsonLd(category: Category): JsonLdData {
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${category.name} Coupons`,
        numberOfItems: 0,
        itemListElement: [],
    };
}

export function buildBreadcrumbJsonLd(items: { label: string; path: string }[]): JsonLdData {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            item: `${SITE_URL}${item.path}`,
        })),
    };
}

export function buildOrganizationJsonLd(): JsonLdData {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "FreeDiscountCoupons",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        sameAs: [
            "https://facebook.com/freediscountcoupons",
            "https://twitter.com/freediscountcoupons",
            "https://linkedin.com/company/freediscountcoupons",
        ],
    };
}

export function buildWebSiteJsonLd(): JsonLdData {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "FreeDiscountCoupons",
        url: SITE_URL,
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };
}