'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { getStoreLogo } from '@/lib/strapi/media';
import type { Coupon, Store } from '@/types';

interface CouponDetailsModalProps {
  coupon: Coupon;
  store: Store;
  isOpen: boolean;
  onClose: () => void;
  onRedeem?: () => void;
}

function formatExpiration(dateStr?: string): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function CouponDetailsModal({
  coupon,
  store,
  isOpen,
  onClose,
  onRedeem,
}: CouponDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousOverflowRef = useRef('');
  const [copiedText, copy] = useCopyToClipboard();

  const storeLogoUrl = getStoreLogo(store);
  const expirationDate = formatExpiration(coupon.expires_at);

  const handleCopy = async () => {
    if (coupon.code) {
      await copy(coupon.code);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    previousFocusRef.current = document.activeElement as HTMLElement;
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflowRef.current;
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus();
      }
      previousFocusRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !modalContainerRef.current) return;

    const container = modalContainerRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          ref={modalContainerRef}
          className={cn(
            'relative w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto mx-auto my-auto bg-white rounded-2xl shadow-2xl transform transition-all duration-200 ease-out',
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            ref={closeButtonRef}
            data-close-btn
            onClick={onClose}
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Close coupon details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                  {storeLogoUrl ? (
                    <img
                      src={storeLogoUrl}
                      alt={store.name}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-blue-600">
                      {store.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">{store.name}</p>
                  <h2 id="modal-title" className="text-lg font-semibold text-gray-900 mt-1">
                    {coupon.title}
                  </h2>
                </div>
              </div>

              {coupon.code && (
                <div className="mb-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code
                      className="font-mono text-base font-semibold text-gray-900 flex-1 break-all"
                    >
                      {coupon.code}
                    </code>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCopy}
                      disabled={copiedText === coupon.code}
                      aria-label={copiedText === coupon.code ? 'Code copied' : 'Copy code'}
                    >
                      {copiedText === coupon.code ? (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        'COPY'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full mb-4"
                onClick={() => onRedeem?.()}
              >
                Redeem at {store.name}
              </Button>

              {coupon.description?.trim() && (
                <section className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Offer Details</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{coupon.description}</p>
                </section>
              )}

              {expirationDate && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Expires: {expirationDate}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}