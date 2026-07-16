import Link from 'next/link';

export default function BlogPostNotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Article not found</h2>
        <p className="text-gray-500 mb-6">The article you&rsquo;re looking for doesn&rsquo;t exist or has been removed.</p>
        <Link
          href="/blog"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Browse All Articles
        </Link>
      </div>
    </main>
  );
}
