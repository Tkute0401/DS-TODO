'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, ClientDeliverable, Task, DeliverableType, DeliverableStage } from '@/types';
import { 
  Briefcase, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Film, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Trash2, 
  Edit3, 
  X,
  Check,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '@/lib/sound';

interface ClientDeliverablesBoardProps {
  currentUser: User;
  soundEnabled: boolean;
  showErrorToast: (msg: string) => void;
  tasks?: Task[];
  onTasksChange?: () => void;
}

export function ClientDeliverablesBoard({
  currentUser,
  soundEnabled,
  showErrorToast,
  tasks = [],
  onTasksChange,
}: ClientDeliverablesBoardProps) {
  // Current active month formatted as YYYY-MM
  const currentActualMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentActualMonth);
  const [clients, setClients] = useState<ClientDeliverable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingClient, setEditingClient] = useState<ClientDeliverable | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClientDeliverable | null>(null);

  // Workflow pipeline states
  const [quickAddState, setQuickAddState] = useState<{ clientId: string; stage: DeliverableStage } | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddType, setQuickAddType] = useState<DeliverableType>('REEL');
  const [collapsedClients, setCollapsedClients] = useState<Record<string, boolean>>({});

  const toggleCollapseClient = (clientId: string) => {
    setCollapsedClients((prev) => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [targetReelsInput, setTargetReelsInput] = useState<number>(0);
  const [targetGraphicsInput, setTargetGraphicsInput] = useState<number>(0);
  const [notesInput, setNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasLoadedRef = React.useRef(false);

  // Fetch client deliverables for selected month
  const fetchMonthDeliverables = useCallback(async (monthStr: string, isSilent = false) => {
    if (!isSilent && !hasLoadedRef.current) {
      setIsLoading(true);
    }
    try {
      const res = await fetch(`/api/clients?month=${monthStr}`);
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
        hasLoadedRef.current = true;
      }
    } catch {
      showErrorToast('Failed to load client deliverables.');
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    fetchMonthDeliverables(selectedMonth);
  }, [selectedMonth, fetchMonthDeliverables]);

  // Navigate months
  const handleMonthStep = (step: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + step, 1);
    const nextMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextMonth);
  };

  // Month formatted title (e.g., "November 2026")
  const formattedMonthTitle = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const isPastMonth = selectedMonth < currentActualMonth;
  const isCurrentMonth = selectedMonth === currentActualMonth;

  // Aggregate metrics
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const targetReels = clients.reduce((acc, c) => acc + (c.target_reels || 0), 0);
    const completedReels = clients.reduce((acc, c) => acc + (c.completed_reels || 0), 0);
    const targetGraphics = clients.reduce((acc, c) => acc + (c.target_graphics || 0), 0);
    const completedGraphics = clients.reduce((acc, c) => acc + (c.completed_graphics || 0), 0);

    const totalTarget = targetReels + targetGraphics;
    const totalCompleted = completedReels + completedGraphics;
    const overallRate = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 100;

    const lackingClients = clients.filter((c) => {
      const reelsShort = (c.target_reels || 0) - (c.completed_reels || 0);
      const graphicsShort = (c.target_graphics || 0) - (c.completed_graphics || 0);
      return reelsShort > 0 || graphicsShort > 0;
    });

    return {
      totalClients,
      targetReels,
      completedReels,
      targetGraphics,
      completedGraphics,
      totalTarget,
      totalCompleted,
      overallRate,
      lackingCount: lackingClients.length,
    };
  }, [clients]);

  // Handle quick +/- increments
  const handleQuickDelta = async (client: ClientDeliverable, field: 'reels' | 'graphics', delta: number) => {
    playSound.pop(soundEnabled);
    // Optimistic UI update
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== client.id) return c;
        if (field === 'reels') {
          return { ...c, completed_reels: Math.max(0, (c.completed_reels || 0) + delta) };
        } else {
          return { ...c, completed_graphics: Math.max(0, (c.completed_graphics || 0) + delta) };
        }
      })
    );

    try {
      const res = await fetch('/api/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: client.id, field, delta }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.client) {
        setClients((prev) => prev.map((c) => (c.id === data.client.id ? data.client : c)));
      }
    } catch {
      showErrorToast('Failed to update deliverable counter.');
      fetchMonthDeliverables(selectedMonth);
    }
  };

  // Open Add modal
  const handleOpenAddModal = () => {
    setEditingClient(null);
    setNameInput('');
    setTargetReelsInput(4);
    setTargetGraphicsInput(8);
    setNotesInput('');
    setModalMode('create');
  };

  // Open Edit modal
  const handleOpenEditModal = (c: ClientDeliverable) => {
    setEditingClient(c);
    setNameInput(c.client_name);
    setTargetReelsInput(c.target_reels || 0);
    setTargetGraphicsInput(c.target_graphics || 0);
    setNotesInput(c.notes || '');
    setModalMode('edit');
  };

  // Save Client deliverable (Create or Edit)
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsSubmitting(true);
    playSound.pop(soundEnabled);

    try {
      const payload: Partial<ClientDeliverable> = {
        client_name: nameInput.trim(),
        month: selectedMonth,
        target_reels: Number(targetReelsInput) || 0,
        target_graphics: Number(targetGraphicsInput) || 0,
        notes: notesInput.trim() || undefined,
      };

      if (editingClient) {
        payload.id = editingClient.id;
        payload.completed_reels = editingClient.completed_reels;
        payload.completed_graphics = editingClient.completed_graphics;
      }

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        showErrorToast(err.error || 'Failed to save client deliverable.');
        return;
      }

      setModalMode(null);
      await fetchMonthDeliverables(selectedMonth);
    } catch {
      showErrorToast('Network error while saving client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete client deliverable
  const handleDeleteClient = async (scope: 'month' | 'all') => {
    if (!clientToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clients?id=${clientToDelete.id}&scope=${scope}`, { method: 'DELETE' });
      if (res.ok) {
        playSound.pop(soundEnabled);
        if (scope === 'all') {
          const targetName = clientToDelete.client_name.trim().toLowerCase();
          setClients((prev) => prev.filter((c) => c.client_name.trim().toLowerCase() !== targetName));
        } else {
          setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
        }
        setClientToDelete(null);
      } else {
        showErrorToast('Failed to remove client deliverable.');
      }
    } catch {
      showErrorToast('Network error removing client deliverable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pipeline Handlers
  const handleAdvanceTaskStage = async (taskId: string, currentStage: DeliverableStage) => {
    const nextStage: DeliverableStage =
      currentStage === 'PRE_PRODUCTION' ? 'PRODUCTION' : 'PUBLISHED';
    playSound.pop(soundEnabled);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverable_stage: nextStage }),
      });
      if (!res.ok) throw new Error();
      if (onTasksChange) onTasksChange();
      await fetchMonthDeliverables(selectedMonth);
    } catch {
      showErrorToast('Failed to advance workflow stage.');
    }
  };

  const handleUpdateTaskStageDirect = async (taskId: string, stage: DeliverableStage) => {
    playSound.pop(soundEnabled);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverable_stage: stage }),
      });
      if (!res.ok) throw new Error();
      if (onTasksChange) onTasksChange();
      await fetchMonthDeliverables(selectedMonth);
    } catch {
      showErrorToast('Failed to update stage.');
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE';
    playSound.pop(soundEnabled);
    if (newStatus === 'DONE') {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    }
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      if (onTasksChange) onTasksChange();
      await fetchMonthDeliverables(selectedMonth);
    } catch {
      showErrorToast('Failed to update deliverable status.');
    }
  };

  const submitQuickAdd = async (clientName: string, stage: DeliverableStage) => {
    if (!quickAddTitle.trim()) return;
    playSound.pop(soundEnabled);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickAddTitle.trim(),
          client_name: clientName,
          deliverable_stage: stage,
          deliverable_type: quickAddType,
          deliverable_count: 1,
        }),
      });
      if (!res.ok) throw new Error();
      setQuickAddState(null);
      setQuickAddTitle('');
      if (onTasksChange) onTasksChange();
      await fetchMonthDeliverables(selectedMonth);
    } catch {
      showErrorToast('Failed to create task in pipeline.');
    }
  };

  const renderWorkflowColumn = (
    client: ClientDeliverable,
    stage: DeliverableStage,
    title: string,
    subtitle: string,
    stageTasks: Task[]
  ) => {
    const isAdding = quickAddState?.clientId === client.id && quickAddState?.stage === stage;
    const stageColor =
      stage === 'PRE_PRODUCTION'
        ? 'var(--accent-purple, #8b5cf6)'
        : stage === 'PRODUCTION'
        ? 'var(--accent-theme)'
        : 'var(--accent-green)';

    return (
      <div
        key={stage}
        style={{
          background: 'var(--support-pill)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          padding: '0.65rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          minWidth: 0,
        }}
      >
        {/* Column Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>{title}</span>
            </div>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-dim)' }}>{subtitle}</div>
          </div>
          <span
            className="pill-badge tabular-numbers"
            style={{
              fontSize: '0.65rem',
              padding: '0.05rem 0.35rem',
              fontWeight: 800,
              background: 'var(--bg-card)',
              color: stageTasks.length > 0 ? stageColor : 'var(--text-dim)',
            }}
          >
            {stageTasks.length}
          </span>
        </div>

        {/* Task Cards in this Stage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          {stageTasks.map((t) => {
            const isDone = t.status === 'DONE';
            return (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '10px',
                  padding: '0.55rem 0.65rem',
                  border: isDone ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleTaskStatus(t)}
                    title={isDone ? 'Mark In Progress' : 'Mark Done'}
                    style={{
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      borderRadius: '5px',
                      border: isDone ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                      background: isDone ? 'var(--accent-green)' : 'transparent',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      marginTop: '2px',
                      padding: 0,
                    }}
                  >
                    {isDone && <Check size={11} strokeWidth={3} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 650,
                        color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        lineHeight: 1.3,
                        wordBreak: 'break-word',
                      }}
                    >
                      {t.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          color: t.deliverable_type === 'GRAPHIC' ? 'var(--accent-theme)' : 'var(--accent-purple, #8b5cf6)',
                        }}
                      >
                        {t.deliverable_count && t.deliverable_count > 1 ? `${t.deliverable_count}x ` : ''}
                        {t.deliverable_type === 'GRAPHIC' ? 'Graphic' : 'Reel'}
                      </span>
                      {t.assignee_name && (
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-dim)' }}>
                          • {t.assignee_name.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stage Advancement Control */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.3rem',
                    borderTop: '1px dashed var(--border-subtle)',
                  }}
                >
                  {stage === 'PRE_PRODUCTION' ? (
                    <button
                      type="button"
                      onClick={() => handleAdvanceTaskStage(t.id, 'PRE_PRODUCTION')}
                      style={{
                        border: 'none',
                        background: 'rgba(6, 182, 212, 0.12)',
                        color: 'var(--accent-theme)',
                        borderRadius: '6px',
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.66rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <span>➔ Production</span>
                    </button>
                  ) : stage === 'PRODUCTION' ? (
                    <button
                      type="button"
                      onClick={() => handleAdvanceTaskStage(t.id, 'PRODUCTION')}
                      style={{
                        border: 'none',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: 'var(--accent-green)',
                        borderRadius: '6px',
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.66rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <span>➔ Publish</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDone ? 'var(--accent-green)' : 'var(--text-dim)' }}>
                      {isDone ? '✓ Counted in Quota' : 'Check off to count'}
                    </span>
                  )}

                  {stage !== 'PRE_PRODUCTION' && (
                    <button
                      type="button"
                      onClick={() => {
                        const prevStage: DeliverableStage = stage === 'PUBLISHED' ? 'PRODUCTION' : 'PRE_PRODUCTION';
                        handleUpdateTaskStageDirect(t.id, prevStage);
                      }}
                      title="Send back to previous stage"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-dim)',
                        fontSize: '0.62rem',
                        cursor: 'pointer',
                        padding: '0.1rem',
                      }}
                    >
                      ↩ Back
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {stageTasks.length === 0 && !isAdding && (
            <div
              style={{
                padding: '0.85rem 0.5rem',
                textAlign: 'center',
                fontSize: '0.7rem',
                color: 'var(--text-dim)',
                fontStyle: 'italic',
              }}
            >
              No items in {title.split(' ')[1].toLowerCase()}
            </div>
          )}
        </div>

        {/* Quick Add Form or Add Button */}
        {isAdding ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              background: 'var(--bg-card)',
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <input
              type="text"
              autoFocus
              placeholder={`Task title (${title.split(' ')[1]})...`}
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitQuickAdd(client.client_name, stage);
                } else if (e.key === 'Escape') {
                  setQuickAddState(null);
                }
              }}
              style={{
                fontSize: '0.76rem',
                fontWeight: 600,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                outline: 'none',
                padding: '0.2rem',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
              <select
                value={quickAddType}
                onChange={(e) => setQuickAddType(e.target.value as DeliverableType)}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  background: 'var(--support-pill)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '5px',
                  color: 'var(--text-main)',
                  padding: '0.15rem 0.35rem',
                }}
              >
                <option value="REEL">🎬 Reel</option>
                <option value="GRAPHIC">🎨 Graphic</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => submitQuickAdd(client.client_name, stage)}
                  style={{
                    background: 'var(--accent-theme)',
                    color: 'var(--accent-contrast)',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '0.66rem',
                    fontWeight: 750,
                    padding: '0.2rem 0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAddState(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '0.1rem',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setQuickAddState({ clientId: client.id, stage });
              setQuickAddTitle('');
              setQuickAddType('REEL');
            }}
            style={{
              border: '1px dashed var(--border-subtle)',
              background: 'transparent',
              borderRadius: '7px',
              color: 'var(--text-dim)',
              fontSize: '0.7rem',
              fontWeight: 650,
              padding: '0.35rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              marginTop: 'auto',
            }}
          >
            <Plus size={11} />
            <span>Add Task</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header Toolbar & Month Navigation Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1.2rem 1.4rem',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          boxShadow: 'inset 2px 2px 5px var(--clay-highlight), 0 12px 30px -4px var(--clay-drop-shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(6, 182, 212, 0.14)',
              color: 'var(--accent-theme)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid rgba(6, 182, 212, 0.3)',
              boxShadow: 'inset 1px 1px 3px var(--clay-highlight)',
            }}
          >
            <Briefcase size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Client Deliverables Radar
              </h2>
              <span className="pill-badge" style={{ fontSize: '0.72rem', color: 'var(--accent-theme)', fontWeight: 700 }}>
                Monthly Retainers
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
              Track reels &amp; graphics quota per client, detect lacking months &amp; review history
            </p>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--support-pill)',
              padding: '0.3rem 0.5rem',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
            }}
          >
            <button
              type="button"
              onClick={() => handleMonthStep(-1)}
              title="Previous Month"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ textAlign: 'center', padding: '0 0.6rem', minWidth: '150px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {formattedMonthTitle}
              </div>
              <div style={{ fontSize: '0.68rem', color: isCurrentMonth ? 'var(--accent-theme)' : isPastMonth ? 'var(--accent-amber)' : 'var(--text-dim)', fontWeight: 650 }}>
                {isCurrentMonth ? '● Current Month' : isPastMonth ? '● Past Month Review' : '● Upcoming Month'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleMonthStep(1)}
              title="Next Month"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => setSelectedMonth(currentActualMonth)}
              className="btn-icon"
              style={{
                padding: '0.4rem 0.75rem',
                minHeight: '36px',
                borderRadius: '12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: 'var(--support-pill)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--accent-theme)',
                cursor: 'pointer',
              }}
            >
              Jump to Current
            </button>
          )}

          {/* Add Client Button */}
          {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="btn-accent"
              style={{
                padding: '0.45rem 0.95rem',
                minHeight: '38px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 750,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Plus size={15} />
              <span>+ Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Monthly KPI Overview Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
        {/* Total Clients */}
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.2rem',
            borderRadius: '18px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
            Retainer Accounts
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.35rem' }}>
            <span className="tabular-numbers" style={{ fontSize: '1.65rem', fontWeight: 850, color: 'var(--text-main)' }}>
              {stats.totalClients}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>active in {formattedMonthTitle.split(' ')[0]}</span>
          </div>
        </div>

        {/* Reels Delivered */}
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.2rem',
            borderRadius: '18px',
            border: '1px solid rgba(139, 92, 246, 0.28)',
            background: 'rgba(139, 92, 246, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-purple, #8b5cf6)', fontWeight: 750, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Film size={13} /> Reels Delivered
            </span>
            <span className="tabular-numbers" style={{ fontSize: '0.78rem', fontWeight: 750, color: 'var(--text-main)' }}>
              {stats.targetReels > 0 ? Math.round((stats.completedReels / stats.targetReels) * 100) : 100}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.35rem' }}>
            <span className="tabular-numbers" style={{ fontSize: '1.65rem', fontWeight: 850, color: 'var(--accent-purple, #8b5cf6)' }}>
              {stats.completedReels}
            </span>
            <span className="tabular-numbers" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              / {stats.targetReels} target
            </span>
          </div>
        </div>

        {/* Graphic Posts Delivered */}
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.2rem',
            borderRadius: '18px',
            border: '1px solid rgba(6, 182, 212, 0.28)',
            background: 'rgba(6, 182, 212, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-theme)', fontWeight: 750, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ImageIcon size={13} /> Graphic Posts
            </span>
            <span className="tabular-numbers" style={{ fontSize: '0.78rem', fontWeight: 750, color: 'var(--text-main)' }}>
              {stats.targetGraphics > 0 ? Math.round((stats.completedGraphics / stats.targetGraphics) * 100) : 100}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.35rem' }}>
            <span className="tabular-numbers" style={{ fontSize: '1.65rem', fontWeight: 850, color: 'var(--accent-theme)' }}>
              {stats.completedGraphics}
            </span>
            <span className="tabular-numbers" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              / {stats.targetGraphics} target
            </span>
          </div>
        </div>

        {/* Lacking / Deficit Status Badge */}
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.2rem',
            borderRadius: '18px',
            border: `1px solid ${stats.lackingCount > 0 ? 'rgba(255, 71, 87, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
            background: stats.lackingCount > 0 ? 'rgba(255, 71, 87, 0.06)' : 'rgba(16, 185, 129, 0.06)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: stats.lackingCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 750, textTransform: 'uppercase' }}>
            {isPastMonth ? 'Month Wrap Status' : 'Pacing & Health'}
          </div>
          <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {stats.lackingCount > 0 ? (
              <>
                <AlertTriangle size={20} color="var(--accent-red)" />
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-red)' }}>
                    {stats.lackingCount} {stats.lackingCount === 1 ? 'Client Lacking' : 'Clients Lacking'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {isPastMonth ? 'Deficit detected in past month' : 'Needs attention to meet monthly goal'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 size={20} color="var(--accent-green)" />
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                    All Targets Fulfilled ✨
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    100% quota achieved for this month
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Clients Grid */}
      {isLoading && clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-dim)' }}>
          Loading client deliverables for {formattedMonthTitle}...
        </div>
      ) : clients.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            borderRadius: '24px',
            background: 'var(--bg-card)',
            border: '1.5px dashed var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '2.5rem' }}>📁</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            No Client Deliverables for {formattedMonthTitle}
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
            No agency client retainers exist for this month yet. Use the button below to add a new client deliverable goal.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="btn-accent"
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '12px',
                fontWeight: 750,
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Plus size={15} />
              <span>+ Add First Client</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '1rem' }}>
          {clients.map((c) => {
            const reelsShort = Math.max(0, (c.target_reels || 0) - (c.completed_reels || 0));
            const graphicsShort = Math.max(0, (c.target_graphics || 0) - (c.completed_graphics || 0));
            const isLacking = reelsShort > 0 || graphicsShort > 0;
            const reelsRate = c.target_reels > 0 ? Math.min(100, Math.round(((c.completed_reels || 0) / c.target_reels) * 100)) : 100;
            const graphicsRate = c.target_graphics > 0 ? Math.min(100, Math.round(((c.completed_graphics || 0) / c.target_graphics) * 100)) : 100;
            const isAllDone = !isLacking && (c.target_reels > 0 || c.target_graphics > 0);

            return (
              <div
                key={c.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  borderRadius: '20px',
                  background: 'var(--bg-card)',
                  border: isAllDone
                    ? '1.5px solid rgba(16, 185, 129, 0.4)'
                    : isPastMonth && isLacking
                    ? '1.5px solid rgba(255, 71, 87, 0.4)'
                    : '1.5px solid var(--border-subtle)',
                  boxShadow: 'inset 1.5px 1.5px 3px var(--clay-highlight), 0 10px 24px -4px var(--clay-drop-shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                }}
              >
                {/* Client Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        {c.client_name}
                      </h3>
                      {isAllDone && (
                        <span className="pill-badge" style={{ fontSize: '0.66rem', color: 'var(--accent-green)', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)' }}>
                          ✓ 100% Fulfilled
                        </span>
                      )}
                      {isPastMonth && isLacking && (
                        <span className="pill-badge" style={{ fontSize: '0.66rem', color: 'var(--accent-red)', fontWeight: 750, background: 'rgba(255, 71, 87, 0.12)' }}>
                          ⚠️ Deficit in {formattedMonthTitle.split(' ')[0]}
                        </span>
                      )}
                    </div>
                    {c.notes && (
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', lineHeight: 1.35 }}>
                        {c.notes}
                      </p>
                    )}
                  </div>

                  {/* Edit & Delete Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(c)}
                      title="Edit Quota Targets"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--support-pill)',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientToDelete(c)}
                      title="Delete Client"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--support-pill)',
                        color: 'var(--accent-red)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Deliverables Quota: 1 Single Row with 2 Columns */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {/* 1. Reels Tracker Box */}
                  <div
                    style={{
                      padding: '0.85rem',
                      borderRadius: '14px',
                      background: 'var(--support-pill)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Film size={14} color="var(--accent-purple, #8b5cf6)" />
                        <span>Reels</span>
                      </span>
                      <span className="tabular-numbers" style={{ fontSize: '0.8rem', fontWeight: 750, color: c.completed_reels >= c.target_reels && c.target_reels > 0 ? 'var(--accent-green)' : 'var(--text-main)' }}>
                        {c.completed_reels} / {c.target_reels}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${reelsRate}%`,
                          height: '100%',
                          borderRadius: '999px',
                          background: c.completed_reels >= c.target_reels && c.target_reels > 0 ? 'var(--accent-green)' : 'var(--accent-purple, #8b5cf6)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    {/* Stepper Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', marginTop: '0.1rem' }}>
                      <button
                        type="button"
                        disabled={c.completed_reels <= 0}
                        onClick={() => handleQuickDelta(c, 'reels', -1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '7px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: c.completed_reels <= 0 ? 'not-allowed' : 'pointer',
                          opacity: c.completed_reels <= 0 ? 0.4 : 1,
                        }}
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDelta(c, 'reels', 1)}
                        style={{
                          padding: '0 0.65rem',
                          height: '28px',
                          borderRadius: '7px',
                          border: 'none',
                          background: 'rgba(139, 92, 246, 0.18)',
                          color: 'var(--accent-purple, #8b5cf6)',
                          fontWeight: 750,
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          cursor: 'pointer',
                        }}
                      >
                        <span>+1 Delivered</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Graphic Posts Tracker Box */}
                  <div
                    style={{
                      padding: '0.85rem',
                      borderRadius: '14px',
                      background: 'var(--support-pill)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <ImageIcon size={14} color="var(--accent-theme)" />
                        <span>Graphic Posts</span>
                      </span>
                      <span className="tabular-numbers" style={{ fontSize: '0.8rem', fontWeight: 750, color: c.completed_graphics >= c.target_graphics && c.target_graphics > 0 ? 'var(--accent-green)' : 'var(--text-main)' }}>
                        {c.completed_graphics} / {c.target_graphics}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${graphicsRate}%`,
                          height: '100%',
                          borderRadius: '999px',
                          background: c.completed_graphics >= c.target_graphics && c.target_graphics > 0 ? 'var(--accent-green)' : 'var(--accent-theme)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    {/* Stepper Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', marginTop: '0.1rem' }}>
                      <button
                        type="button"
                        disabled={c.completed_graphics <= 0}
                        onClick={() => handleQuickDelta(c, 'graphics', -1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '7px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: c.completed_graphics <= 0 ? 'not-allowed' : 'pointer',
                          opacity: c.completed_graphics <= 0 ? 0.4 : 1,
                        }}
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDelta(c, 'graphics', 1)}
                        style={{
                          padding: '0 0.65rem',
                          height: '28px',
                          borderRadius: '7px',
                          border: 'none',
                          background: 'rgba(6, 182, 212, 0.18)',
                          color: 'var(--accent-theme)',
                          fontWeight: 750,
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          cursor: 'pointer',
                        }}
                      >
                        <span>+1 Delivered</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Deficit Warning Banner */}
                {isPastMonth && isLacking && (
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 71, 87, 0.12)',
                      border: '1px solid rgba(255, 71, 87, 0.3)',
                      fontSize: '0.74rem',
                      color: 'var(--accent-red)',
                      fontWeight: 650,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>
                      Deficit in {formattedMonthTitle.split(' ')[0]}:{' '}
                      {reelsShort > 0 && `${reelsShort} reel${reelsShort > 1 ? 's' : ''}`}
                      {reelsShort > 0 && graphicsShort > 0 && ', '}
                      {graphicsShort > 0 && `${graphicsShort} graphic${graphicsShort > 1 ? 's' : ''}`} lacking.
                    </span>
                  </div>
                )}

                {/* 3 Workflow Columns Pipeline */}
                {(() => {
                  const clientTasks = tasks.filter(
                    (t) => (t.client_name || '').trim().toLowerCase() === c.client_name.trim().toLowerCase()
                  );
                  const preProdTasks = clientTasks.filter((t) => t.deliverable_stage === 'PRE_PRODUCTION');
                  const prodTasks = clientTasks.filter(
                    (t) => t.deliverable_stage === 'PRODUCTION' || (!t.deliverable_stage && t.client_name)
                  );
                  const publishedTasks = clientTasks.filter((t) => t.deliverable_stage === 'PUBLISHED');
                  const isCollapsed = Boolean(collapsedClients[c.id]);

                  return (
                    <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '0.75rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <Layers size={14} color="var(--accent-theme)" />
                          <span>Workflow Pipeline</span>
                          <span
                            className="pill-badge"
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.05rem 0.4rem',
                              fontWeight: 700,
                            }}
                          >
                            {clientTasks.length} {clientTasks.length === 1 ? 'task' : 'tasks'}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCollapseClient(c.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-dim)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <span>{isCollapsed ? 'Expand 3 Stages' : 'Collapse Stages'}</span>
                          {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                        </button>
                      </div>

                      {!isCollapsed && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                            gap: '0.65rem',
                          }}
                        >
                          {renderWorkflowColumn(c, 'PRE_PRODUCTION', '🎬 Pre-Production', 'Shoots & briefs', preProdTasks)}
                          {renderWorkflowColumn(c, 'PRODUCTION', '✂️ Production', 'Editing & graphics', prodTasks)}
                          {renderWorkflowColumn(c, 'PUBLISHED', '🚀 Published', 'Posted to socials', publishedTasks)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Add / Edit Client Modal */}
      {modalMode && (
        <div
          className="mobile-drawer-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 11, 16, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalMode(null);
          }}
        >
          <div
            className="glass-panel modal-responsive"
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'var(--bg-card)',
              borderRadius: '24px',
              border: '1.5px solid var(--border-subtle)',
              boxShadow: 'inset 2px 2px 5px var(--clay-highlight), 0 24px 60px -12px var(--clay-drop-shadow)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={18} color="var(--accent-theme)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {modalMode === 'create' ? `Add Client (${formattedMonthTitle})` : `Edit Retainer Targets`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
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

            <form onSubmit={handleSaveClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Client Name */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>
                  Client Brand / Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Fitness, Nike Running..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    background: 'var(--support-pill)',
                    border: '1.5px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Targets Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Film size={12} color="var(--accent-purple, #8b5cf6)" /> Target Reels
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={targetReelsInput}
                    onChange={(e) => setTargetReelsInput(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      background: 'var(--support-pill)',
                      border: '1.5px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <ImageIcon size={12} color="var(--accent-theme)" /> Graphic Posts
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={targetGraphicsInput}
                    onChange={(e) => setTargetGraphicsInput(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      background: 'var(--support-pill)',
                      border: '1.5px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>
                  Retainer Scope / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 2 reels/week, focus on product launches"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    background: 'var(--support-pill)',
                    border: '1.5px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
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
                  disabled={isSubmitting}
                  className="btn-accent"
                  style={{
                    padding: '0.65rem',
                    borderRadius: '12px',
                    fontWeight: 750,
                    fontSize: '0.86rem',
                    cursor: isSubmitting ? 'wait' : 'pointer',
                  }}
                >
                  {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Save Client' : 'Update Retainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {clientToDelete && (
        <div
          className="mobile-drawer-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 11, 16, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
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
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-red)' }}>
              <AlertTriangle size={20} />
              <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>
                Remove {clientToDelete.client_name}?
              </h4>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
              Choose whether to exclude this client only from <strong>{formattedMonthTitle}</strong>, or delete them permanently across all months:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => handleDeleteClient('month')}
                disabled={isSubmitting}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: 'var(--accent-amber)',
                  fontWeight: 750,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span>🗓️ Remove for {formattedMonthTitle.split(' ')[0]} Only</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                  Client skips this month. Past history and future rollover remain intact.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteClient('all')}
                disabled={isSubmitting}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 71, 87, 0.14)',
                  border: '1px solid rgba(255, 71, 87, 0.35)',
                  color: 'var(--accent-red)',
                  fontWeight: 750,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span>⚠️ Delete Permanently (All Months)</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                  Permanently deletes client from all past, present, and future records.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={isSubmitting}
                style={{
                  padding: '0.55rem',
                  borderRadius: '10px',
                  background: 'var(--support-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontWeight: 650,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  marginTop: '0.2rem',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

