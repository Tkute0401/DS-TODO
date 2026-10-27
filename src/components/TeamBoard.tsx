'use client';

import React, { useState } from 'react';
import { Task, User } from '@/types';
import { 
  ShieldAlert, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Plus, 
  PhoneCall, 
  MessageCircle, 
  AlertOctagon, 
  Flame,
  Archive,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface TeamBoardProps {
  currentUser: User;
  allUsers: User[];
  allTasks: Task[];
  onOpenReviewModal: (task: Task) => void;
  onOpenAssignModal: (assigneeId: string) => void;
  onOpenBlockerModal: (task: Task) => void;
  onArchiveUser?: (userId: string, is_active: boolean) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onUpdateDueDate?: (taskId: string, newDueDate: string) => Promise<void>;
  onReassignTask?: (taskId: string, newAssigneeId: string) => Promise<void>;
  onResolveBlocker?: (blockerId: string) => Promise<void>;
}

export function TeamBoard({
  currentUser,
  allUsers,
  allTasks,
  onOpenReviewModal,
  onOpenAssignModal,
  onOpenBlockerModal,
  onArchiveUser,
  onDeleteUser,
  onUpdateDueDate,
  onReassignTask,
  onResolveBlocker,
}: TeamBoardProps) {
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Review queue: all tasks pending verification
  const reviewTasks = allTasks.filter((t) => t.status === 'NEEDS_REVIEW');

  // Active blockers across firm
  const activeBlockers = allTasks.filter((t) => Boolean(t.active_blocker));

  // Admin bottleneck items (>24h in review or >12h blocked)
  const bottleneckItems = reviewTasks.filter((t) => {
    if (!t.review_started_at) return false;
    const hours = (Date.now() - new Date(t.review_started_at).getTime()) / (1000 * 60 * 60);
    return hours >= 24;
  });

  return (
    <div style={{ width: '100%', margin: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Admin Super-Visibility: Bottleneck Widget */}
      {currentUser.role === 'ADMIN' && (bottleneckItems.length > 0 || activeBlockers.length > 0) && (
        <div
          className="glass-panel"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.08) 0%, var(--bg-card) 100%)',
            border: '1.5px solid rgba(255, 71, 87, 0.28)',
            padding: '1.1rem 1.35rem',
            borderRadius: '20px',
            boxShadow: 'inset 2px 2px 5px var(--clay-highlight), 0 10px 24px -4px var(--clay-drop-shadow)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <AlertOctagon size={18} color="var(--accent-red)" />
            <span style={{ fontWeight: 750, fontSize: '0.96rem', color: 'var(--text-main)' }}>
              Coordination &amp; Blockers Radar
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {bottleneckItems.map((t) => {
              const hours = Math.floor((Date.now() - new Date(t.review_started_at!).getTime()) / (1000 * 60 * 60));
              return (
                <div
                  key={t.id}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '0.75rem 1rem',
                    borderRadius: '16px',
                    borderLeft: '4px solid var(--accent-red)',
                    boxShadow: 'inset 1.5px 1.5px 3px var(--clay-highlight), 0 3px 8px var(--clay-drop-shadow-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{t.title}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--accent-amber)', marginTop: '0.2rem', fontWeight: 600 }}>
                      ⚠️ Waiting on review for {hours}h (Assignee: {t.assignee_name})
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenReviewModal(t)}
                    className="btn-accent"
                    style={{
                      fontSize: '0.74rem',
                      padding: '0.3rem 0.75rem',
                      minHeight: '28px',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Review Now
                  </button>
                </div>
              );
            })}

            {activeBlockers.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg-card)',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px',
                  borderLeft: '4px solid var(--accent-amber)',
                  boxShadow: 'inset 1.5px 1.5px 3px var(--clay-highlight), 0 3px 8px var(--clay-drop-shadow-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{t.title}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--accent-red)', marginTop: '0.2rem', fontWeight: 600 }}>
                    🚨 Blocked by {t.active_blocker?.blocked_by_type === 'COLLEAGUE' ? (t.active_blocker.blocking_user_name || 'Colleague') : t.active_blocker?.blocked_by_type}: &ldquo;{t.active_blocker?.reason}&rdquo; (Assignee: {t.assignee_name})
                  </div>
                </div>
                {onResolveBlocker && (
                  <button
                    onClick={() => onResolveBlocker(t.active_blocker!.id)}
                    className="btn-clay"
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '0.3rem 0.65rem',
                      minHeight: '28px',
                      color: 'var(--accent-green)',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      flexShrink: 0,
                    }}
                  >
                    Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Review Queue (Manager Sign-Off Shelf) */}
      {reviewTasks.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--accent-gold)" />
              <span>Review &amp; Sign-Off Queue ({reviewTasks.length} Pending)</span>
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.75rem' }}>
            {reviewTasks.map((t) => {
              const hoursInReview = t.review_started_at
                ? (Date.now() - new Date(t.review_started_at).getTime()) / (1000 * 60 * 60)
                : 0;
              const isOver48h = hoursInReview >= 48;
              const isOver24h = hoursInReview >= 24;
              const borderLeftColor = isOver48h
                ? 'var(--accent-red)'
                : isOver24h
                ? 'var(--accent-amber)'
                : 'var(--accent-gold)';

              return (
                <div
                  key={t.id}
                  className="glass-panel"
                  style={{
                    borderLeft: `4px solid ${borderLeftColor}`,
                    padding: '1.15rem 1.25rem',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 750, fontSize: '0.96rem' }}>{t.title}</div>
                      <span
                        className={`pill-badge ${isOver48h ? 'pill-badge-urgent' : isOver24h ? 'pill-badge-warning' : ''}`}
                        style={!isOver48h && !isOver24h ? { background: 'rgba(236, 204, 104, 0.15)', color: 'var(--accent-gold)' } : undefined}
                      >
                        {isOver48h ? `🚨 Stagnant (${Math.floor(hoursInReview)}h)` : isOver24h ? `⚠️ Aging (${Math.floor(hoursInReview)}h)` : 'Needs Verification'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span>Submitted by: <strong style={{ color: 'var(--text-main)' }}>{t.assignee_name}</strong> ({t.assignee_designation})</span>
                      {t.creator_id === t.assignee_id && (
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple, #8b5cf6)', fontWeight: 700 }}>
                          Self-Made
                        </span>
                      )}
                    </div>
                  </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {t.deliverable_link ? (
                    <a
                      href={t.deliverable_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.84rem', color: 'var(--accent-theme)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 650 }}
                    >
                      <ExternalLink size={13} /> Open Asset ↗
                    </a>
                  ) : <span />}

                  <button
                    onClick={() => onOpenReviewModal(t)}
                    className="btn-accent"
                    style={{
                      fontSize: '0.82rem',
                      padding: '0.4rem 1rem',
                      minHeight: '36px',
                      borderRadius: '12px',
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Review &amp; Sign-Off</span>
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* 3. People-First Command Grid */}
      <div>
        <h3
          className="theme-heading section-title-neutral"
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>Team Workload &amp; Active Deliverables</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {allUsers.map((member) => {
            const memberTasks = allTasks.filter((t) => t.assignee_id === member.id);
            const inProgressTasks = memberTasks.filter((t) => t.status === 'IN_PROGRESS' && !t.active_blocker);
            const blockedTasks = memberTasks.filter((t) => Boolean(t.active_blocker));
            const reviewMemberTasks = memberTasks.filter((t) => t.status === 'NEEDS_REVIEW');
            const doneMemberTasks = memberTasks.filter((t) => t.status === 'DONE');

            const streak = member.current_streak || 0;
            const flameClass = streak >= 8 ? 'flame-supernova' : streak >= 4 ? 'flame-blaze' : 'flame-spark';

            return (
              <div
                key={member.id}
                className="glass-panel"
                style={{
                  padding: '1.2rem',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                }}
              >
                {/* Person Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: 'var(--support-pill)',
                      color: 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 750,
                      fontSize: '0.98rem',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'inset 1.5px 1.5px 3px var(--clay-highlight), 0 3px 8px var(--clay-drop-shadow-soft)',
                    }}>
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span title={member.name} style={{ fontWeight: 750, fontSize: '0.96rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                          {member.name.split(' ')[0]}
                        </span>
                        {member.is_on_leave && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.12rem 0.5rem',
                              borderRadius: '999px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: 'var(--accent-amber)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            🌴 On Leave (Frozen)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-theme)', fontWeight: 600 }}>{member.designation}</div>
                    </div>
                  </div>

                  {/* Actions: Streak + WhatsApp/Call */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div title={`${streak} Days On-Time Streak`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 700, padding: '0.3rem 0.6rem', background: 'var(--support-pill)', borderRadius: '999px', border: '1px solid var(--border-subtle)', boxShadow: 'inset 1px 1px 2px var(--clay-highlight)' }}>
                      <Flame className={flameClass} size={15} />
                      <span>{streak}d</span>
                    </div>

                    {member.phone && (
                      <a
                        href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Chat on WhatsApp"
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--accent-green)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}

                    {/* Admin Employee Archive & Delete Controls */}
                    {currentUser.role === 'ADMIN' && member.id !== currentUser.id && (
                      <>
                        {onArchiveUser && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Archive "${member.name}"? They will be deactivated from active task rosters.`)) {
                                onArchiveUser(member.id, false);
                              }
                            }}
                            title="Archive Employee"
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: 'var(--accent-amber)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Archive size={15} />
                          </button>
                        )}
                        {onDeleteUser && (
                          <button
                            type="button"
                            onClick={() => setMemberToDelete(member)}
                            title="Permanently Delete Employee"
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: 'rgba(255, 71, 87, 0.15)',
                              color: 'var(--accent-red)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Person's Tasks Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '90px' }}>
                  
                  {/* Blocked Items (Red Alert) */}
                  {blockedTasks.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 71, 87, 0.12)',
                        borderLeft: '4px solid var(--accent-red)',
                        fontSize: '0.84rem',
                        boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.title}</div>
                      <div style={{ color: 'var(--accent-red)', fontSize: '0.76rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 650 }}>
                        <ShieldAlert size={12} />
                        Blocked by {t.active_blocker?.blocked_by_type === 'COLLEAGUE' ? t.active_blocker.blocking_user_name : 'Client'}
                      </div>
                    </div>
                  ))}

                  {/* In Progress Items */}
                  {inProgressTasks.map((t) => {
                    const isSelfMade = t.creator_id === t.assignee_id;
                    return (
                      <div
                        key={t.id}
                        style={{
                          padding: '0.75rem 0.85rem',
                          borderRadius: '12px',
                          background: 'var(--support-pill)',
                          borderLeft: '4px solid var(--accent-theme)',
                          fontSize: '0.84rem',
                          boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        {/* Top Tier: Full-Width Title and Meta */}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', lineHeight: 1.35 }}>
                            <span>{t.title}</span>
                            {isSelfMade && (
                              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple, #8b5cf6)', fontWeight: 650 }}>
                                Self-Made
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '0.25rem', fontWeight: 550, display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span>Due: <span className="tabular-numbers">{t.due_date}</span></span>
                            {t.is_urgent && <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>• ⚡ P0 Urgent</span>}
                            {t.deadline_extended && (
                              <span style={{ color: 'var(--accent-theme)', fontWeight: 650 }}>
                                • 🛡️ Extended by Manager
                              </span>
                            )}
                            {t.revision_note && (
                              <span style={{ color: 'var(--accent-amber)', fontWeight: 650 }}>
                                • ⚠️ Revision: &ldquo;{t.revision_note}&rdquo;
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Tier: Structured Action Controls */}
                        {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
                            {onUpdateDueDate && (
                              <button
                                type="button"
                                onClick={() => {
                                  const parts = t.due_date.split('-').map(Number);
                                  const nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1);
                                  const formatted = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
                                  const newDate = window.prompt(`Extend deadline for "${t.title}" (YYYY-MM-DD):`, formatted);
                                  if (newDate && newDate.trim()) {
                                    onUpdateDueDate(t.id, newDate.trim());
                                  }
                                }}
                                title="Extend deliverable deadline"
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.22rem 0.55rem',
                                  borderRadius: '8px',
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  color: 'var(--accent-theme)',
                                  border: '1px solid rgba(56, 189, 248, 0.3)',
                                  fontWeight: 650,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                + Extend
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenReviewModal(t)}
                              title="Provide revision note on this task"
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.22rem 0.55rem',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.14)',
                                color: 'var(--accent-amber)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                fontWeight: 650,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Revise
                            </button>
                            {onReassignTask && (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    onReassignTask(t.id, e.target.value);
                                  }
                                }}
                                title="Reassign task to another teammate"
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.22rem 0.45rem',
                                  borderRadius: '8px',
                                  background: 'rgba(139, 92, 246, 0.12)',
                                  color: 'var(--accent-purple, #8b5cf6)',
                                  border: '1px solid rgba(139, 92, 246, 0.35)',
                                  fontWeight: 650,
                                  cursor: 'pointer',
                                  maxWidth: '120px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
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
                        )}
                      </div>
                    );
                  })}

                  {/* Under Review Items */}
                  {reviewMemberTasks.map((t) => {
                    const isSelfMade = t.creator_id === t.assignee_id;
                    return (
                      <div
                        key={t.id}
                        style={{
                          padding: '0.75rem 0.85rem',
                          borderRadius: '12px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          borderLeft: '4px solid var(--accent-gold)',
                          fontSize: '0.84rem',
                          boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', lineHeight: 1.35 }}>
                            <span>{t.title}</span>
                            {isSelfMade && (
                              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple, #8b5cf6)', fontWeight: 650 }}>
                                Self-Made
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'var(--accent-amber)', fontSize: '0.74rem', marginTop: '0.2rem', fontWeight: 650 }}>
                            Submitted for review
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
                          <button
                            type="button"
                            onClick={() => onOpenReviewModal(t)}
                            className="btn-accent"
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.22rem 0.65rem',
                              borderRadius: '8px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Review / Revise
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Recently Completed Items */}
                  {doneMemberTasks.slice(0, 2).map((t) => {
                    const isSelfMade = t.creator_id === t.assignee_id;
                    return (
                      <div
                        key={t.id}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          borderLeft: '4px solid var(--accent-green)',
                          fontSize: '0.82rem',
                          boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <div style={{ fontWeight: 650, color: 'var(--text-muted)', textDecoration: 'line-through', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', lineHeight: 1.35 }}>
                            <span>{t.title}</span>
                            {isSelfMade && (
                              <span style={{ fontSize: '0.65rem', textDecoration: 'none', padding: '0.1rem 0.4rem', borderRadius: '5px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple, #8b5cf6)', fontWeight: 600 }}>
                                Self-Made
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'var(--accent-green)', fontSize: '0.72rem', marginTop: '0.15rem', fontWeight: 600 }}>
                            Completed ✓
                          </div>
                        </div>

                        {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
                          <button
                            type="button"
                            onClick={() => onOpenReviewModal(t)}
                            title="Reopen and request revisions"
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.22rem 0.55rem',
                              borderRadius: '8px',
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: 'var(--accent-amber)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              fontWeight: 650,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            Revise
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {memberTasks.length === 0 && (
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem 0' }}>
                      No active tasks currently assigned.
                    </div>
                  )}
                </div>

                {/* Footer: Quick Assign Button */}
                <button
                  onClick={() => onOpenAssignModal(member.id)}
                  style={{
                    width: '100%',
                    background: 'var(--support-pill)',
                    border: '1.5px dashed var(--border-subtle)',
                    padding: '0.45rem',
                    minHeight: '36px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    fontWeight: 650,
                    boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
                  }}
                >
                  <Plus size={14} />
                  <span>Assign Task to {member.name.split(' ')[0]}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {memberToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1.5px solid rgba(255, 71, 87, 0.4)',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.25)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-red)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 71, 87, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>Delete Employee?</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>This action is permanent.</p>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              Are you sure you want to permanently delete <strong>{memberToDelete.name}</strong> ({memberToDelete.email})? Their user account and assignments will be removed.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                style={{
                  padding: '0.65rem',
                  borderRadius: '12px',
                  background: 'var(--support-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontWeight: 650,
                  fontSize: '0.85rem',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!onDeleteUser) return;
                  setIsDeleting(true);
                  try {
                    await onDeleteUser(memberToDelete.id);
                    setMemberToDelete(null);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                style={{
                  padding: '0.65rem',
                  borderRadius: '12px',
                  background: 'var(--accent-red)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 12px rgba(255, 71, 87, 0.3)',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
