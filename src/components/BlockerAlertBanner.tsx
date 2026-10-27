'use client';

import React from 'react';
import { Blocker } from '@/types';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { playSound } from '@/lib/sound';

interface BlockerAlertBannerProps {
  blockersOnMe: Blocker[];
  onResolveBlocker: (blockerId: string) => void;
  soundEnabled: boolean;
}

export function BlockerAlertBanner({
  blockersOnMe,
  onResolveBlocker,
  soundEnabled,
}: BlockerAlertBannerProps) {
  if (blockersOnMe.length === 0) return null;

  return (
    <div style={{ maxWidth: '1080px', margin: '1rem auto 0 auto', padding: '0 1.25rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {blockersOnMe.map((b) => (
        <div
          key={b.id}
          className="glass-panel"
          style={{
            background: 'linear-gradient(135deg, #fff5f3 0%, #fffbf7 100%)',
            border: '1.5px solid rgba(217, 78, 78, 0.28)',
            padding: '0.85rem 1.25rem',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: 'inset 2px 2px 4px var(--clay-highlight), 0 8px 20px -4px var(--clay-drop-shadow)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'rgba(255, 71, 87, 0.14)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-red)',
              boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
            }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                You are holding up <strong style={{ color: 'var(--accent-theme)' }}>{b.blocked_user_name || 'Teammate'}</strong> on &ldquo;{b.task_title}&rdquo;
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Requested deliverable: &ldquo;{b.reason}&rdquo;
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playSound.unblock(soundEnabled);
              onResolveBlocker(b.id);
            }}
            className="btn-accent"
            style={{
              background: 'var(--accent-green) !important',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              padding: '0.4rem 1.1rem',
              minHeight: '36px',
              borderRadius: '12px',
            }}
          >
            <CheckCircle2 size={15} />
            <span>Mark Delivered ⚡</span>
          </button>
        </div>
      ))}
    </div>
  );
}
