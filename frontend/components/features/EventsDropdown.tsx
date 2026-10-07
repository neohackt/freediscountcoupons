'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { EventNavItem } from '@/types/event';

interface EventsDropdownProps {
  events: EventNavItem[];
}

export function EventsDropdown({ events }: EventsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (events.length === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium transition-colors"
      >
        Events
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
          {events.map((event) => (
            <Link
              key={event.slug}
              href={`/events/${event.slug}`}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-gray-50 font-medium transition-colors"
            >
              {event.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
