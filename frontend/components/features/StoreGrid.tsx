'use client';

import { useState } from 'react';
import { StoreCard } from './StoreCard';
import type { Store } from '@/types';

interface StoreGridProps {
  stores: Store[];
  hideFilter?: boolean;
}

const LETTERS = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '0-9'];

export function StoreGrid({ stores, hideFilter = false }: StoreGridProps) {
  const [activeLetter, setActiveLetter] = useState('All');

  const filteredStores = stores.filter((store) => {
    if (hideFilter || activeLetter === 'All') return true;
    const firstChar = store.name.charAt(0).toUpperCase();
    if (activeLetter === '0-9') return /\d/.test(firstChar);
    return firstChar === activeLetter;
  });

  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No stores available</p>
      </div>
    );
  }

  return (
    <div>
      {!hideFilter && (
        <div className="flex flex-wrap gap-1 mb-8 justify-center">
          {LETTERS.map((letter) => {
            const isActive = activeLetter === letter;
            const count = letter === 'All'
              ? stores.length
              : stores.filter((s) => {
                  const c = s.name.charAt(0).toUpperCase();
                  return letter === '0-9' ? /\d/.test(c) : c === letter;
                }).length;

            return (
              <button
                key={letter}
                onClick={() => setActiveLetter(letter)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : count > 0
                      ? 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                      : 'bg-gray-50 text-gray-300 cursor-default'
                }`}
                disabled={!isActive && count === 0}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}

      {filteredStores.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No stores found for &quot;{activeLetter}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredStores.map((store) => (
            <StoreCard key={store.documentId || store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}
