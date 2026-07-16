import type { RelatedStore } from '@/types/blog';

interface CouponWidgetProps {
  store: RelatedStore;
}

export default function CouponWidget({ store }: CouponWidgetProps) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 my-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🏷️</span>
        <h3 className="font-bold text-gray-900">Available Coupons at {store.name}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Save money with the latest coupon codes and deals.
      </p>
      <a
        href={`/store/${store.slug}`}
        className="inline-flex items-center px-5 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors text-sm"
      >
        View All Coupons
        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}
