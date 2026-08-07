import type { StrapiRequestParams } from "@/types";

export function buildStoreQuery(populate?: string[]): StrapiRequestParams {
    return {
        populate: populate ?? ["logo", "categories", "coupons"],
        sort: "name:asc",
    };
}

export function buildCouponQuery(populate?: string[]): StrapiRequestParams {
    return {
        populate: populate ?? ["store", "store.logo", "categories"],
        sort: "createdAt:desc",
        filters: { is_expired: { $ne: true } },
    };
}

export function buildCategoryQuery(populate?: string[]): StrapiRequestParams {
    return {
        populate: populate ?? ["stores", "coupons"],
        sort: "name:asc",
    };
}

export function buildBlogQuery(populate?: string[]): StrapiRequestParams {
    return {
        populate: populate ?? ["featuredImage", "category", "author", "author.avatar", "og_image", "relatedStores", "relatedStores.logo"],
        sort: "publishedAt:desc",
        filters: { publishedAt: { $notNull: true } },
    };
}

export function buildSearchQuery(q: string): StrapiRequestParams {
    return {
        filters: {
            $or: [
                { title: { $containsi: q } },
                { code: { $containsi: q } },
            ],
        },
        populate: ["store", "store.logo", "categories"],
        sort: "createdAt:desc",
    };
}

export function buildSitemapQuery(): StrapiRequestParams {
    return {
        fields: ["slug", "updatedAt"],
        populate: ["logo"],
        pagination: { pageSize: 100 },
    };
}

export function buildFooterQuery(): StrapiRequestParams {
    return {
        populate: ["logo"],
        pagination: { pageSize: 10 },
        sort: "name:asc",
    };
}

export function buildHomepageQuery(): StrapiRequestParams {
    return {
        populate: {
            logo: { fields: ["url"] },
            coupons: {
                populate: ["store", "store.logo", "categories"],
                filters: { is_expired: { $ne: true } },
            },
        },
        pagination: { pageSize: 100 },
    };
}

export function buildSimilarStoresQuery(slug: string): StrapiRequestParams {
    return {
        filters: {
            slug: { $ne: slug },
            categories: { slug: { $in: [slug] } },
        },
        populate: ["logo"],
        pagination: { pageSize: 10 },
    };
}