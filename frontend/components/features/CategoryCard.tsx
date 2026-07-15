import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

const categoryIcons: Record<string, string> = {
  electronics: '🔌',
  clothing: '👕',
  beauty: '💄',
  health: '💊',
  home: '🏠',
  automotive: '🚗',
  sports: '⚽',
  travel: '✈️',
  food: '🍔',
  books: '📚',
  default: '📦',
};

export function CategoryCard({ category }: CategoryCardProps) {
  const icon = category.icon || categoryIcons[category.slug] || categoryIcons.default;

  return (
    <Link href={`/browse/${category.slug}`}>
      <Card className="hover:shadow-md transition-all hover:border-blue-200 group cursor-pointer p-6 text-center">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {category.description}
          </p>
        )}
      </Card>
    </Link>
  );
}