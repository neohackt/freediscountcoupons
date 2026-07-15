interface RichTextRendererProps {
  content: string;
  className?: string;
}

export function RichTextRenderer({ content, className }: RichTextRendererProps) {
  if (!content) return null;

  return (
    <div
      className={`prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-table:border-collapse prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-gray-200 prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-gray-200 prose-blockquote:border-l-blue-500 prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
