import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={cn("flex items-center gap-2 text-sm text-gray-500", className)}>
        <li>
          <Link href="/" className="text-current transition-colors">
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-current/60">/</span>
            {item.href ? (
              <Link href={item.href} className="text-current transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-current">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
