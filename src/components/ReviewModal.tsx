'use client';

import React, { useState } from 'react';
import { Task, KudosType } from '@/types';
import { CheckCircle2, X, ExternalLink, RotateCcw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '@/lib/sound';

interface ReviewModalProps {
  task: Task;
  initialMode?: 'approve' | 'revise';
  onClose: () => void;
  onApprove: (taskId: string, kudosBadge?: KudosType) => Promise<void>;
  onRequestChanges: (taskId: string, revisionNote: string) => Promise<void>;
  soundEnabled: boolean;
}

export function ReviewModal({
  task,
  initialMode,
  onClose,
  onApprove,
  onRequestChanges,
  soundEnabled,
}: ReviewModalProps) {
  const [selectedBadge, setSelectedBadge] = useState<KudosType>('PIXEL_PERFECT');
  const [revisionNote, setRevisionNote] = useState(task.revision_note || '');
  const [mode, setMode] = useState<'approve' | 'revise'>(initialMode || (task.status === 'DONE' ? 'revise' : 'approve'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    playSound.pop(soundEnabled);
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
    });

    try {
      await onApprove(task.id, selectedBadge);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNote.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onRequestChanges(task.id, revisionNote.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const kudosBadges: { type: KudosType; label: string; icon: string }[] = [
    { type: 'SPEED_DEMON', label: 'Speed Demon', icon: '🚀' },
    { type: 'PIXEL_PERFECT', label: 'Pixel Perfect', icon: '💎' },
    { type: 'BIG_BRAIN', label: 'Big Brain', icon: '🧠' },
    { type: 'CHEFS_KISS', label: "Chef's Kiss", icon: '👑' },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(45, 39, 36, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <div
        className="glass-panel modal-responsive"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: 'inset 2px 2px 5px var(--clay-highlight), 0 24px 60px -12px var(--clay-drop-shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
            }}>
              <Award size={18} />
            </div>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 750, color: 'var(--text-main)' }}>Review &amp; Sign-Off</h3>
          </div>
          <button onClick={onClose} style={{ minHeight: '32px', minWidth: '32px', padding: 0, color: 'var(--text-muted)', borderRadius: '10px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Task Details Card */}
        <div style={{ background: 'var(--support-pill)', padding: '0.9rem 1.15rem', borderRadius: '16px', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)', boxShadow: 'inset 1px 1px 2px var(--clay-highlight)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 750, fontSize: '0.98rem', color: 'var(--text-main)' }}>{task.title}</div>
            {task.creator_id === task.assignee_id && (
              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple, #8b5cf6)', fontWeight: 700 }}>
                Self-Made Deliverable
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Submitted by: <strong style={{ color: 'var(--text-main)' }}>{task.assignee_name}</strong> ({task.assignee_designation})
          </div>
          {task.deliverable_link && (
            <div style={{ marginTop: '0.5rem' }}>
              <a
                href={task.deliverable_link}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  color: 'var(--accent-theme)',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                <ExternalLink size={14} /> Open Deliverable Link ↗
              </a>
            </div>
          )}
        </div>

        {/* Action Choice Tabs */}
        <div style={{ display: 'flex', background: 'var(--support-pill)', padding: '3px', borderRadius: '14px', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)', boxShadow: 'inset 1px 1px 2px rgba(45,39,36,0.06)' }}>
          <button
            type="button"
            onClick={() => setMode('approve')}
            style={{
              flex: 1,
              minHeight: '38px',
              borderRadius: '11px',
              background: mode === 'approve' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'approve' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 750,
              fontSize: '0.84rem',
              border: mode === 'approve' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              boxShadow: mode === 'approve' ? 'inset 1px 1px 2px rgba(255,255,255,0.95), 0 2px 6px rgba(45,39,36,0.06)' : 'none',
            }}
          >
            <CheckCircle2 size={15} color="var(--accent-green)" />
            <span>Approve &amp; Award Kudos</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('revise')}
            style={{
              flex: 1,
              minHeight: '38px',
              borderRadius: '11px',
              background: mode === 'revise' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'revise' ? 'var(--accent-red)' : 'var(--text-muted)',
              fontWeight: 750,
              fontSize: '0.84rem',
              border: mode === 'revise' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              boxShadow: mode === 'revise' ? 'inset 1px 1px 2px rgba(255,255,255,0.95), 0 2px 6px rgba(45,39,36,0.06)' : 'none',
            }}
          >
            <RotateCcw size={15} />
            <span>Request Revisions</span>
          </button>
        </div>

        {/* Approve Mode: Pick Kudos Sticker */}
        {mode === 'approve' ? (
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
              Attach Kudos Sticker:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
              {kudosBadges.map((badge) => (
                <button
                  key={badge.type}
                  type="button"
                  onClick={() => setSelectedBadge(badge.type)}
                  style={{
                    padding: '0.6rem 0.75rem',
                    minHeight: '46px',
                    borderRadius: '14px',
                    background: selectedBadge === badge.type ? 'var(--support-pill)' : 'var(--bg-card)',
                    border: selectedBadge === badge.type ? '2px solid var(--accent-theme)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.86rem',
                    fontWeight: 650,
                    color: selectedBadge === badge.type ? 'var(--accent-theme)' : 'var(--text-main)',
                    boxShadow: selectedBadge === badge.type
                      ? 'inset 1.5px 1.5px 3px rgba(45,39,36,0.06), 0 2px 6px rgba(45,39,36,0.04)'
                      : 'inset 1.5px 1.5px 2px rgba(255,255,255,0.9), 0 3px 8px rgba(45,39,36,0.04)',
                    transition: 'all 0.16s ease',
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{badge.icon}</span>
                  <span>{badge.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="btn-accent"
              style={{
                width: '100%',
                minHeight: '44px',
                borderRadius: '14px',
                fontSize: '0.92rem',
                background: 'var(--accent-green) !important',
              }}
            >
              {isSubmitting ? 'Approving...' : 'Sign Off & Complete Task ✓'}
            </button>
          </div>
        ) : (
          /* Revise Mode: Feedback note */
          <form onSubmit={handleRevise}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
              What needs to be revised? <span style={{ color: 'var(--accent-red)' }}>*</span>
            </label>
            <textarea
              required
              rows={3}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="e.g. Please balance the audio at 0:15 and adjust font size on lower third..."
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: '14px',
                background: 'var(--support-pill)',
                border: '1.5px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                marginBottom: '1rem',
                resize: 'none',
                boxShadow: 'inset 1.5px 1.5px 3px rgba(45,39,36,0.05), inset -1px -1px 2px rgba(255,255,255,0.9)',
              }}
            />
            <button
              type="submit"
              disabled={!revisionNote.trim() || isSubmitting}
              className="btn-accent"
              style={{
                width: '100%',
                minHeight: '44px',
                borderRadius: '14px',
                fontSize: '0.92rem',
                background: 'var(--accent-red) !important',
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Revision Back to Teammate ✍️'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
