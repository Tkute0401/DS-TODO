'use client';

import React, { useEffect } from 'react';
import { KudosType } from '@/types';
import { X, Award, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '@/lib/sound';

interface KudosCelebrationModalProps {
  kudosBadge: KudosType;
  taskTitle: string;
  senderName: string;
  onClose: () => void;
  soundEnabled: boolean;
}

const BADGE_CONFIG: Record<
  KudosType,
  { emoji: string; title: string; subtitle: string; gradient: string; glow: string }
> = {
  SPEED_DEMON: {
    emoji: '🚀',
    title: 'Speed Demon',
    subtitle: 'Shipped significantly ahead of deadline with blazing velocity!',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(249, 115, 22, 0.22) 100%)',
    glow: 'rgba(249, 115, 22, 0.35)',
  },
  PIXEL_PERFECT: {
    emoji: '💎',
    title: 'Pixel Perfect',
    subtitle: 'Zero revisions needed. Pure craftsmanship and meticulous quality!',
    gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.22) 100%)',
    glow: 'rgba(6, 182, 212, 0.35)',
  },
  BIG_BRAIN: {
    emoji: '🧠',
    title: 'Big Brain',
    subtitle: 'Clever problem-solving, unblocking obstacles and ingenious initiative!',
    gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(236, 72, 153, 0.22) 100%)',
    glow: 'rgba(168, 85, 247, 0.35)',
  },
  CHEFS_KISS: {
    emoji: '👑',
    title: "Chef's Kiss",
    subtitle: 'Exceptional overall execution. Certified masterpiece delivery!',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(234, 179, 8, 0.24) 100%)',
    glow: 'rgba(245, 158, 11, 0.35)',
  },
};

export function KudosCelebrationModal({
  kudosBadge,
  taskTitle,
  senderName,
  onClose,
  soundEnabled,
}: KudosCelebrationModalProps) {
  const config = BADGE_CONFIG[kudosBadge] || BADGE_CONFIG.PIXEL_PERFECT;

  useEffect(() => {
    playSound.pop(soundEnabled);
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#00f0ff', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6'],
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [soundEnabled, onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 11, 16, 0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '1rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '2.25rem 1.75rem',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: `inset 2px 2px 5px var(--clay-highlight), 0 24px 60px -12px ${config.glow}`,
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            minHeight: '32px',
            minWidth: '32px',
            padding: 0,
            color: 'var(--text-muted)',
            borderRadius: '10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Animated Badge Icon Container */}
        <div
          style={{
            width: '90px',
            height: '90px',
            margin: '0 auto 1.25rem auto',
            borderRadius: '26px',
            background: config.gradient,
            border: `2px solid ${config.glow}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.75rem',
            boxShadow: `0 12px 30px -4px ${config.glow}`,
            animation: 'mascot-sway 2.5s infinite ease-in-out',
          }}
        >
          {config.emoji}
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: 'var(--accent-theme)',
            fontSize: '0.8rem',
            fontWeight: 750,
            padding: '0.3rem 0.85rem',
            borderRadius: '999px',
            background: 'var(--support-pill)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '0.75rem',
          }}
        >
          <Sparkles size={14} /> KUDOS AWARDED!
        </div>

        <h2
          style={{
            fontSize: '1.55rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginBottom: '0.45rem',
            letterSpacing: '-0.02em',
          }}
        >
          {config.title} Badge
        </h2>

        <p
          style={{
            fontSize: '0.92rem',
            color: 'var(--text-muted)',
            marginBottom: '1.25rem',
            lineHeight: 1.5,
          }}
        >
          {config.subtitle}
        </p>

        {/* Deliverable info card */}
        <div
          style={{
            background: 'var(--support-pill)',
            border: '1px solid var(--border-subtle)',
            padding: '0.85rem 1rem',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Deliverable Signed Off:
          </div>
          <div style={{ fontWeight: 750, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
            &ldquo;{taskTitle}&rdquo;
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--accent-theme)', marginTop: '0.25rem', fontWeight: 650 }}>
            Approved by {senderName}
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-accent"
          style={{
            width: '100%',
            minHeight: '44px',
            borderRadius: '14px',
            fontSize: '0.92rem',
            fontWeight: 750,
            background: 'var(--accent-gradient)',
            color: 'var(--accent-contrast)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Claim Kudos &amp; Keep Crushing It 🚀
        </button>
      </div>
    </div>
  );
}
