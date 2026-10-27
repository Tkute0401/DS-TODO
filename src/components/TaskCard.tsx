'use client';

import React from 'react';
import { Task, User } from '@/types';
import { 
  Check, 
  Clock, 
  ExternalLink, 
  ShieldAlert, 
  AlertTriangle, 
  Trash2, 
  Zap, 
  Play, 
  Send,
  Bell,
  Link as LinkIcon,
  Edit2,
  X,
  Calendar 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '@/lib/sound';

interface TaskCardProps {
  task: Task;
  currentUser: User;
  onUpdateStatus: (taskId: string, newStatus: Task['status']) => void;
  onOpenBlockerModal: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onSendNudge?: (targetUserId: string, taskTitle: string, taskId: string) => void;
  onUpdateDeliverableLink?: (taskId: string, link: string) => Promise<void>;
  onUpdateDueDate?: (taskId: string, newDueDate: string) => Promise<void>;
  onUpdateTitle?: (taskId: string, newTitle: string) => Promise<void>;
  onToggleUrgent?: (taskId: string, isUrgent: boolean) => Promise<void>;
  onResolveBlocker?: (blockerId: string) => Promise<void>;
  soundEnabled: boolean;
}

export function TaskCard({
  task,
  currentUser,
  onUpdateStatus,
  onOpenBlockerModal,
  onDeleteTask,
  onSendNudge,
  onUpdateDeliverableLink,
  onUpdateDueDate,
  onUpdateTitle,
  onToggleUrgent,
  onResolveBlocker,
  soundEnabled,
}: TaskCardProps) {
  const [nudgeSent, setNudgeSent] = React.useState(false);
  const [isEditingLink, setIsEditingLink] = React.useState(false);
  const [linkInput, setLinkInput] = React.useState(task.deliverable_link || '');
  const [isEditingDueDate, setIsEditingDueDate] = React.useState(false);
  const [dueDateInput, setDueDateInput] = React.useState(task.due_date || '');
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState(task.title);
  const isSelfTask = task.creator_id === task.assignee_id;
  const isDone = task.status === 'DONE';
  const isBlocked = Boolean(task.active_blocker);
  const isReview = task.status === 'NEEDS_REVIEW';
  const isInProgress = task.status === 'IN_PROGRESS' && !isBlocked;

  const canModifyMeta = isSelfTask || currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN';

  const handleSaveTitle = async () => {
    if (onUpdateTitle && titleInput.trim() && titleInput.trim() !== task.title) {
      await onUpdateTitle(task.id, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleToggleUrgentClick = async () => {
    if (onToggleUrgent && canModifyMeta) {
      playSound.click(soundEnabled);
      await onToggleUrgent(task.id, !task.is_urgent);
    }
  };

  const handleSaveLink = async () => {
    let raw = linkInput.trim();
    if (raw && !raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = `https://${raw}`;
    }
    if (onUpdateDeliverableLink) {
      await onUpdateDeliverableLink(task.id, raw);
    }
    setLinkInput(raw);
    setIsEditingLink(false);
  };

  const handleSaveDueDate = async () => {
    if (onUpdateDueDate && dueDateInput) {
      await onUpdateDueDate(task.id, dueDateInput);
    }
    setIsEditingDueDate(false);
  };

  // Check if overdue (rolled over)
  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getLocalDateString();
  const isOverdue = !isDone && task.due_date < todayStr;

  // Check review aging (>24h amber, >48h red)
  let reviewAgingWarning = null;
  if (isReview && task.review_started_at) {
    const hours = (Date.now() - new Date(task.review_started_at).getTime()) / (1000 * 60 * 60);
    if (hours >= 48) {
      reviewAgingWarning = { level: 'red', text: `Pending review for ${Math.floor(hours)}h (Urgent)` };
    } else if (hours >= 24) {
      reviewAgingWarning = { level: 'amber', text: `Pending review for ${Math.floor(hours)}h` };
    }
  }

  // Handle checking off
  const handleCheck = () => {
    if (isDone) {
      onUpdateStatus(task.id, 'IN_PROGRESS');
      return;
    }

    playSound.pop(soundEnabled);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
    });

    // Employee tasks (including self-made) require manager/admin sign-off
    const needsReview = currentUser.role === 'EMPLOYEE' || !isSelfTask;
    onUpdateStatus(task.id, needsReview ? 'NEEDS_REVIEW' : 'DONE');
  };

  let statusClass = '';
  if (isDone) statusClass = 'status-done';
  else if (isBlocked) statusClass = 'status-blocked';
  else if (isReview) statusClass = 'status-review';
  else if (isInProgress) statusClass = 'status-in-progress';

  return (
    <div
      className={`glass-panel card-interactive ${statusClass}`}
      style={{
        padding: '0.95rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        width: '100%',
        borderRadius: '18px',
        border: '1.5px solid var(--border-subtle)',
      }}
    >
      {/* Left side: Checkbox + Title + Meta info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1, minWidth: '260px' }}>
        
        {/* Clay Tactile Checkbox Button */}
        <button
          onClick={handleCheck}
          title={
            isDone
              ? 'Mark In Progress'
              : isReview
              ? 'Awaiting Manager Review'
              : (currentUser.role === 'EMPLOYEE' || !isSelfTask)
              ? 'Submit for Review'
              : 'Mark Done'
          }
          style={{
            width: '26px',
            height: '26px',
            minHeight: '26px',
            minWidth: '26px',
            borderRadius: '9px',
            border: isDone
              ? '1px solid rgba(255,255,255,0.3)'
              : isReview
              ? '1px solid var(--accent-gold)'
              : '1px solid var(--border-subtle)',
            background: isDone
              ? 'var(--accent-green)'
              : isReview
              ? 'rgba(245, 158, 11, 0.15)'
              : 'var(--support-pill)',
            color: isReview ? 'var(--accent-gold)' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '2px',
            padding: 0,
            flexShrink: 0,
            boxShadow: isDone
              ? 'inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.5), inset -1.5px -1.5px 3px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(61, 139, 94, 0.25)'
              : 'inset 1.5px 1.5px 3px var(--clay-inner-shadow), inset -1px -1px 2px var(--clay-highlight)',
            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {isDone && <Check size={15} strokeWidth={3} className="checkmark-path" />}
          {isReview && <Clock size={13} strokeWidth={2.5} />}
        </button>

        {/* Task Details */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {!isEditingTitle ? (
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  lineHeight: 1.4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>{task.title}</span>
                {canModifyMeta && !isDone && (
                  <button
                    type="button"
                    onClick={() => {
                      setTitleInput(task.title);
                      setIsEditingTitle(true);
                    }}
                    title="Edit deliverable title"
                    style={{
                      minHeight: '20px',
                      minWidth: '20px',
                      padding: 0,
                      color: 'var(--text-dim)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <Edit2 size={11} />
                  </button>
                )}
              </span>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--support-pill)', padding: '0.15rem 0.4rem', borderRadius: '8px', border: '1.5px solid var(--border-active)' }}>
                <input
                  type="text"
                  autoFocus
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveTitle();
                    } else if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                    }
                  }}
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    padding: '0 0.2rem',
                    outline: 'none',
                    minWidth: '180px',
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  style={{
                    background: 'var(--accent-theme)',
                    color: 'var(--accent-contrast)',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    padding: '0.1rem',
                    cursor: 'pointer',
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            )}

            {/* Urgent P0 Flag & Toggle */}
            {task.is_urgent ? (
              <button
                type="button"
                onClick={handleToggleUrgentClick}
                title={canModifyMeta ? 'Click to unmark Urgent P0' : 'Urgent P0'}
                className="pill-badge pill-badge-urgent"
                style={{ cursor: canModifyMeta ? 'pointer' : 'default', border: 'none' }}
              >
                <Zap size={10} /> <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontWeight: 800, letterSpacing: '-0.02em' }}>P0</span> URGENT
              </button>
            ) : canModifyMeta && !isDone && (
              <button
                type="button"
                onClick={handleToggleUrgentClick}
                title="Mark as Urgent P0"
                className="pill-badge"
                style={{
                  cursor: 'pointer',
                  color: 'var(--text-dim)',
                  background: 'transparent',
                  border: '1px dashed var(--border-subtle)',
                }}
              >
                <Zap size={10} /> + P0
              </button>
            )}

            {/* Overdue Rollover Flag */}
            {isOverdue && (
              <span className="pill-badge pill-badge-warning">
                <AlertTriangle size={10} /> ROLLED OVER
              </span>
            )}

            {/* Revisions Requested Flag */}
            {task.revision_note && task.status === 'IN_PROGRESS' && (
              <span className="pill-badge pill-badge-warning">
                ✍️ REVISIONS REQUESTED
              </span>
            )}

            {/* Deadline Extended by Manager Flag */}
            {task.deadline_extended && (
              <span
                className="pill-badge"
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--accent-theme)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontWeight: 650,
                  fontSize: '0.72rem',
                }}
              >
                🛡️ Deadline Extended by Manager
              </span>
            )}

            {/* Kudos Badge Awarded */}
            {task.kudos_badge && (
              <span
                className="pill-badge"
                style={{
                  background: 'rgba(236, 72, 153, 0.15)',
                  color: 'var(--accent-purple)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              >
                🏅 {task.kudos_badge.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Subtitle / Assignee / Blocker Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
            {!isEditingDueDate ? (
              (currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN' || isSelfTask) && !isDone ? (
                <button
                  type="button"
                  onClick={() => {
                    setDueDateInput(task.due_date || '');
                    setIsEditingDueDate(true);
                  }}
                  title={currentUser.role === 'EMPLOYEE' ? 'Change due date' : 'Extend deliverable deadline'}
                  className="pill-badge tabular-numbers"
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Calendar size={11} color="var(--text-dim)" />
                  <span>Due: {task.due_date}</span>
                </button>
              ) : (
                <span className="pill-badge tabular-numbers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={11} color="var(--text-dim)" />
                  <span>Due: {task.due_date}</span>
                </span>
              )
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--support-pill)', padding: '0.15rem 0.4rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <input
                  type="date"
                  autoFocus
                  value={dueDateInput}
                  onChange={(e) => setDueDateInput(e.target.value)}
                  style={{
                    fontSize: '0.74rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    padding: '0 0.2rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveDueDate}
                  style={{
                    background: 'var(--accent-theme)',
                    color: 'var(--accent-contrast)',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDueDate(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    padding: '0.1rem',
                    cursor: 'pointer',
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            )}

            {!isSelfTask && (
              <span className="pill-badge">
                By: {task.creator_name}
              </span>
            )}

            {/* Deliverable Link Display & Edit */}
            {task.deliverable_link && !isEditingLink && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <a
                  href={task.deliverable_link}
                  target="_blank"
                  rel="noreferrer"
                  className="pill-badge"
                  style={{ color: 'var(--accent-theme)' }}
                >
                  <ExternalLink size={11} /> Asset Link ↗
                </a>
                {!isDone && (
                  <button
                    onClick={() => {
                      setLinkInput(task.deliverable_link || '');
                      setIsEditingLink(true);
                    }}
                    title="Edit deliverable URL"
                    style={{ minHeight: '20px', minWidth: '20px', padding: 0, color: 'var(--text-dim)' }}
                  >
                    <Edit2 size={11} />
                  </button>
                )}
              </div>
            )}

            {/* Quick Attach Link Button if no link yet */}
            {!task.deliverable_link && !isEditingLink && !isDone && (
              <button
                onClick={() => setIsEditingLink(true)}
                title="Attach deliverable asset (Drive, Figma, Loom, etc.)"
                className="pill-badge"
                style={{
                  color: 'var(--accent-theme)',
                  cursor: 'pointer',
                  minHeight: '24px',
                }}
              >
                <LinkIcon size={11} color="var(--accent-theme)" />
                <span>+ Attach Asset</span>
              </button>
            )}

            {/* Active Blocker Notice */}
            {isBlocked && (
              <span style={{ color: 'var(--accent-red)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShieldAlert size={13} />
                Blocked by {task.active_blocker?.blocked_by_type === 'COLLEAGUE' ? task.active_blocker.blocking_user_name : 'Client'}: &ldquo;{task.active_blocker?.reason}&rdquo;
              </span>
            )}

            {/* Review Stagnation Warning */}
            {reviewAgingWarning && (
              <span style={{ color: reviewAgingWarning.level === 'red' ? 'var(--accent-red)' : 'var(--accent-amber)', fontWeight: 600 }}>
                ⚠️ {reviewAgingWarning.text}
              </span>
            )}

            {/* Revision Requested Note */}
            {task.revision_note && task.status === 'IN_PROGRESS' && (
              <span
                className="pill-badge pill-badge-warning"
                style={{
                  color: 'var(--accent-amber)',
                  fontWeight: 650,
                  fontSize: '0.78rem',
                  maxWidth: '100%',
                  whiteSpace: 'normal',
                }}
              >
                ✍️ Revision Note: &ldquo;{task.revision_note}&rdquo;
              </span>
            )}
          </div>

          {/* Inline Link Input with High-Visibility Glowing Indicator */}
          {isEditingLink && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                marginTop: '0.55rem',
                padding: '0.35rem 0.6rem',
                background: 'rgba(0, 0, 0, 0.45)',
                borderRadius: '8px',
                border: '1.5px solid var(--border-active)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  background: 'var(--support-pill)',
                  color: 'var(--accent-theme)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '5px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <LinkIcon size={12} strokeWidth={2.5} />
                <span>Asset URL</span>
              </div>
              <input
                type="url"
                autoFocus
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste Google Drive, Figma, Loom, YouTube link..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveLink();
                  } else if (e.key === 'Escape') {
                    setIsEditingLink(false);
                  }
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.84rem',
                  color: 'var(--text-main)',
                  padding: '0.2rem 0.4rem',
                }}
              />
              <button
                onClick={handleSaveLink}
                style={{
                  background: 'var(--accent-gradient)',
                  color: 'var(--accent-contrast)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  padding: '0.25rem 0.85rem',
                  minHeight: '28px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                }}
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingLink(false)}
                title="Cancel"
                style={{
                  minHeight: '28px',
                  minWidth: '28px',
                  padding: 0,
                  color: 'var(--text-dim)',
                  borderRadius: '6px',
                }}
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Action Triggers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        
        {/* If TODO -> Start In Progress */}
        {task.status === 'TODO' && (
          <button
            onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
            style={{
              padding: '0.3rem 0.8rem',
              minHeight: '32px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              background: 'var(--support-pill)',
              color: 'var(--accent-theme)',
              border: '1px solid var(--border-active)',
              fontWeight: 600,
            }}
          >
            <Play size={12} />
            <span>Start</span>
          </button>
        )}

        {/* If IN_PROGRESS -> Can flag Blocked or Submit for Review */}
        {isInProgress && (
          <>
            <button
              onClick={() => onOpenBlockerModal(task)}
              title="Report Blocker"
              style={{
                padding: '0.3rem 0.75rem',
                minHeight: '32px',
                fontSize: '0.78rem',
                borderRadius: '6px',
                background: 'rgba(225, 29, 72, 0.1)',
                color: 'var(--accent-red)',
                border: '1px solid rgba(225, 29, 72, 0.25)',
                fontWeight: 600,
              }}
            >
              <ShieldAlert size={13} />
              <span>Blocked?</span>
            </button>

            {(currentUser.role === 'EMPLOYEE' || !isSelfTask) ? (
              <button
                onClick={() => onUpdateStatus(task.id, 'NEEDS_REVIEW')}
                style={{
                  padding: '0.3rem 0.9rem',
                  minHeight: '32px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  background: 'var(--accent-gradient)',
                  color: 'var(--accent-contrast)',
                  fontWeight: 700,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                <Send size={12} />
                <span>Submit for Review</span>
              </button>
            ) : (
              <button
                onClick={handleCheck}
                style={{
                  padding: '0.3rem 0.85rem',
                  minHeight: '32px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-green)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 600,
                }}
              >
                <Check size={13} />
                <span>Done</span>
              </button>
            )}
          </>
        )}

        {/* If Blocked -> Show Nudge button (if Colleague) and Resolve Blocker button */}
        {isBlocked && task.active_blocker && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {task.active_blocker.blocked_by_type === 'COLLEAGUE' && task.active_blocker.blocking_user_id && (
              <button
                onClick={() => {
                  playSound.sonar(soundEnabled);
                  onSendNudge?.(task.active_blocker!.blocking_user_id!, task.title, task.id);
                  setNudgeSent(true);
                  setTimeout(() => setNudgeSent(false), 3000);
                }}
                disabled={nudgeSent}
                title="Send a polite ping to the teammate holding this up"
                style={{
                  padding: '0.3rem 0.75rem',
                  minHeight: '32px',
                  fontSize: '0.78rem',
                  borderRadius: '6px',
                  background: nudgeSent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                  color: nudgeSent ? 'var(--accent-green)' : 'var(--accent-amber)',
                  border: nudgeSent ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)',
                  fontWeight: 600,
                }}
              >
                <Bell size={12} />
                <span>{nudgeSent ? 'Nudged! 🔔' : 'Nudge 🔔'}</span>
              </button>
            )}

            {(task.assignee_id === currentUser.id || currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN' || task.active_blocker.blocking_user_id === currentUser.id) && (
              <button
                onClick={() => {
                  playSound.unblock(soundEnabled);
                  onResolveBlocker?.(task.active_blocker!.id);
                }}
                title="Mark blocker resolved and resume task"
                style={{
                  padding: '0.3rem 0.75rem',
                  minHeight: '32px',
                  fontSize: '0.78rem',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-green)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 650,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Check size={12} />
                <span>Resolve Blocker</span>
              </button>
            )}
          </div>
        )}

        {/* Review Badge */}
        {isReview && (
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.1)' }}>
            <Clock size={13} /> Under Review
          </span>
        )}

        {/* Done Badge */}
        {isDone && (
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
            <Check size={14} /> Done
          </span>
        )}

        {/* Delete button (Protected: cannot delete manager tasks) */}
        {(isSelfTask || currentUser.role !== 'EMPLOYEE') && (
          <button
            onClick={() => onDeleteTask(task.id)}
            title="Delete task"
            style={{
              width: '34px',
              height: '34px',
              minHeight: '34px',
              minWidth: '34px',
              padding: 0,
              color: 'var(--text-dim)',
              borderRadius: '7px',
            }}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
