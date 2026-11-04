'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, ClientDeliverable } from '@/types';
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
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '@/lib/sound';

interface ClientDeliverablesBoardProps {
  currentUser: User;
  soundEnabled: boolean;
  showErrorToast: (msg: string) => void;
}

export function ClientDeliverablesBoard({
  currentUser,
  soundEnabled,
  showErrorToast,
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

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [targetReelsInput, setTargetReelsInput] = useState<number>(0);
  const [targetGraphicsInput, setTargetGraphicsInput] = useState<number>(0);
  const [notesInput, setNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch client deliverables for selected month
  const fetchMonthDeliverables = useCallback(async (monthStr: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients?month=${monthStr}`);
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
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
  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clients?id=${clientToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
        setClientToDelete(null);
      } else {
        showErrorToast('Failed to delete client deliverable.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy quotas forward from previous month if current month is empty
  const handleCopyFromPrevMonth = async () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients?month=${prevMonthStr}`);
      const data = await res.json();
      const prevClients: ClientDeliverable[] = data.clients || [];

      if (prevClients.length === 0) {
        showErrorToast(`No clients found in ${prevDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} to copy.`);
        setIsLoading(false);
        return;
      }

      // Re-create them for selected month with 0 completed
      for (const c of prevClients) {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_name: c.client_name,
            month: selectedMonth,
            target_reels: c.target_reels,
            completed_reels: 0,
            target_graphics: c.target_graphics,
            completed_graphics: 0,
            notes: c.notes,
          }),
        });
      }

      playSound.pop(soundEnabled);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      await fetchMonthDeliverables(selectedMonth);
    } catch {
      showErrorToast('Failed to roll forward previous month retainers.');
      setIsLoading(false);
    }
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
      {isLoading ? (
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
            No retainer goals configured for this period yet. Add your agency clients or copy standard quotas forward from the previous month.
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
            <button
              type="button"
              onClick={handleCopyFromPrevMonth}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '12px',
                background: 'var(--support-pill)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontWeight: 650,
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
            >
              <Copy size={14} color="var(--accent-theme)" />
              <span>Copy Quotas From Previous Month</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))', gap: '1rem' }}>
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
                Remove Client Retainer?
              </h4>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
              Are you sure you want to remove <strong>{clientToDelete.client_name}</strong> for {formattedMonthTitle}?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                style={{
                  padding: '0.6rem',
                  borderRadius: '10px',
                  background: 'var(--support-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontWeight: 650,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={isSubmitting}
                style={{
                  padding: '0.6rem',
                  borderRadius: '10px',
                  background: 'var(--accent-red)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 750,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
