'use client';

import React from 'react';
import { X, Sparkles, Flame, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DynoMascot } from './DynoMascot';
import { playSound } from '@/lib/sound';

interface DailyVictoryModalProps {
  streak: number;
  completedCount: number;
  soundEnabled?: boolean;
  onClose: () => void;
}

export function DailyVictoryModal({ streak, completedCount, soundEnabled, onClose }: DailyVictoryModalProps) {
  React.useEffect(() => {
    playSound.unblock(soundEnabled);
    confetti({
      particleCount: 100,
      spread: 95,
      origin: { y: 0.5 },
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, soundEnabled]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(45, 39, 36, 0.45)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.25rem 1.75rem',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at top, rgba(245, 158, 11, 0.15) 0%, rgba(244, 63, 94, 0.08) 50%, var(--bg-card) 100%)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: 'inset 2.5px 2.5px 5px var(--clay-highlight), inset -2.5px -2.5px 6px var(--clay-inner-shadow), 0 24px 60px -12px rgba(45, 39, 36, 0.18)',
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
          }}
        >
          <X size={18} />
        </button>

        {/* Animated Celebration Dyno Mascot */}
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <DynoMascot dynamicMood="celebrate" size="lg" interactive={true} />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-theme)', fontSize: '0.82rem', fontWeight: 750, padding: '0.3rem 0.85rem', borderRadius: '999px', background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', marginBottom: '0.85rem', boxShadow: 'inset 1px 1px 2px var(--clay-highlight)' }}>
          <Sparkles size={14} /> ALL DELIVERABLES CLEARED
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.45rem', letterSpacing: '-0.02em' }}>
          Work is Done for Today!
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          You hit 100% on-time completion today. No pending tasks remain. Shut down your laptop and go recharge!
        </p>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', padding: '0.9rem', borderRadius: '16px', boxShadow: 'inset 1px 1px 2px var(--clay-highlight)' }}>
            <div className="tabular-numbers" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <CheckCircle size={18} /> {completedCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>
              Tasks Shipped Today
            </div>
          </div>

          <div style={{ background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', padding: '0.9rem', borderRadius: '16px', boxShadow: 'inset 1px 1px 2px var(--clay-highlight)' }}>
            <div className="tabular-numbers" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <Flame size={18} /> {streak}d
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>
              On-Time Streak Intact
            </div>
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
          }}
        >
          Enjoy the Evening 🥂
        </button>
      </div>
    </div>
  );
}
