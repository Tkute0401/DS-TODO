'use client';

import React, { useState } from 'react';
import { User, DeliverableType, DeliverableStage } from '@/types';
import { Plus, Zap, Calendar, User as UserIcon, Briefcase } from 'lucide-react';
import { playSound } from '@/lib/sound';

interface TaskCreationBarProps {
  currentUser: User;
  allUsers: User[];
  clients?: { id?: string; client_name: string }[];
  isTeamView: boolean;
  preselectedAssigneeId?: string;
  onCreateTask: (data: {
    title: string;
    due_date: string;
    is_urgent: boolean;
    assignee_id: string;
    client_id?: string;
    client_name?: string;
    deliverable_type?: DeliverableType;
    deliverable_stage?: DeliverableStage;
    deliverable_count?: number;
  }) => Promise<void>;
  soundEnabled: boolean;
}

export function TaskCreationBar({
  currentUser,
  allUsers,
  clients = [],
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
  const [selectedClientName, setSelectedClientName] = useState('');
  const [deliverableType, setDeliverableType] = useState<DeliverableType>('REEL');
  const [deliverableStage, setDeliverableStage] = useState<DeliverableStage>('PRODUCTION');
  const [deliverableCount, setDeliverableCount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unique client names
  const clientNames = React.useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => {
      if (c.client_name?.trim()) set.add(c.client_name.trim());
    });
    return Array.from(set).sort();
  }, [clients]);

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
        client_name: selectedClientName || undefined,
        deliverable_type: selectedClientName ? deliverableType : undefined,
        deliverable_stage: selectedClientName ? deliverableStage : undefined,
        deliverable_count: selectedClientName ? deliverableCount : undefined,
      });
      setTitle('');
      setIsUrgent(false);
      // Keep or reset client? Resetting ensures next task isn't accidentally labeled, but keeping stage/count default
      setSelectedClientName('');
      setDeliverableCount(1);
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

        <kbd className="hide-on-compact">↵ Enter</kbd>
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
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  maxWidth: '160px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                }}
              >
                {allUsers.filter((u) => u.is_active !== false).map((u) => (
                  <option key={u.id} value={u.id} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                    {u.name.split(' ')[0]} ({u.role === 'ADMIN' ? 'Admin' : u.designation.split(' ')[0]}){u.is_on_leave ? ' 🌴' : ''}
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

          {/* Client Selection (Optional Deliverable Linkage) */}
          <div className="pill-badge" style={{ minHeight: '32px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Briefcase size={13} color={selectedClientName ? 'var(--accent-theme)' : 'var(--text-muted)'} />
            <span style={{ color: selectedClientName ? 'var(--accent-theme)' : 'var(--text-dim)', fontSize: '0.74rem', fontWeight: selectedClientName ? 700 : 500 }}>
              Client:
            </span>
            <select
              value={selectedClientName}
              onChange={(e) => setSelectedClientName(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: selectedClientName ? 'var(--accent-theme)' : 'var(--text-main)',
                fontSize: '0.78rem',
                fontWeight: selectedClientName ? 750 : 600,
                cursor: 'pointer',
                padding: 0,
                maxWidth: '150px',
                outline: 'none',
              }}
            >
              <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                None (Internal Task)
              </option>
              {clientNames.map((name) => (
                <option key={name} value={name} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* If Client is chosen: show Deliverable Type, Workflow Stage, and Quantity inline! */}
          {Boolean(selectedClientName) && (
            <>
              {/* Type: Reel vs Graphic */}
              <div className="pill-badge" style={{ minHeight: '32px', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Type:</span>
                <select
                  value={deliverableType}
                  onChange={(e) => setDeliverableType(e.target.value as DeliverableType)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    padding: 0,
                  }}
                >
                  <option value="REEL" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>🎬 Reel</option>
                  <option value="GRAPHIC" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>🎨 Graphic</option>
                </select>
              </div>

              {/* Stage: 3 Workflow Columns */}
              <div className="pill-badge" style={{ minHeight: '32px', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Stage:</span>
                <select
                  value={deliverableStage}
                  onChange={(e) => setDeliverableStage(e.target.value as DeliverableStage)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    padding: 0,
                  }}
                >
                  <option value="PRE_PRODUCTION" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>🎬 Pre-Prod</option>
                  <option value="PRODUCTION" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>✂️ Production</option>
                  <option value="PUBLISHED" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>🚀 Published</option>
                </select>
              </div>

              {/* Batch Quantity */}
              <div className="pill-badge" style={{ minHeight: '32px', display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Number of deliverables in this task">
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Qty:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={deliverableCount}
                  onChange={(e) => setDeliverableCount(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '38px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    padding: 0,
                    outline: 'none',
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Right: Submit Button */}
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className={`task-create-submit ${title.trim() ? 'btn-accent' : ''}`}
          style={{
            fontSize: '0.84rem',
            padding: '0.45rem 1.1rem',
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
