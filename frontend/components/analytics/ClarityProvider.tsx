'use client';

import { useEffect } from 'react';

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_ID || '';

interface ClarityFunction {
  (...args: unknown[]): void;
  q: unknown[];
}

interface ClarityWindow extends Window {
  clarity?: ClarityFunction;
}

declare global {
  interface Window {
    clarity?: ClarityFunction;
  }
}

export function ClarityProvider() {
  useEffect(() => {
    if (!CLARITY_PROJECT_ID || typeof window === 'undefined') return;
    if (window.clarity) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
    document.head.appendChild(script);

    const clarityFn: ClarityFunction = function (...args: unknown[]) {
      clarityFn.q = clarityFn.q || [];
      clarityFn.q.push(args);
    };
    clarityFn.q = clarityFn.q || [];
    (window as ClarityWindow).clarity = clarityFn;

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}