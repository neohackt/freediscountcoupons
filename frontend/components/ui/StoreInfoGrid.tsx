import { parseStoreSections } from '@/lib/parseStoreSections';
import { RichTextRenderer } from './RichTextRenderer';

interface StoreInfoGridProps {
  html: string;
}

export function StoreInfoGrid({ html }: StoreInfoGridProps) {
  if (!html) return null;

  const sections = parseStoreSections(html);
  if (sections.length === 0) return null;

  // Distribute sections: odd index → left, even → right
  const leftSections = sections.filter((_, i) => i % 2 === 0);
  const rightSections = sections.filter((_, i) => i % 2 === 1);

  const renderSection = (section: { title: string; content: string }, index: number) => (
    <div key={index} className="mb-6">
      {section.title && (
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 mb-2">
          {section.title}
        </h3>
      )}
      <div className="text-sm text-gray-600 leading-relaxed">
        <RichTextRenderer content={section.content} />
      </div>
    </div>
  );

  return (
    <div>
      {/* Two-column grid for sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          {leftSections.map((section, i) => renderSection(section, i * 2))}
        </div>
        <div>
          {rightSections.map((section, i) => renderSection(section, i * 2 + 1))}
        </div>
      </div>
    </div>
  );
}
