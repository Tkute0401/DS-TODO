'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { DynoMascot } from '@/components/DynoMascot';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Digital Supremacy OS caught unhandled client error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary, #0a0b10)',
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          border: '1.5px solid var(--border-subtle, rgba(255,255,255,0.08))',
          boxShadow: '0 24px 60px -12px rgba(0,0,0,0.5)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <img
          src="/ds-logo.png"
          alt="Digital Supremacy"
          style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
        />
        <DynoMascot dynamicMood="blocked" size="md" />

        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--accent-red, #ff4757)',
              fontSize: '0.82rem',
              fontWeight: 750,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.35rem',
            }}
          >
            <AlertTriangle size={15} />
            <span>Operational Interruption</span>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main, #f1f2f6)', margin: 0 }}>
            Something tripped up the flow
          </h2>

          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--text-muted, #a4b0be)',
              marginTop: '0.5rem',
              lineHeight: 1.5,
            }}
          >
            A client-side hiccup occurred while synchronizing your deliverables. Your database state is safe.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="btn-accent"
            style={{
              flex: 1,
              minHeight: '42px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 750,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
            }}
          >
            <RotateCcw size={15} />
            <span>Try Again</span>
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="btn-clay"
            style={{
              flex: 1,
              minHeight: '42px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 750,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
            }}
          >
            <Home size={15} />
            <span>Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
