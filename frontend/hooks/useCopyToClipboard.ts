'use client';

import { useState, useCallback } from 'react';

interface CopyResult {
  success: boolean;
  error?: string;
}

export function useCopyToClipboard(): [string | null, (text: string) => Promise<void>] {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string): Promise<void> => {
    try {
      if (!navigator?.clipboard) {
        console.error('Clipboard API not available');
        return;
      }

      await navigator.clipboard.writeText(text);
      setCopiedText(text);

      setTimeout(() => {
        setCopiedText(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy: ', error);
      setCopiedText(null);
    }
  }, []);

  return [copiedText, copy];
}