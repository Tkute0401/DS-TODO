'use client';

import React, { useState } from 'react';
import { Task, User, BlockerType } from '@/types';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';

interface BlockerModalProps {
  task: Task;
  allUsers: User[];
  currentUserId: string;
  onClose: () => void;
  onSubmitBlocker: (data: {
    task_id: string;
    blocked_by_type: BlockerType;
    blocking_user_id?: string;
    reason: string;
  }) => Promise<void>;
}

export function BlockerModal({
  task,
  allUsers,
  currentUserId,
  onClose,
  onSubmitBlocker,
}: BlockerModalProps) {
  const [blockedType, setBlockedType] = useState<BlockerType>('COLLEAGUE');
  const [blockingUserId, setBlockingUserId] = useState<string>(
    allUsers.find((u) => u.id !== currentUserId)?.id || ''
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitBlocker({
        task_id: task.id,
        blocked_by_type: blockedType,
        blocking_user_id: blockedType === 'COLLEAGUE' ? blockingUserId : undefined,
        reason: reason.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

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
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
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
              background: 'rgba(255, 71, 87, 0.14)',
              color: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
            }}>
              <ShieldAlert size={18} />
            </div>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 750, color: 'var(--text-main)' }}>Report Task Blocker</h3>
          </div>
          <button onClick={onClose} style={{ minHeight: '32px', minWidth: '32px', padding: 0, color: 'var(--text-muted)', borderRadius: '10px' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Flagging a blocker pauses your deliverable clock and alerts the responsible party immediately.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Target Task Name */}
          <div style={{ background: 'var(--support-pill)', padding: '0.75rem 1rem', borderRadius: '14px', fontSize: '0.86rem', border: '1px solid var(--border-subtle)', boxShadow: 'inset 1px 1px 2px var(--clay-highlight)' }}>
            <span style={{ color: 'var(--text-dim)' }}>Task:</span> <strong style={{ color: 'var(--text-main)' }}>{task.title}</strong>
          </div>

          {/* 1. Who is blocking this? */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block' }}>
              Who or what is blocking you?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              {(['COLLEAGUE', 'CLIENT', 'EXTERNAL'] as BlockerType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBlockedType(type)}
                  style={{
                    minHeight: '40px',
                    fontSize: '0.82rem',
                    borderRadius: '12px',
                    fontWeight: 650,
                    background: blockedType === type ? 'var(--support-pill)' : 'var(--bg-card)',
                    border: blockedType === type ? '2px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                    color: blockedType === type ? 'var(--accent-red)' : 'var(--text-muted)',
                    boxShadow: blockedType === type
                      ? 'inset 1.5px 1.5px 3px rgba(45,39,36,0.06)'
                      : 'inset 1.5px 1.5px 2px rgba(255,255,255,0.9), 0 2px 5px rgba(45,39,36,0.04)',
                    transition: 'all 0.16s ease',
                  }}
                >
                  {type === 'COLLEAGUE' ? 'Colleague' : type === 'CLIENT' ? 'Client' : 'External'}
                </button>
              ))}
            </div>
          </div>

          {/* If Colleague: Select person */}
          {blockedType === 'COLLEAGUE' && (
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block' }}>
                Select Responsible Teammate
              </label>
              <select
                value={blockingUserId}
                onChange={(e) => setBlockingUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '14px',
                  background: 'var(--support-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  boxShadow: 'inset 1.5px 1.5px 3px rgba(45,39,36,0.05)',
                }}
              >
                {allUsers
                  .filter((u) => u.id !== currentUserId && u.is_active !== false)
                  .map((u) => (
                    <option key={u.id} value={u.id} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                      {u.name} ({u.designation})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* 2. Mandatory Reason Note with Prominent Indicator */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block' }}>
              What missing item/action do you need? <span style={{ color: 'var(--accent-red)' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--support-pill)', border: '1.5px solid var(--border-active)', borderRadius: '14px', padding: '0 0.85rem', boxShadow: 'inset 1.5px 1.5px 3px rgba(45,39,36,0.05)' }}>
              <AlertTriangle size={15} color="var(--accent-red)" />
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Raw footage from Sunday shoot, Brand guidelines PDF..."
                style={{
                  width: '100%',
                  padding: '0.75rem 0',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                minHeight: '44px',
                borderRadius: '14px',
                background: 'var(--support-pill)',
                color: 'var(--text-muted)',
                fontWeight: 650,
                fontSize: '0.86rem',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || isSubmitting}
              className="btn-accent"
              style={{
                flex: 2,
                minHeight: '44px',
                borderRadius: '14px',
                background: 'var(--accent-red) !important',
                fontSize: '0.9rem',
              }}
            >
              {isSubmitting ? 'Flagging...' : 'Confirm Blocker 🚨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
