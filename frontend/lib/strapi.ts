import { API_CONFIG } from './constants';
import type { Store, Category, Coupon, StrapiResponse, StrapiRequestParams } from '@/types';

class StrapiClient {
  private baseUrl: string;
  private apiToken: string;

  constructor() {
    this.baseUrl = API_CONFIG.strapiUrl;
    this.apiToken = API_CONFIG.apiToken;
  }

  private buildFilterParams(params: StrapiRequestParams): URLSearchParams {
    const searchParams = new URLSearchParams();

    if (params.populate) {
      const populateValue = Array.isArray(params.populate)
        ? params.populate.join(',')
        : params.populate;
      searchParams.append('populate', populateValue);
    }

    if (params.filters) {
      this.processFilters(params.filters, searchParams);
    }

    if (params.sort) {
      const sortValue = Array.isArray(params.sort)
        ? params.sort.join(',')
        : params.sort;
      searchParams.append('sort', sortValue);
    }

    if (params.pagination) {
      searchParams.append('pagination[page]', String(params.pagination.page || 1));
      searchParams.append('pagination[pageSize]', String(params.pagination.pageSize || 25));
    }

    if (params.fields) {
      searchParams.append('fields', params.fields.join(','));
    }

    return searchParams;
  }

  private addFiltersToUrl(url: URL, filters: Record<string, unknown>, prefix = ''): void {
    for (const [key, value] of Object.entries(filters)) {
      const paramKey = prefix ? `${prefix}[${key}]` : `filters[${key}]`;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.addFiltersToUrl(url, value as Record<string, unknown>, paramKey);
      } else if (value !== undefined) {
        url.searchParams.append(paramKey, String(value));
      }
    }
  }

  private processFilters(filters: Record<string, unknown>, searchParams: URLSearchParams, prefix = ''): void {
    for (const [key, value] of Object.entries(filters)) {
      const paramKey = prefix ? `${prefix}[${key}]` : `filters[${key}]`;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.processFilters(value as Record<string, unknown>, searchParams, paramKey);
      } else if (value !== undefined) {
        searchParams.append(paramKey, String(value));
      }
    }
  }

  private async request<T>(endpoint: string, params?: StrapiRequestParams): Promise<T> {
    const url = new URL(`${this.baseUrl}/api${endpoint}`);

    if (params) {
      if (params.populate) {
        const populateValue = Array.isArray(params.populate)
          ? params.populate.join(',')
          : params.populate;
        url.searchParams.append('populate', populateValue);
      }

      if (params.filters) {
        this.addFiltersToUrl(url, params.filters);
      }

      if (params.sort) {
        const sortValue = Array.isArray(params.sort)
          ? params.sort.join(',')
          : params.sort;
        url.searchParams.append('sort', sortValue);
      }

      if (params.pagination) {
        url.searchParams.append('pagination[page]', String(params.pagination.page || 1));
        url.searchParams.append('pagination[pageSize]', String(params.pagination.pageSize || 25));
      }

      if (params.fields) {
        url.searchParams.append('fields', params.fields.join(','));
      }
    }

    console.log('API URL:', url.toString());

    console.log('API URL:', url.toString());

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getStores(params?: StrapiRequestParams): Promise<StrapiResponse<Store[]>> {
    return this.request<StrapiResponse<Store[]>>('/stores', {
      ...params,
      populate: params?.populate || ['logo', 'categories'],
    });
  }

  async getStoreBySlug(slug: string): Promise<StrapiResponse<Store>> {
    return this.request<StrapiResponse<Store>>('/stores', {
      filters: { slug },
      populate: ['logo', 'categories', 'coupons', 'coupons.categories'],
    });
  }

  async getPopularStores(limit = 20): Promise<StrapiResponse<Store[]>> {
    return this.request<StrapiResponse<Store[]>>('/stores', {
      populate: ['logo', 'categories'],
      pagination: { page: 1, pageSize: limit },
    });
  }

  async getFeaturedStores(limit = 20): Promise<StrapiResponse<Store[]>> {
    return this.request<StrapiResponse<Store[]>>('/stores', {
      filters: { is_featured: true },
      populate: ['logo', 'categories'],
      sort: ['name:asc'],
      pagination: { page: 1, pageSize: limit },
    });
  }

  async getCategories(params?: StrapiRequestParams): Promise<StrapiResponse<Category[]>> {
    return this.request<StrapiResponse<Category[]>>('/categories', {
      ...params,
      populate: params?.populate || [],
    });
  }

  async getCategoryBySlug(slug: string): Promise<StrapiResponse<Category>> {
    return this.request<StrapiResponse<Category>>('/categories', {
      filters: { slug },
      populate: ['stores', 'coupons'],
    });
  }

  async getCoupons(params?: StrapiRequestParams): Promise<StrapiResponse<Coupon[]>> {
    return this.request<StrapiResponse<Coupon[]>>('/coupons', {
      ...params,
      populate: params?.populate || ['store', 'store.logo', 'categories'],
    });
  }

  async getFeaturedCoupons(limit = 12): Promise<StrapiResponse<Coupon[]>> {
    return this.request<StrapiResponse<Coupon[]>>('/coupons', {
      filters: { 
        is_featured: true,
        is_expired: false,
      },
      populate: ['store', 'store.logo', 'categories'],
      sort: ['createdAt:desc'],
      pagination: { page: 1, pageSize: limit },
    });
  }

  async getTrendingCoupons(limit = 24): Promise<StrapiResponse<Coupon[]>> {
    return this.request<StrapiResponse<Coupon[]>>('/coupons', {
      filters: { is_expired: false },
      populate: ['store', 'store.logo', 'categories'],
      sort: ['times_used:desc', 'createdAt:desc'],
      pagination: { page: 1, pageSize: limit },
    });
  }

  async getCouponsByStore(storeSlug: string, limit = 50): Promise<StrapiResponse<Coupon[]>> {
    return this.request<StrapiResponse<Coupon[]>>('/coupons', {
      filters: {
        store: { slug: storeSlug },
        is_expired: false,
      },
      populate: ['store', 'store.logo', 'categories'],
      sort: ['is_featured:desc', 'createdAt:desc'],
      pagination: { page: 1, pageSize: limit },
    });
  }

  async getCouponsByCategory(categorySlug: string, limit = 50): Promise<StrapiResponse<Coupon[]>> {
    return this.request<StrapiResponse<Coupon[]>>('/coupons', {
      filters: {
        categories: { slug: categorySlug },
        is_expired: false,
      },
      populate: ['store', 'store.logo', 'categories'],
      sort: ['is_featured:desc', 'createdAt:desc'],
      pagination: { page: 1, pageSize: limit },
    });
  }

  async searchCoupons(query: string, limit = 24): Promise<StrapiResponse<Coupon[]>> {
    return this.request<StrapiResponse<Coupon[]>>('/coupons', {
      filters: {
        $or: [
          { title: { $containsi: query } },
          { description: { $containsi: query } },
          { code: { $containsi: query } },
          { store: { name: { $containsi: query } } },
        ],
        is_expired: false,
      },
      populate: ['store', 'store.logo', 'categories'],
      sort: ['is_featured:desc', 'times_used:desc'],
      pagination: { page: 1, pageSize: limit },
    });
  }

  async searchStores(query: string, limit = 20): Promise<StrapiResponse<Store[]>> {
    return this.request<StrapiResponse<Store[]>>('/stores', {
      filters: {
        $or: [
          { name: { $containsi: query } },
          { description: { $containsi: query } },
        ],
      },
      populate: ['logo', 'categories'],
      sort: ['is_popular:desc', 'name:asc'],
      pagination: { page: 1, pageSize: limit },
    });
  }
}

export const strapi = new StrapiClient();
export default strapi;