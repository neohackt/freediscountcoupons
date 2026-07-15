import Link from 'next/link';
import { Container } from '@/components/layout/Container';

export default function NotFound() {
  return (
    <Container className="py-16">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/stores"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Browse Stores
          </Link>
        </div>
      </div>
    </Container>
  );
}
