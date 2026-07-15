import { CategoryCard } from './CategoryCard';
import type { Category } from '@/types';

interface CategoryGridProps {
  categories: Category[];
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function CategoryGrid({ categories, columns = 4 }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No categories available</p>
      </div>
    );
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {categories.map((category) => (
        <CategoryCard key={category.documentId || category.id} category={category} />
      ))}
    </div>
  );
}