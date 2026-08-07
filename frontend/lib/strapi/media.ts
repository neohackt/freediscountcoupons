import { STRAPI_URL } from "./config";
import type { Store, Category, Coupon } from "@/types";
import type { BlogPost, BlogAuthor } from "@/types/blog";

export interface StrapiMedia {
    url: string;
    width?: number;
    height?: number;
    alternativeText?: string;
    mime?: string;
}

function isAbsoluteUrl(url: string): boolean {
    return url.startsWith("http://") || url.startsWith("https://");
}

export function getMediaUrl(url?: string | null): string {
    if (!url) return "";
    if (isAbsoluteUrl(url)) return url;
    return `${STRAPI_URL}${url}`;
}

export function getStoreLogo(
    store: { logo?: StrapiMedia | null; website_url?: string; name?: string },
    size = 80
): string {
    if (store.logo?.url) return getMediaUrl(store.logo.url);

    if (store.website_url) {
        const domain = store.website_url
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .split("/")[0]
            .toLowerCase();
        return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE&size=${size}&url=http://${domain}`;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name || "Store")}&size=${size}&background=2563eb&color=fff`;
}

export function getCategoryImage(
    category: { icon?: string; og_image?: StrapiMedia | null },
    size = 120
): string {
    if (category.og_image?.url) return getMediaUrl(category.og_image.url);
    return category.icon || "📂";
}

export function getBlogImage(
    post: { featuredImage?: StrapiMedia | null; og_image?: StrapiMedia | null },
    size = 600
): string {
    if (post.og_image?.url) return getMediaUrl(post.og_image.url);
    if (post.featuredImage?.url) return getMediaUrl(post.featuredImage.url);
    return "";
}

export function getAuthorAvatar(
    author: { avatar?: StrapiMedia | null; name?: string },
    size = 80
): string {
    if (author.avatar?.url) return getMediaUrl(author.avatar.url);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || "Author")}&size=${size}&background=2563eb&color=fff`;
}

export function getCouponImage(
    coupon: { image?: StrapiMedia | null; store?: { logo?: StrapiMedia | null } },
    size = 120
): string {
    if (coupon.image?.url) return getMediaUrl(coupon.image.url);
    if (coupon.store?.logo?.url) return getMediaUrl(coupon.store.logo.url);
    return "";
}

export function getSeoImage(
    obj: { og_image?: StrapiMedia | null; featuredImage?: StrapiMedia | null },
    fallback?: string
): string {
    if (obj.og_image?.url) return getMediaUrl(obj.og_image.url);
    if (obj.featuredImage?.url) return getMediaUrl(obj.featuredImage.url);
    return fallback || "";
}

export function buildJsonLdLogo(store: { logo?: StrapiMedia | null }): string | undefined {
    return store.logo?.url ? getMediaUrl(store.logo.url) : undefined;
}

export function buildOgImage(obj: { og_image?: StrapiMedia | null; featuredImage?: StrapiMedia | null }): string | undefined {
    const url = getSeoImage(obj);
    return url || undefined;
}