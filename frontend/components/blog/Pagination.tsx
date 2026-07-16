import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  pageCount: number;
  basePath?: string;
  category?: string;
  search?: string;
}

export default function Pagination({ currentPage, pageCount, basePath = '/blog', category, search }: PaginationProps) {
  if (pageCount <= 1) return null;

  function buildUrl(page: number) {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (category) params.set('category', category);
    if (search) params.set('q', search);
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  }

  const pages: (number | '...')[] = [];
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(pageCount - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < pageCount - 2) pages.push('...');
    pages.push(pageCount);
  }

  return (
    <nav aria-label="Blog pagination" className="flex items-center justify-center gap-1 mt-10">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          rel="prev"
        >
          Prev
        </Link>
      )}
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`dots-${idx}`} className="px-3 py-2 text-sm text-gray-400">...</span>
        ) : (
          <Link
            key={p}
            href={buildUrl(p)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              p === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
            }`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </Link>
        )
      )}
      {currentPage < pageCount && (
        <Link
          href={buildUrl(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          rel="next"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
