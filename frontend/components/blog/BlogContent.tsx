import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ContentBlock {
  type: string;
  children?: ContentBlock[];
  text?: string;
  level?: number;
  url?: string;
  alt?: string;
  caption?: string;
  language?: string;
  ordered?: boolean;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function renderInline(children: ContentBlock[] | undefined): React.ReactNode {
  if (!children) return null;
  return children.map((child, i) => {
    if (child.type === 'text') {
      let text: React.ReactNode = child.text || '';
      if (child.text?.includes('**')) {
        const parts = child.text.split(/(\*\*[^*]+\*\*)/g);
        text = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
      }
      return <React.Fragment key={i}>{text}</React.Fragment>;
    }
    if (child.type === 'link') {
      return (
        <Link key={i} href={child.url || '#'} className="text-blue-600 hover:underline">
          {renderInline(child.children)}
        </Link>
      );
    }
    return <React.Fragment key={i}>{renderInline(child.children)}</React.Fragment>;
  });
}

function renderBlock(block: ContentBlock, index: number): React.ReactNode {
  switch (block.type) {
    case 'heading': {
      const id = block.children?.map((c) => c.text || '').join('') || '';
      const slug = slugify(id);
      const Tag = `h${block.level || 2}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return (
        <Tag key={index} id={slug} className={`font-bold text-gray-900 mt-8 mb-4 ${
          block.level === 2 ? 'text-2xl' : block.level === 3 ? 'text-xl' : 'text-lg'
        }`}>
          {renderInline(block.children)}
        </Tag>
      );
    }
    case 'paragraph':
      return (
        <p key={index} className="text-gray-700 leading-relaxed mb-4">
          {renderInline(block.children)}
        </p>
      );
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag key={index} className={`${block.ordered ? 'list-decimal' : 'list-disc'} pl-6 mb-4 space-y-1 text-gray-700`}>
          {block.children?.map((child, i) => (
            <li key={i}>{renderInline(child.children)}</li>
          ))}
        </Tag>
      );
    }
    case 'quote':
      return (
        <blockquote key={index} className="border-l-4 border-blue-600 pl-4 py-2 my-6 bg-blue-50 rounded-r-lg">
          <p className="text-gray-700 italic">{renderInline(block.children)}</p>
        </blockquote>
      );
    case 'code':
      return (
        <pre key={index} className="bg-gray-900 text-gray-100 rounded-xl p-4 mb-6 overflow-x-auto text-sm">
          <code>{block.children?.map((c) => c.text || '').join('')}</code>
        </pre>
      );
    case 'image':
      return (
        <figure key={index} className="my-6">
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={block.url || ''}
              alt={block.alt || ''}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 750px"
            />
          </div>
          {block.caption && (
            <figcaption className="text-center text-sm text-gray-500 mt-2">{block.caption}</figcaption>
          )}
        </figure>
      );
    default:
      return null;
  }
}

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  let blocks: ContentBlock[];
  try {
    blocks = typeof content === 'string' ? JSON.parse(content) : (content as unknown as ContentBlock[]);
  } catch {
    return (
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  if (!Array.isArray(blocks)) {
    return (
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: String(content) }}
      />
    );
  }

  return (
    <div className="max-w-[750px] mx-auto">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

export function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  let blocks: ContentBlock[];
  try {
    blocks = typeof content === 'string' ? JSON.parse(content) : (content as unknown as ContentBlock[]);
  } catch {
    return [];
  }
  if (!Array.isArray(blocks)) return [];

  const headings: { id: string; text: string; level: number }[] = [];
  for (const block of blocks) {
    if (block.type === 'heading' && block.level && block.level >= 2 && block.level <= 3) {
      const text = block.children?.map((c) => c.text || '').join('') || '';
      headings.push({ id: slugify(text), text, level: block.level });
    }
  }
  return headings;
}
