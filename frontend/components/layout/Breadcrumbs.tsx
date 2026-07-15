import Link from 'next/link';

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
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2 text-sm text-gray-500">
        <li>
          <Link href="/" className="hover:text-gray-700 transition-colors">
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span>/</span>
            {item.href ? (
              <Link href={item.href} className="hover:text-gray-700 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
