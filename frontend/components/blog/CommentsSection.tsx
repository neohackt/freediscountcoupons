export default function CommentsSection() {
  if (process.env.NEXT_PUBLIC_COMMENTS_ENABLED !== 'true') return null;

  return (
    <section className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Comments</h2>
      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
        <p>Comments coming soon. Stay tuned!</p>
      </div>
    </section>
  );
}
