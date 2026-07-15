import { cn } from '@/lib/utils';

interface BrandStatsProps {
  totalOffers: number;
  verifiedCoupons: number;
  usedToday: number;
  bestDiscount: string;
  className?: string;
}

export function BrandStats({ totalOffers, verifiedCoupons, usedToday, bestDiscount, className }: BrandStatsProps) {
  const stats = [
    {
      label: 'Total Offers',
      value: totalOffers,
      icon: 'grid',
    },
    {
      label: 'Verified Coupons',
      value: verifiedCoupons,
      icon: 'check',
    },
    {
      label: 'Used Today',
      value: usedToday,
      icon: 'eye',
    },
    {
      label: 'Best Discount',
      value: bestDiscount,
      icon: 'tag',
    },
  ];

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-5', className)}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">BRAND COUPON STATS</h3>
      <ul className="space-y-3">
        {stats.map((stat) => (
          <li key={stat.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', getIconBg(stat.icon))}>
                {getIcon(stat.icon)}
              </div>
              <span className="text-sm text-gray-700">{stat.label}</span>
            </div>
            <span className="font-bold text-gray-900">{stat.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getIcon(type: string) {
  switch (type) {
    case 'grid':
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'check':
      return (
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'eye':
      return (
        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    case 'tag':
      return (
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    default:
      return null;
  }
}

function getIconBg(type: string) {
  switch (type) {
    case 'grid':
      return 'bg-blue-100';
    case 'check':
      return 'bg-green-100';
    case 'eye':
      return 'bg-purple-100';
    case 'tag':
      return 'bg-orange-100';
    default:
      return 'bg-gray-100';
  }
}