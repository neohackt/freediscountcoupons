'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

interface PaidTrafficRedirectProps {
  destination: string;
  storePath: string;
  storeName: string;
}

// Layout effects run before paint, so the address bar is cleaned as early as
// possible (before analytics scripts report the page view). Falls back to a
// passive effect during server rendering.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Module scoped so a remount of the component (React strict mode double
// invocation, or a router driven re-render) cannot trigger a second external
// navigation for the same paid click.
let navigationStarted = false;

/**
 * Minimal interstitial for approved paid traffic.
 *
 * It replaces the current history entry with the clean store path (so the
 * referrer sent to the brand tracking endpoint is the bare store URL and
 * never contains the paid-traffic parameters) and then navigates to the
 * resolved, already validated HTTPS destination.
 */
export function PaidTrafficRedirect({ destination, storePath, storeName }: PaidTrafficRedirectProps) {
  const navigated = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (navigated.current || navigationStarted) return;
    navigated.current = true;
    navigationStarted = true;

    try {
      window.history.replaceState(null, '', storePath);
    } catch {
      // History API unavailable: navigate anyway, the destination itself is
      // already validated. The click id still travels in the tracking
      // parameter, never in the referrer.
    }

    window.location.replace(destination);
  }, [destination, storePath]);

  return (
    <>
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <div className="min-h-[50vh] flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Taking you to {storeName}
          </h1>
          <p className="text-gray-600 mb-6">
            If you are not redirected automatically, use the link below.
          </p>
          <a
            href={destination}
            rel="noreferrer noopener"
            referrerPolicy="no-referrer"
            className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to {storeName}
          </a>
        </div>
      </div>
    </>
  );
}
