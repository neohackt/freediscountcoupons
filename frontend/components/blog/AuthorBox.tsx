import Image from 'next/image';
import type { BlogAuthor } from '@/types/blog';

interface AuthorBoxProps {
  author: BlogAuthor;
}

export default function AuthorBox({ author }: AuthorBoxProps) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {author.avatar?.url && (
        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={author.avatar.url}
            alt={author.avatar.alternativeText || author.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}
      <div>
        <h3 className="font-bold text-gray-900">{author.name}</h3>
        {author.bio && <p className="text-sm text-gray-600 mt-1">{author.bio}</p>}
      </div>
    </div>
  );
}
