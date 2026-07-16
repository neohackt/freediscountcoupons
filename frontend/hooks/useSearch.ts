'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AutocompleteItem, AutocompleteResult, SearchResult } from '@/types';

export function useAutocomplete(initialValue: string = '') {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<AutocompleteResult>({ stores: [], categories: [], coupons: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const allItems: AutocompleteItem[] = [
    ...results.stores,
    ...results.categories,
    ...results.coupons,
  ].slice(0, 8);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults({ stores: [], categories: [], coupons: [] });
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`, { signal: controller.signal });
      if (!res.ok) throw new Error('Autocomplete failed');
      const data = await res.json();
      setResults(data.data);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setResults({ stores: [], categories: [], coupons: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length >= 2) {
      setIsLoading(true);
      timerRef.current = setTimeout(() => fetchResults(query), 300);
    } else {
      setResults({ stores: [], categories: [], coupons: [] });
      setIsOpen(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, fetchResults]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < allItems.length) {
          const item = allItems[activeIndex];
          if (item.type === 'store') window.location.href = `/store/${(item as any).slug}`;
          else if (item.type === 'category') window.location.href = `/deals/${(item as any).slug}`;
          else if (item.type === 'coupon') window.location.href = `/store/${(item as any).store?.slug || ''}`;
        } else if (query.trim()) {
          window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, activeIndex, allItems, query]);

  return {
    query,
    setQuery,
    results,
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    isLoading,
    allItems,
    inputRef,
    containerRef,
    handleKeyDown,
  };
}

export function useSearch(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult>({ stores: [], categories: [], coupons: [] });
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ stores: [], categories: [], coupons: [] });
      setTotal(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.data);
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) search(initialQuery);
  }, [initialQuery, search]);

  return { query, setQuery, results, total, isLoading, error, search };
}
