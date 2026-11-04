'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, User } from '@/types';
import { Send, X, ExternalLink, UserCheck, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '@/lib/sound';

interface SubmitReviewModalProps {
  task: Task;
  allUsers: User[];
  currentUser: User;
  onClose: () => void;
  onSubmit: (taskId: string, reviewerId: string, deliverableLink?: string) => Promise<void>;
  soundEnabled: boolean;
}

export function SubmitReviewModal({
  task,
  allUsers,
  currentUser,
  onClose,
  onSubmit,
  soundEnabled,
}: SubmitReviewModalProps) {
  // Filter active managers and admins eligible to review
  const availableReviewers = allUsers.filter(
    (u) => u.is_active !== false && (u.role === 'MANAGER' || u.role === 'ADMIN') && u.id !== currentUser.id
  );

  // If task creator was a manager/admin, default to them; else first available manager
  const defaultReviewer = availableReviewers.find((u) => u.id === task.creator_id) || availableReviewers[0];
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>(
    task.reviewer_id || defaultReviewer?.id || ''
  );
  const [assetLink, setAssetLink] = useState<string>(task.deliverable_link || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewerId || isSubmitting) return;

    setIsSubmitting(true);
    playSound.pop(soundEnabled);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
    });

    try {
      await onSubmit(task.id, selectedReviewerId, assetLink.trim() || undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <div
      className="mobile-drawer-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 11, 16, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel modal-responsive"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: 'inset 2px 2px 5px var(--clay-highlight), 0 24px 60px -12px var(--clay-drop-shadow)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'rgba(6, 182, 212, 0.12)',
                color: 'var(--accent-theme)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              <Send size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Submit for Verification
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                Select the manager who will review your work
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--support-pill)',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Task Info Pill */}
        <div
          style={{
            padding: '0.75rem 0.9rem',
            borderRadius: '12px',
            background: 'var(--support-pill)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
            Deliverable
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {task.title}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Due date: <strong className="tabular-numbers">{task.due_date}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Manager / Reviewer Selection */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 750,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: '0.45rem',
                letterSpacing: '0.04em',
              }}
            >
              <UserCheck size={14} color="var(--accent-theme)" />
              <span>Assign Reviewer (Manager / Admin) *</span>
            </label>
            <select
              value={selectedReviewerId}
              onChange={(e) => setSelectedReviewerId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'var(--support-pill)',
                border: '1.5px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                fontWeight: 650,
                outline: 'none',
              }}
            >
              {availableReviewers.length === 0 ? (
                <option value="" disabled>No managers available</option>
              ) : (
                availableReviewers.map((r) => (
                  <option key={r.id} value={r.id} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                    {r.name} &bull; {r.role} ({r.designation || 'Reviewer'})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Deliverable Link */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 750,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: '0.45rem',
                letterSpacing: '0.04em',
              }}
            >
              <ExternalLink size={14} color="var(--accent-theme)" />
              <span>Asset / Deliverable Link (Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/..., Figma, Github, etc."
              value={assetLink}
              onChange={(e) => setAssetLink(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'var(--support-pill)',
                border: '1.5px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '0.65rem', marginTop: '0.4rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.65rem',
                borderRadius: '12px',
                background: 'var(--support-pill)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontWeight: 650,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReviewerId || isSubmitting}
              className="btn-accent"
              style={{
                padding: '0.65rem',
                borderRadius: '12px',
                fontWeight: 750,
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: isSubmitting ? 'wait' : 'pointer',
              }}
            >
              <ShieldCheck size={16} />
              <span>{isSubmitting ? 'Submitting...' : 'Send to Review ➔'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
