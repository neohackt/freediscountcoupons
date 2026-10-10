import Link from 'next/link';
import type { AdjacentPost } from '@/types/blog';

interface PrevNextNavProps {
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
}

export default function PrevNextNav({ prev, next }: PrevNextNavProps) {
  if (!prev && !next) return null;

  return (
    <nav aria-label="More articles" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
      {prev && (
        <Link
          href={`/blog/${prev.slug}`}
          className="group block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all"
        >
          <span className="block text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            ← Previous Article
          </span>
          <span className="block font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {prev.title}
          </span>
        </Link>
      )}
      {next && (
        <Link
          href={`/blog/${next.slug}`}
          className={`group block bg-white rounded-xl border border-gray-100 p-5 text-right hover:shadow-md transition-all ${!prev ? 'sm:col-start-2' : ''}`}
        >
          <span className="block text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            Next Article →
          </span>
          <span className="block font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
