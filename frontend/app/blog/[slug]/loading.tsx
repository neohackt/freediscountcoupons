export default function BlogPostLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-4 w-64 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="max-w-[750px] mx-auto">
          <div className="h-6 w-24 bg-blue-100 rounded-full mb-4 animate-pulse" />
          <div className="h-12 w-full bg-gray-200 rounded-lg mb-4 animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded mb-8 animate-pulse" />
          <div className="aspect-[16/9] bg-gray-200 rounded-2xl mb-10 animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${85 + Math.random() * 15}%` }} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
