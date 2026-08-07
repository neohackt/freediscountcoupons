import { STRAPI_URL } from "./config";
import { SITE_URL } from "./constants";
import type { StrapiRequestParams } from "@/types";

interface FetchOptions extends RequestInit {
    params?: StrapiRequestParams;
    next?: NextFetchRequestConfig;
    cache?: RequestCache;
}

function buildQueryString(params: StrapiRequestParams): string {
    const searchParams = new URLSearchParams();

    if (params.populate) {
        if (Array.isArray(params.populate)) {
            params.populate.forEach((p, i) => searchParams.append(`populate[${i}]`, p));
        } else if (typeof params.populate === "object") {
            Object.entries(params.populate).forEach(([key, value]) => {
                if (typeof value === "object" && value !== null) {
                    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                        searchParams.append(`populate[${key}][${nestedKey}]`, String(nestedValue));
                    });
                } else {
                    searchParams.append(`populate[${key}]`, String(value));
                }
            });
        } else {
            searchParams.append("populate", params.populate);
        }
    }

    if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (typeof value === "object" && value !== null) {
                    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                        searchParams.append(`filters[${key}][${nestedKey}]`, String(nestedValue));
                    });
                } else {
                    searchParams.append(`filters[${key}]`, String(value));
                }
            }
        });
    }

    if (params.sort) {
        const sort = Array.isArray(params.sort) ? params.sort.join(",") : params.sort;
        searchParams.append("sort", sort);
    }

    if (params.pagination) {
        Object.entries(params.pagination).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(`pagination[${key}]`, String(value));
            }
        });
    }

    if (params.fields) {
        const fields = Array.isArray(params.fields) ? params.fields : [params.fields];
        fields.forEach((f, i) => searchParams.append(`fields[${i}]`, f));
    }

    return searchParams.toString();
}

export async function fetchFromStrapi<T>(
    path: string,
    options: FetchOptions = {}
): Promise<T | null> {
    const { params, next, cache, headers, ...fetchOptions } = options;

    const queryString = params ? buildQueryString(params) : "";
    const url = `${STRAPI_URL}${path}${queryString ? `?${queryString}` : ""}`;

    const defaultHeaders: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (process.env.STRAPI_API_TOKEN) {
        defaultHeaders["Authorization"] = `Bearer ${process.env.STRAPI_API_TOKEN}`;
    }

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers: { ...defaultHeaders, ...headers },
            next: next ?? { revalidate: 3600 },
            cache: cache ?? "no-store",
        });

        if (!response.ok) {
            console.error(`[Strapi] ${response.status} ${response.statusText} - ${url}`);
            return null;
        }

        return response.json() as Promise<T>;
    } catch (error) {
        console.error(`[Strapi] Fetch error: ${error instanceof Error ? error.message : error} - ${url}`);
        return null;
    }
}

export async function fetchFromStrapiWithAuth<T>(
    path: string,
    options: FetchOptions = {}
): Promise<T | null> {
    const token = process.env.STRAPI_API_TOKEN;
    if (!token) {
        console.warn("[Strapi] No API token available for authenticated request");
        return fetchFromStrapi<T>(path, options);
    }

    return fetchFromStrapi<T>(path, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });
}