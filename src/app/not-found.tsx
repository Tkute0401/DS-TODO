import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';
import { DynoMascot } from '@/components/DynoMascot';

export default function NotFound() {
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
          padding: '2.75rem 2rem',
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
        <DynoMascot dynamicMood="coffee" size="md" />

        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--accent-theme, #06b6d4)',
              fontSize: '0.82rem',
              fontWeight: 750,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.35rem',
            }}
          >
            <Compass size={15} />
            <span>404 · Destination Off Grid</span>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main, #f1f2f6)', margin: 0 }}>
            Deliverable Not Found
          </h2>

          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-muted, #a4b0be)',
              marginTop: '0.5rem',
              lineHeight: 1.5,
            }}
          >
            The link you followed doesn&rsquo;t lead to an active board or deliverable.
          </p>
        </div>

        <Link
          href="/"
          className="btn-accent"
          style={{
            minHeight: '44px',
            padding: '0.5rem 1.5rem',
            borderRadius: '12px',
            fontSize: '0.86rem',
            fontWeight: 750,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            marginTop: '0.5rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Return to Workspace</span>
        </Link>
      </div>
    </div>
  );
}
