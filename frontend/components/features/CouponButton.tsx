'use client';

import { useState } from 'react';

interface CouponButtonProps {
  code: string;
  onReveal?: () => void;
  onCopy?: () => void;
  isRevealed?: boolean;
  isCopied?: boolean;
}

export function CouponButton({
  code,
  onReveal,
  onCopy,
  isRevealed: externalRevealed,
  isCopied: externalCopied,
}: CouponButtonProps) {
  const [internalRevealed, setInternalRevealed] = useState(false);
  const [internalCopied, setInternalCopied] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const isRevealed = externalRevealed ?? internalRevealed;
  const isCopied = externalCopied ?? internalCopied;

  const handleUnrevealedClick = () => {
    setInternalRevealed(true);
    setHasAnimated(true);
    navigator.clipboard.writeText(code);
    setInternalCopied(true);
    onReveal?.();
    onCopy?.();
    setTimeout(() => setInternalCopied(false), 2000);
  };

  const handleRevealedClick = () => {
    navigator.clipboard.writeText(code);
    setInternalCopied(true);
    onCopy?.();
    setTimeout(() => setInternalCopied(false), 2000);
  };

  /* ── Revealed state: green "Copied!" button ── */
  if (isRevealed) {
    return (
      <button
        onClick={handleRevealedClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '160px',
          height: '44px',
          padding: '0 14px',
          background: '#22a844',
          color: '#ffffff',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '15px',
          fontWeight: 600,
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
          transition: 'background 200ms ease, box-shadow 200ms ease, transform 200ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#1d9239';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.16)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#22a844';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.12)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {isCopied ? (
          <>
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            <span style={{ fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace", letterSpacing: '0.06em', fontWeight: 700 }}>{code}</span>
            <svg style={{ width: 16, height: 16, opacity: 0.7 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </>
        )}
      </button>
    );
  }

  /* ── Unrevealed state: slide-to-reveal ── */
  return (
    <div
      data-coupon-btn
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        width: '160px',
        height: '44px',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        transition: 'box-shadow 300ms ease-in-out, transform 300ms ease-in-out',
        flexShrink: 0,
      }}
      onClick={handleUnrevealedClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        const btn = e.currentTarget.querySelector<HTMLElement>('[data-reveal-btn]');
        if (btn) btn.style.transform = 'translateX(-60px)';
      }}
      onMouseLeave={(e) => {
        if (!hasAnimated) {
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
        const btn = e.currentTarget.querySelector<HTMLElement>('[data-reveal-btn]');
        if (btn && !hasAnimated) btn.style.transform = 'translateX(0)';
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleUnrevealedClick();
        }
      }}
    >
      {/* Code area — fills entire wrapper, sits behind the button */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          border: '2px dashed #c7d2e0',
          borderRadius: '6px',
          fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace",
          fontSize: '15px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#1a1a2e',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}
      >
        <span>{code}</span>
      </div>

      {/* Main blue button — covers everything except rightmost 52px */}
      <div
        data-reveal-btn
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '0 20px',
          background: '#3B5CC9',
          color: '#ffffff',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '15px',
          fontWeight: 600,
          border: 'none',
          borderRadius: '6px 0 0 6px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          zIndex: 2,
          transition: 'transform 300ms ease-in-out',
          willChange: 'transform',
          ...(hasAnimated ? { transform: 'translateX(-60px)' } : {}),
        }}
      >
        <span>Show Code</span>
        <svg
          style={{ width: 16, height: 16, transition: 'transform 200ms' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Screen reader + crawler accessible code */}
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      >
        Coupon code: {code}
      </span>
    </div>
  );
}
