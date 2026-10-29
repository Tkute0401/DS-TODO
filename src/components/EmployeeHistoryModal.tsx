'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Task, User } from '@/types';
import { 
  X, 
  Search, 
  Calendar, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Zap, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flame,
  ListTodo
} from 'lucide-react';

interface EmployeeHistoryModalProps {
  member: User;
  tasks: Task[];
  allUsers: User[];
  currentUser: User;
  onClose: () => void;
  onOpenReviewModal?: (task: Task) => void;
  onUpdateDueDate?: (taskId: string, newDueDate: string) => Promise<void>;
  onReassignTask?: (taskId: string, newAssigneeId: string) => Promise<void>;
}

type TabType = 'ALL' | 'ONGOING' | 'BLOCKED' | 'REVIEW' | 'DONE';

export function EmployeeHistoryModal({
  member,
  tasks,
  allUsers,
  currentUser,
  onClose,
  onOpenReviewModal,
  onUpdateDueDate,
  onReassignTask,
}: EmployeeHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingDueDateTaskId, setEditingDueDateTaskId] = useState<string | null>(null);
  const [extendDateInput, setExtendDateInput] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  const PAGE_SIZE = 5;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Reset pagination when active filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute breakdown counts
  const counts = useMemo(() => {
    const total = tasks.length;
    const ongoing = tasks.filter((t) => (t.status === 'IN_PROGRESS' || t.status === 'TODO') && !t.active_blocker).length;
    const blocked = tasks.filter((t) => Boolean(t.active_blocker)).length;
    const review = tasks.filter((t) => t.status === 'NEEDS_REVIEW').length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 100;
    return { total, ongoing, blocked, review, done, rate };
  }, [tasks]);

  // Filter tasks based on active tab and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (activeTab === 'ONGOING') {
        if (t.status === 'DONE' || t.status === 'NEEDS_REVIEW' || Boolean(t.active_blocker)) return false;
      } else if (activeTab === 'BLOCKED') {
        if (!t.active_blocker) return false;
      } else if (activeTab === 'REVIEW') {
        if (t.status !== 'NEEDS_REVIEW') return false;
      } else if (activeTab === 'DONE') {
        if (t.status !== 'DONE') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchCreator = t.creator_name?.toLowerCase().includes(q);
        const matchLink = t.deliverable_link?.toLowerCase().includes(q);
        if (!matchTitle && !matchCreator && !matchLink) return false;
      }

      return true;
    });
  }, [tasks, activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, currentPage]);

  const getVisiblePages = (current: number, total: number): (number | string)[] => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);
    if (current > 3) pages.push('ellipsis-start');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('ellipsis-end');
    if (total > 1) pages.push(total);
    return pages;
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
          maxWidth: '720px',
          maxHeight: '92vh',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: 'inset 2px 2px 5px var(--clay-highlight), 0 24px 60px -12px var(--clay-drop-shadow)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'var(--support-pill)',
                color: 'var(--accent-theme)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.05rem',
                border: '1.5px solid var(--border-subtle)',
                boxShadow: 'inset 1.5px 1.5px 3px var(--clay-highlight)',
              }}
            >
              {member.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {member.name}
                </h2>
                <span className="pill-badge" style={{ fontSize: '0.7rem', color: 'var(--accent-theme)', fontWeight: 700 }}>
                  {member.role}
                </span>
                {member.current_streak > 0 && (
                  <span className="pill-badge" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-gold)' }}>
                    <Flame size={12} /> {member.current_streak}d streak
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {member.designation} &bull; <span style={{ color: 'var(--text-dim)' }}>{member.email}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close Deliverable History"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--support-pill)',
              cursor: 'pointer',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Body Container */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* KPI Summary Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.55rem' }}>
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '14px', background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Total Tasks</div>
              <div className="tabular-numbers" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{counts.total}</div>
            </div>
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--accent-theme)', fontWeight: 700, textTransform: 'uppercase' }}>Ongoing</div>
              <div className="tabular-numbers" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-theme)', marginTop: '2px' }}>{counts.ongoing}</div>
            </div>
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '14px', background: 'rgba(255, 71, 87, 0.08)', border: '1px solid rgba(255, 71, 87, 0.25)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--accent-red)', fontWeight: 700, textTransform: 'uppercase' }}>Blocked</div>
              <div className="tabular-numbers" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-red)', marginTop: '2px' }}>{counts.blocked}</div>
            </div>
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--accent-amber)', fontWeight: 700, textTransform: 'uppercase' }}>Review</div>
              <div className="tabular-numbers" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '2px' }}>{counts.review}</div>
            </div>
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--accent-green)', fontWeight: 700, textTransform: 'uppercase' }}>Done</div>
              <div className="tabular-numbers" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: '2px' }}>{counts.done} ({counts.rate}%)</div>
            </div>
          </div>

          {/* Filter Pills & Instant Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
              {(['ALL', 'ONGOING', 'BLOCKED', 'REVIEW', 'DONE'] as const).map((tab) => {
                const isSelected = activeTab === tab;
                const count = tab === 'ALL' ? counts.total : tab === 'ONGOING' ? counts.ongoing : tab === 'BLOCKED' ? counts.blocked : tab === 'REVIEW' ? counts.review : counts.done;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`filter-pill ${isSelected ? 'filter-pill-active' : ''}`}
                    style={{
                      fontSize: '0.76rem',
                      padding: '0.35rem 0.75rem',
                      minHeight: '30px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>{tab === 'ALL' ? 'All Tasks' : tab === 'ONGOING' ? 'Ongoing' : tab === 'BLOCKED' ? 'Blocked' : tab === 'REVIEW' ? 'Review' : 'Done'}</span>
                    <span style={{ fontSize: '0.68rem', opacity: isSelected ? 1 : 0.65 }} className="tabular-numbers">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--support-pill)',
                padding: '0.35rem 0.75rem',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                minWidth: '200px',
                flex: 1,
                maxWidth: '280px',
              }}
            >
              <Search size={13} color="var(--text-dim)" />
              <input
                type="text"
                placeholder="Search deliverables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Task History List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {paginatedTasks.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  color: 'var(--text-dim)',
                  borderRadius: '16px',
                  background: 'var(--support-pill)',
                  border: '1px dashed var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>📭</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>No Deliverables Found</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {searchQuery ? 'Try clearing your search query.' : 'This employee has no tasks matching this filter.'}
                </div>
              </div>
            ) : (
              paginatedTasks.map((t) => {
                const isDone = t.status === 'DONE';
                const isBlocked = Boolean(t.active_blocker);
                const isReview = t.status === 'NEEDS_REVIEW';
                const isOverdue = !isDone && t.due_date < todayStr;
                const isSelfMade = t.creator_id === t.assignee_id;

                const borderLeftColor = isBlocked
                  ? 'var(--accent-red)'
                  : isReview
                  ? 'var(--accent-gold)'
                  : isDone
                  ? 'var(--accent-green)'
                  : 'var(--accent-theme)';

                return (
                  <div
                    key={t.id}
                    style={{
                      background: 'var(--support-pill)',
                      borderRadius: '14px',
                      borderLeft: `4px solid ${borderLeftColor}`,
                      borderTop: '1px solid var(--border-subtle)',
                      borderRight: '1px solid var(--border-subtle)',
                      borderBottom: '1px solid var(--border-subtle)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem',
                      boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
                    }}
                  >
                    {/* Top Tier: Title, Status Badge & Priority */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.65rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}>
                            {t.title}
                          </span>
                          {t.is_urgent && (
                            <span className="pill-badge pill-badge-urgent" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                              <Zap size={10} /> P0 URGENT
                            </span>
                          )}
                          {isOverdue && (
                            <span className="pill-badge pill-badge-warning" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                              <AlertTriangle size={10} /> ROLLED OVER
                            </span>
                          )}
                          {isSelfMade && (
                            <span style={{ fontSize: '0.66rem', padding: '0.1rem 0.4rem', borderRadius: '5px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple, #8b5cf6)', fontWeight: 650 }}>
                              Self-Made
                            </span>
                          )}
                        </div>

                        {/* Subtitle meta */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: '0.3rem', fontSize: '0.74rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={11} color="var(--text-dim)" />
                            Due: <strong className="tabular-numbers" style={{ color: 'var(--text-main)' }}>{t.due_date}</strong>
                          </span>
                          {t.creator_name && t.creator_id !== t.assignee_id && (
                            <span>Created by: {t.creator_name}</span>
                          )}
                          {t.completed_at && (
                            <span style={{ color: 'var(--accent-green)', fontWeight: 650 }}>
                              ✓ Completed {t.completed_at.split('T')[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className="pill-badge"
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 750,
                          flexShrink: 0,
                          background: isBlocked
                            ? 'rgba(255, 71, 87, 0.15)'
                            : isReview
                            ? 'rgba(245, 158, 11, 0.15)'
                            : isDone
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(56, 189, 248, 0.15)',
                          color: isBlocked
                            ? 'var(--accent-red)'
                            : isReview
                            ? 'var(--accent-amber)'
                            : isDone
                            ? 'var(--accent-green)'
                            : 'var(--accent-theme)',
                          border: `1px solid ${borderLeftColor}`,
                        }}
                      >
                        {isBlocked ? '🛡️ BLOCKED' : isReview ? '⏳ IN REVIEW' : isDone ? '✓ DONE' : '⚡ IN PROGRESS'}
                      </span>
                    </div>

                    {/* Blocker alert box if blocked */}
                    {isBlocked && (
                      <div
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 71, 87, 0.12)',
                          fontSize: '0.76rem',
                          color: 'var(--accent-red)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <ShieldAlert size={13} />
                        <span>Blocked by {t.active_blocker?.blocked_by_type === 'COLLEAGUE' ? t.active_blocker.blocking_user_name : 'Client'}: &ldquo;{t.active_blocker?.reason}&rdquo;</span>
                      </div>
                    )}

                    {/* Revision Note box if requested */}
                    {t.revision_note && (
                      <div
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: '8px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          fontSize: '0.76rem',
                          color: 'var(--accent-amber)',
                          fontWeight: 650,
                        }}
                      >
                        ⚠️ Manager Revision Note: &ldquo;{t.revision_note}&rdquo;
                      </div>
                    )}

                    {/* Bottom Actions: Deliverable Link + Extend + Review + Reassign */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <div>
                        {t.deliverable_link ? (
                          <a
                            href={t.deliverable_link}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '0.76rem',
                              color: 'var(--accent-theme)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontWeight: 650,
                            }}
                          >
                            <ExternalLink size={12} /> Asset Link ↗
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>No asset link</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {/* Extend Due Date Trigger */}
                        {onUpdateDueDate && !isDone && (
                          editingDueDateTaskId === t.id ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-card)', padding: '0.12rem 0.3rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                              <input
                                type="date"
                                autoFocus
                                value={extendDateInput}
                                onChange={(e) => setExtendDateInput(e.target.value)}
                                style={{
                                  fontSize: '0.72rem',
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-main)',
                                  outline: 'none',
                                }}
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  if (extendDateInput.trim()) {
                                    await onUpdateDueDate(t.id, extendDateInput.trim());
                                  }
                                  setEditingDueDateTaskId(null);
                                }}
                                style={{
                                  background: 'var(--accent-theme)',
                                  color: 'var(--accent-contrast)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.35rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingDueDateTaskId(null)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', padding: '0.1rem', cursor: 'pointer' }}
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const parts = t.due_date.split('-').map(Number);
                                const nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1);
                                const formatted = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
                                setExtendDateInput(formatted);
                                setEditingDueDateTaskId(t.id);
                              }}
                              title="Extend deadline"
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.18rem 0.5rem',
                                borderRadius: '6px',
                                background: 'rgba(56, 189, 248, 0.12)',
                                color: 'var(--accent-theme)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                fontWeight: 650,
                                cursor: 'pointer',
                              }}
                            >
                              + Extend
                            </button>
                          )
                        )}

                        {/* Review / Revise Sign-Off Button */}
                        {onOpenReviewModal && (currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
                          <button
                            type="button"
                            onClick={() => onOpenReviewModal(t)}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.18rem 0.55rem',
                              borderRadius: '6px',
                              background: isReview ? 'var(--accent-theme)' : 'rgba(245, 158, 11, 0.14)',
                              color: isReview ? 'var(--accent-contrast)' : 'var(--accent-amber)',
                              border: isReview ? 'none' : '1px solid rgba(245, 158, 11, 0.35)',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {isReview ? 'Review & Sign-Off' : isDone ? 'Reopen' : 'Revise'}
                          </button>
                        )}

                        {/* Reassign select */}
                        {onReassignTask && (currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && !isDone && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) onReassignTask(t.id, e.target.value);
                            }}
                            title="Reassign to another teammate"
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.18rem 0.4rem',
                              borderRadius: '6px',
                              background: 'rgba(139, 92, 246, 0.12)',
                              color: 'var(--accent-purple, #8b5cf6)',
                              border: '1px solid rgba(139, 92, 246, 0.35)',
                              fontWeight: 650,
                              cursor: 'pointer',
                              maxWidth: '110px',
                            }}
                          >
                            <option value="" disabled>Reassign ➔</option>
                            {allUsers
                              .filter((u) => u.is_active !== false && u.id !== member.id)
                              .map((u) => (
                                <option key={u.id} value={u.id} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                                  {u.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer: Pagination Controls */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing{' '}
            <strong className="tabular-numbers" style={{ color: 'var(--text-main)' }}>
              {filteredTasks.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            </strong>
            –
            <strong className="tabular-numbers" style={{ color: 'var(--text-main)' }}>
              {Math.min(currentPage * PAGE_SIZE, filteredTasks.length)}
            </strong>{' '}
            of <strong className="tabular-numbers" style={{ color: 'var(--text-main)' }}>{filteredTasks.length}</strong> tasks
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="btn-icon"
              style={{
                padding: '0.3rem 0.65rem',
                minHeight: '32px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 650,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                background: 'var(--support-pill)',
                border: '1px solid var(--border-subtle)',
                color: currentPage <= 1 ? 'var(--text-dim)' : 'var(--text-main)',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.45 : 1,
              }}
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>

            {/* Page number buttons */}
            {getVisiblePages(currentPage, totalPages).map((p, idx) => {
              if (typeof p === 'string') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    style={{
                      width: '24px',
                      textAlign: 'center',
                      color: 'var(--text-dim)',
                      fontSize: '0.8rem',
                      userSelect: 'none',
                    }}
                  >
                    …
                  </span>
                );
              }
              const isCurrent = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: isCurrent ? 800 : 600,
                    background: isCurrent ? 'var(--accent-theme)' : 'var(--support-pill)',
                    color: isCurrent ? 'var(--accent-contrast)' : 'var(--text-main)',
                    border: isCurrent ? '1px solid var(--accent-theme)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    boxShadow: isCurrent ? '0 2px 6px var(--accent-glow)' : 'none',
                  }}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="btn-icon"
              style={{
                padding: '0.3rem 0.65rem',
                minHeight: '32px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 650,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                background: 'var(--support-pill)',
                border: '1px solid var(--border-subtle)',
                color: currentPage >= totalPages ? 'var(--text-dim)' : 'var(--text-main)',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.45 : 1,
              }}
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
