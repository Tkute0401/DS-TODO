'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { Plus, Zap, Calendar, User as UserIcon } from 'lucide-react';
import { playSound } from '@/lib/sound';

interface TaskCreationBarProps {
  currentUser: User;
  allUsers: User[];
  isTeamView: boolean;
  preselectedAssigneeId?: string;
  onCreateTask: (data: {
    title: string;
    due_date: string;
    is_urgent: boolean;
    assignee_id: string;
  }) => Promise<void>;
  soundEnabled: boolean;
}

export function TaskCreationBar({
  currentUser,
  allUsers,
  isTeamView,
  preselectedAssigneeId,
  onCreateTask,
  soundEnabled,
}: TaskCreationBarProps) {
  const [title, setTitle] = useState('');
  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [dueDate, setDueDate] = useState(getLocalDateString());
  const [isUrgent, setIsUrgent] = useState(false);
  const [assigneeId, setAssigneeId] = useState(preselectedAssigneeId || currentUser.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (preselectedAssigneeId) {
      setAssigneeId(preselectedAssigneeId);
    }
  }, [preselectedAssigneeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    playSound.click(soundEnabled);

    try {
      await onCreateTask({
        title: title.trim(),
        due_date: dueDate,
        is_urgent: isUrgent,
        assignee_id: isTeamView ? assigneeId : currentUser.id,
      });
      setTitle('');
      setIsUrgent(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel"
      style={{
        width: '100%',
        borderRadius: '20px',
        padding: '0.95rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
      }}
    >
      {/* 1. Top Tier: Command Icon + Title Input + Keyboard Hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'var(--support-pill)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-theme)',
            boxShadow: 'inset 1px 1px 2px var(--clay-highlight), 0 2px 5px var(--clay-drop-shadow-soft)',
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be shipped? (e.g. Final 30s cut, Raw footage dump, Deck)..."
          disabled={isSubmitting}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            fontSize: '0.98rem',
            color: 'var(--text-main)',
            fontWeight: 600,
            padding: '0.2rem 0',
          }}
        />

        <kbd>↵ Enter</kbd>
      </div>

      {/* 2. Bottom Tier: Attribute Chips & Submit Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          flexWrap: 'wrap',
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {/* Left: Attribute Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          
          {/* Priority Toggle */}
          <button
            type="button"
            onClick={() => setIsUrgent(!isUrgent)}
            className={`pill-badge ${isUrgent ? 'pill-badge-urgent' : ''}`}
            title="Toggle P0 Urgent Flag"
            style={{ minHeight: '32px', cursor: 'pointer' }}
          >
            <Zap size={13} color={isUrgent ? 'var(--accent-red)' : 'var(--text-dim)'} />
            <span>{isUrgent ? '⚡ P0 Urgent' : 'Normal Priority'}</span>
          </button>

          {/* Due Date Picker */}
          <div className="pill-badge" style={{ minHeight: '32px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={13} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>Due:</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="tabular-numbers"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          </div>

          {/* Assignee Selection (Team View) */}
          {isTeamView ? (
            <div className="pill-badge" style={{ minHeight: '32px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserIcon size={13} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>Assignee:</span>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {allUsers.filter((u) => u.is_active !== false).map((u) => (
                  <option key={u.id} value={u.id} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                    {u.name} ({u.designation})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="pill-badge" style={{ minHeight: '32px' }}>
              <UserIcon size={13} color="var(--text-dim)" />
              <span style={{ color: 'var(--text-dim)' }}>Assignee:</span>
              <strong style={{ color: 'var(--text-muted)' }}>You</strong>
            </div>
          )}
        </div>

        {/* Right: Submit Button */}
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className={title.trim() ? 'btn-accent' : ''}
          style={{
            fontSize: '0.84rem',
            padding: '0.4rem 1.1rem',
            minHeight: '36px',
            borderRadius: '12px',
          }}
        >
          <Plus size={15} />
          <span>Create Deliverable</span>
        </button>
      </div>
    </form>
  );
}
