export default function BlogLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="h-12 w-96 mx-auto bg-white/20 rounded-lg animate-pulse mb-4" />
          <div className="h-6 w-[500px] mx-auto bg-white/20 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-12 w-full bg-white rounded-xl animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-[16/10] bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-5 w-full bg-gray-200 rounded" />
                <div className="h-5 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
