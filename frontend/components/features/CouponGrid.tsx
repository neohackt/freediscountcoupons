import { HomepageCouponCard } from './HomepageCouponCard';
import type { Coupon } from '@/types';

interface CouponGridProps {
  coupons: Coupon[];
}

export function CouponGrid({ coupons }: CouponGridProps) {
  if (coupons.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No coupons available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {coupons.map((coupon) => (
        <HomepageCouponCard key={coupon.documentId || coupon.id} coupon={coupon} />
      ))}
    </div>
  );
}