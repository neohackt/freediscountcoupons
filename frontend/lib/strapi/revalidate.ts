const REVALIDATE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://freediscountcoupons.com";
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET ?? "your-secret-key";

interface RevalidationPayload {
    paths: string[];
    tags: string[];
}

interface RevalidationResult {
    success: boolean;
    revalidated: string[];
    failed?: { path: string; error: string }[];
    message?: string;
}

export async function triggerRevalidation(
    paths: string[] = [],
    tags: string[] = []
): Promise<RevalidationResult> {
    const uniquePaths = [...new Set(paths)];
    const uniqueTags = [...new Set(tags)];

    if (uniquePaths.length === 0 && uniqueTags.length === 0) {
        return { success: true, revalidated: [] };
    }

    try {
        const response = await fetch(`${REVALIDATE_URL}/api/revalidate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-revalidate-secret": REVALIDATE_SECRET,
            },
            body: JSON.stringify({ paths: uniquePaths, tags: uniqueTags }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[Revalidation] Failed:", data.message || data.error);
            return {
                success: false,
                revalidated: [],
                message: data.message || "Revalidation failed",
            };
        }

        return {
            success: data.success ?? true,
            revalidated: data.revalidated ?? [],
            failed: data.failed,
            message: data.message,
        };
    } catch (error) {
        console.error("[Revalidation] Error:", error);
        return {
            success: false,
            revalidated: [],
            failed: uniquePaths.map((p) => ({ path: p, error: error instanceof Error ? error.message : "Unknown error" })),
            message: "Revalidation request failed",
        };
    }
}

export async function revalidateStore(slug: string): Promise<RevalidationResult> {
    return triggerRevalidation(
        ["/", "/stores", "/browse", `/store/${slug}`, "/sitemap.xml"],
        ["stores", "homepage"]
    );
}

export async function revalidateCoupon(storeSlug: string, couponSlug?: string): Promise<RevalidationResult> {
    return triggerRevalidation(
        ["/", "/stores", "/browse", `/store/${storeSlug}`, couponSlug ? `/coupon/${couponSlug}` : "", "/sitemap.xml"].filter(Boolean),
        ["coupons", "stores", "homepage"]
    );
}

export async function revalidateCategory(slug: string): Promise<RevalidationResult> {
    return triggerRevalidation(
        ["/browse", `/browse/${slug}`, "/stores", "/sitemap.xml"],
        ["categories", "stores", "homepage"]
    );
}

export async function revalidateBlog(slug: string): Promise<RevalidationResult> {
    return triggerRevalidation(
        ["/blog", `/blog/${slug}`, "/sitemap.xml"],
        ["blog", "homepage"]
    );
}

export async function revalidateHomepage(): Promise<RevalidationResult> {
    return triggerRevalidation(["/"], ["homepage"]);
}

export async function revalidateSitemap(): Promise<RevalidationResult> {
    return triggerRevalidation(["/sitemap.xml"], ["sitemap"]);
}