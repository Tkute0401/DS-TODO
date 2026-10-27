'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, Task, Blocker, NotificationItem, KudosType, BlockerType } from '@/types';
import { Navbar } from '@/components/Navbar';
import { BlockerAlertBanner } from '@/components/BlockerAlertBanner';
import { TaskCreationBar } from '@/components/TaskCreationBar';
import { TaskCard } from '@/components/TaskCard';
import { TeamBoard } from '@/components/TeamBoard';
import { BlockerModal } from '@/components/BlockerModal';
import { ReviewModal } from '@/components/ReviewModal';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { DailyVictoryModal } from '@/components/DailyVictoryModal';
import { DynoMascot } from '@/components/DynoMascot';
import { KudosCelebrationModal } from '@/components/KudosCelebrationModal';
import { LoginForm } from '@/components/LoginForm';
import { AlertCircle, CheckCircle2, Zap, AlertTriangle, ListTodo, ShieldAlert, ChevronDown, ChevronUp, Archive, Search, X } from 'lucide-react';
import { playSound } from '@/lib/sound';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blockersOnMe, setBlockersOnMe] = useState<Blocker[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [viewMode, setViewMode] = useState<'my' | 'team'>('my');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED' | 'REVIEW' | 'DONE'>('ALL');

  // Modals & Drawers
  const [activeBlockerModalTask, setActiveBlockerModalTask] = useState<Task | null>(null);
  const [activeReviewModalTask, setActiveReviewModalTask] = useState<Task | null>(null);
  const [preselectedAssigneeId, setPreselectedAssigneeId] = useState<string | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryCelebrated, setVictoryCelebrated] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [celebratingKudos, setCelebratingKudos] = useState<{ badge: KudosType; taskTitle: string; managerName: string } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Load user session
  const fetchSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        document.body.setAttribute('data-theme', data.user.theme_skin || 'OBSIDIAN');
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all live data
  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch Users (Admins receive full roster including archived members)
      const uRes = await fetch(`/api/users${currentUser.role === 'ADMIN' ? '?include_archived=true' : ''}`);
      const uData = await uRes.json();
      if (uData.users) setAllUsers(uData.users);

      // 2. Fetch Tasks (strict role-based query)
      const tRes = await fetch(`/api/tasks?view=${viewMode}`);
      const tData = await tRes.json();
      if (tData.tasks) setTasks(tData.tasks);

      // 3. Fetch Blockers where current user is the blocker
      const bRes = await fetch('/api/blockers');
      const bData = await bRes.json();
      if (bData.blockersOnMe) setBlockersOnMe(bData.blockersOnMe);

      // 4. Fetch Notifications
      const nRes = await fetch('/api/notifications');
      const nData = await nRes.json();
      if (nData.notifications) setNotifications(nData.notifications);
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, viewMode]);

  useEffect(() => {
    fetchSession();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      if (v === 'team' || v === 'my') {
        setViewMode(v);
      }
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'EMPLOYEE' && viewMode === 'team') {
      setViewMode('my');
    }
  }, [currentUser, viewMode]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
      // Lightweight polling every 20 seconds for team synchronization
      const timer = setInterval(fetchData, 20000);
      return () => clearInterval(timer);
    }
  }, [currentUser, fetchData]);

  const prevPendingRef = React.useRef<number | null>(null);

  // Check for Inbox Zero celebration
  useEffect(() => {
    if (viewMode === 'my' && tasks.length > 0) {
      const activePending = tasks.filter((t) => t.status !== 'DONE').length;
      const doneCount = tasks.filter((t) => t.status === 'DONE').length;
      if (prevPendingRef.current !== null && prevPendingRef.current > 0 && activePending === 0 && doneCount > 0) {
        setShowVictoryModal(true);
      }
      prevPendingRef.current = activePending;
    }
  }, [tasks, viewMode]);

  // Check for unread Kudos notifications to trigger celebration
  useEffect(() => {
    if (notifications.length > 0 && currentUser) {
      const unreadKudosNotif = notifications.find(
        (n) => !n.is_read && n.type === 'REVIEW_APPROVED' && n.body?.includes('kudos badge!')
      );
      if (unreadKudosNotif) {
        let badge: KudosType = 'CHEFS_KISS';
        const match = unreadKudosNotif.body.match(/with ([A-Z_]+) kudos badge!/);
        if (match) badge = match[1] as KudosType;
        setCelebratingKudos({
          badge,
          taskTitle: unreadKudosNotif.title.replace('Deliverable Approved with Kudos: ', ''),
          managerName: unreadKudosNotif.actor_name || 'Manager',
        });
        handleMarkNotificationRead(unreadKudosNotif.id);
      }
    }
  }, [notifications, currentUser]);

  // Task Actions
  const handleCreateTask = async (data: {
    title: string;
    due_date: string;
    is_urgent: boolean;
    assignee_id: string;
  }) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchData();
      setPreselectedAssigneeId(undefined);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: Task['status']) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      await fetchData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const handleUpdateDeliverableLink = async (taskId: string, link: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliverable_link: link }),
    });
    if (res.ok) {
      await fetchData();
    }
  };

  const handleUpdateDueDate = async (taskId: string, newDueDate: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_date: newDueDate }),
      });
      if (res.ok) {
        playSound.click(currentUser?.sound_enabled);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update due date');
      }
    } catch {
      alert('Network error updating deadline');
    }
  };

  const handleUpdateTitle = async (taskId: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        playSound.click(currentUser?.sound_enabled);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update deliverable title');
      }
    } catch {
      alert('Network error updating title');
    }
  };

  const handleToggleUrgent = async (taskId: string, isUrgent: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_urgent: isUrgent }),
      });
      if (res.ok) {
        playSound.click(currentUser?.sound_enabled);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update priority');
      }
    } catch {
      alert('Network error updating priority');
    }
  };

  const handleReassignTask = async (taskId: string, newAssigneeId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignee_id: newAssigneeId }),
      });
      if (res.ok) {
        playSound.click(currentUser?.sound_enabled);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reassign task');
      }
    } catch {
      alert('Network error reassigning deliverable');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      playSound.pop(currentUser?.sound_enabled);
    } catch {
      // Fallback
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    await handleMarkNotificationRead(n.id);
    if (n.type === 'NEEDS_REVIEW' || n.type === 'TASK_BLOCKED') {
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') {
        setViewMode('team');
      } else {
        setViewMode('my');
      }
    } else {
      setViewMode('my');
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult?.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch {
      // User dismissed prompt or browser unsupported
    }
  };

  // Blocker Actions
  const handleSubmitBlocker = async (data: {
    task_id: string;
    blocked_by_type: BlockerType;
    blocking_user_id?: string;
    reason: string;
  }) => {
    const res = await fetch('/api/blockers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchData();
    }
  };

  const handleResolveBlocker = async (blockerId: string) => {
    const res = await fetch('/api/blockers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocker_id: blockerId }),
    });
    if (res.ok) {
      await fetchData();
    }
  };

  // Review Actions
  const handleApprove = async (taskId: string, kudosBadge?: KudosType) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE', kudos_badge: kudosBadge }),
    });
    if (res.ok) {
      await fetchData();
    }
  };

  const handleRequestChanges = async (taskId: string, revisionNote: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS', revision_note: revisionNote }),
    });
    if (res.ok) {
      await fetchData();
    }
  };

  const handleSendNudge = async (targetUserId: string, taskTitle: string, taskId: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_user_id: targetUserId,
        task_title: taskTitle,
        task_id: taskId,
      }),
    });
  };

  // User & Settings Actions
  const handleSwitchUser = async (user: User) => {
    setIsLoading(true);
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'password123' }),
    });
    setCurrentUser(user);
    setViewMode('my');
    setVictoryCelebrated(false);
    document.body.setAttribute('data-theme', user.theme_skin || 'OBSIDIAN');
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data.user);
    }
  };

  const handleAddUser = async (data: {
    name: string;
    email: string;
    role: User['role'];
    designation: string;
    phone?: string;
    password?: string;
  }) => {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const handleArchiveUser = async (userId: string, is_active: boolean) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, is_active }),
      });
      if (res.ok) {
        playSound.click(currentUser?.sound_enabled);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update employee status');
      }
    } catch {
      alert('Network error updating employee');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        playSound.click(currentUser?.sound_enabled);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete employee');
      }
    } catch {
      alert('Network error deleting employee');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
  };

  const handleThemeChange = async (newTheme: User['theme_skin']) => {
    document.body.setAttribute('data-theme', newTheme);
    if (currentUser) {
      setCurrentUser({ ...currentUser, theme_skin: newTheme });
      try {
        await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme_skin: newTheme }),
        });
      } catch {
        // Fallback
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-theme)', fontWeight: 600 }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid var(--accent-theme)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span>Synchronizing Workforce...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginForm
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setViewMode('my');
          document.body.setAttribute('data-theme', user.theme_skin || 'OBSIDIAN');
        }}
      />
    );
  }

  // Active workforce members (excluding archived)
  const activeUsers = allUsers.filter((u) => u.is_active !== false);

  // Filter tasks with search and status criteria
  const displayedTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchCreator = t.creator_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchCreator) return false;
    }
    if (statusFilter === 'ACTIVE') return t.status === 'TODO' || (t.status === 'IN_PROGRESS' && !t.active_blocker);
    if (statusFilter === 'BLOCKED') return Boolean(t.active_blocker);
    if (statusFilter === 'REVIEW') return t.status === 'NEEDS_REVIEW';
    if (statusFilter === 'DONE') return t.status === 'DONE';
    return true;
  });

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();
  const overdueTasks = displayedTasks
    .filter((t) => t.status !== 'DONE' && t.due_date < todayStr)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const urgentTasks = displayedTasks
    .filter((t) => t.status !== 'DONE' && t.is_urgent && t.due_date >= todayStr)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const regularTasks = displayedTasks
    .filter((t) => t.status !== 'DONE' && !t.is_urgent && t.due_date >= todayStr)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const completedTasks = displayedTasks.filter((t) => t.status === 'DONE');

  // 7-day completed task auto-archiving partition (Section 2.3)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCompletedTasks = completedTasks.filter((t) => {
    if (!t.completed_at) return true;
    return new Date(t.completed_at).getTime() >= sevenDaysAgo;
  });
  const archivedCompletedTasks = completedTasks.filter((t) => {
    if (!t.completed_at) return false;
    return new Date(t.completed_at).getTime() < sevenDaysAgo;
  });

  const allTasksDone = tasks.length > 0 && overdueTasks.length === 0 && urgentTasks.length === 0 && regularTasks.length === 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Global Navbar */}
      <Navbar
        user={currentUser}
        allUsers={activeUsers}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onOpenSettings={() => setShowSettings(true)}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        hasActiveBlockers={blockersOnMe.length > 0}
        allTasksDone={allTasksDone}
        onThemeChange={handleThemeChange}
        onNotificationClick={handleNotificationClick}
        onInstallPWA={deferredPrompt ? handleInstallPWA : undefined}
        onToggleSound={(enabled) => handleUpdateProfile({ sound_enabled: enabled })}
      />

      {/* 2. Blocker Alert Banner (if holding up colleagues) */}
      <BlockerAlertBanner
        blockersOnMe={blockersOnMe}
        onResolveBlocker={handleResolveBlocker}
        soundEnabled={currentUser.sound_enabled}
      />

      {/* 3. Main Workspace Container */}
      <main className="main-workspace-container" style={{ flex: 1, maxWidth: '1080px', width: '100%', margin: '0 auto', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Today's Flow & Progress Strip */}
        <section
          className="glass-panel"
          style={{
            padding: '0.9rem 1.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Flow & Clay Progress Rail */}
          <div 
            onClick={() => { if (allTasksDone) setShowVictoryModal(true); }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.25rem', 
              flexWrap: 'wrap',
              cursor: allTasksDone ? 'pointer' : 'default',
            }}
            title={allTasksDone ? 'Click to view Daily Victory Celebration 🌴' : undefined}
          >
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Today&rsquo;s Flow
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                <span className="tabular-numbers" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 100}%
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>
                  ({completedTasks.length} of {tasks.length} Completed)
                </span>
              </div>
            </div>

            {/* Tactile Clay Progress Pill */}
            <div
              style={{
                width: '130px',
                height: '10px',
                borderRadius: '999px',
                background: 'var(--support-pill)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'inset 1.5px 1.5px 3px rgba(45,39,36,0.08), inset -1px -1px 2px rgba(255,255,255,0.95)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 100}%`,
                  background: 'var(--accent-theme)',
                  borderRadius: '999px',
                  transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.45)',
                }}
              />
            </div>
          </div>

          {/* Right: Team Crew & Blocker Presence */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>Team:</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {activeUsers.slice(0, 5).map((u, i) => (
                  <div
                    key={u.id}
                    title={`${u.name} (${u.designation})`}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: u.id === currentUser.id ? 'var(--accent-theme)' : 'var(--support-pill)',
                      border: '2px solid var(--bg-card)',
                      color: u.id === currentUser.id ? 'var(--accent-contrast)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.64rem',
                      fontWeight: 750,
                      marginLeft: i > 0 ? '-6px' : '0',
                      boxShadow: '0 2px 5px rgba(45,39,36,0.06)',
                    }}
                  >
                    {u.name.substring(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: '18px', width: '1px', background: 'var(--border-subtle)' }} />

            {/* Quick Blocker Signal Pill */}
            <div className="pill-badge" style={{ gap: '0.4rem', padding: '0.3rem 0.75rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: blockersOnMe.length > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }} />
              <span>{blockersOnMe.length > 0 ? `${blockersOnMe.length} Blocker Holding Team` : 'No Active Blockers'}</span>
            </div>
          </div>
        </section>

        {/* VIEW 1: MY TASKS (Personal Isolated Focus) */}
        {viewMode === 'my' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
            {/* Task Creation Command Bar */}
            <TaskCreationBar
              currentUser={currentUser}
              allUsers={activeUsers}
              isTeamView={false}
              onCreateTask={handleCreateTask}
              soundEnabled={currentUser.sound_enabled}
            />

            {/* Quick Search & Status Filter Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              {/* Search input */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'var(--support-pill)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  flex: 1,
                  minWidth: '220px',
                }}
              >
                <Search size={14} color="var(--text-dim)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search deliverables, tasks, creators..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.82rem',
                    color: 'var(--text-main)',
                    width: '100%',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--text-dim)', cursor: 'pointer' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Status filter pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto' }}>
                {(['ALL', 'ACTIVE', 'BLOCKED', 'REVIEW', 'DONE'] as const).map((filter) => {
                  const isActive = statusFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={`filter-pill ${isActive ? 'filter-pill-active' : ''}`}
                    >
                      {filter === 'ALL' ? 'All' : filter === 'ACTIVE' ? 'Active' : filter === 'BLOCKED' ? 'Blocked' : filter === 'REVIEW' ? 'Review' : 'Done'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group A: Carried Over from Yesterday */}
            {overdueTasks.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <div className="section-title section-title-warning">
                    <AlertTriangle size={15} />
                    <span>🔴 Rolled Over From Yesterday</span>
                  </div>
                  <span className="section-badge pill-badge-warning tabular-numbers">{overdueTasks.length} Tasks</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {overdueTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUser={currentUser}
                      onUpdateStatus={handleUpdateStatus}
                      onOpenBlockerModal={setActiveBlockerModalTask}
                      onDeleteTask={handleDeleteTask}
                      onSendNudge={handleSendNudge}
                      onUpdateDeliverableLink={handleUpdateDeliverableLink}
                      onUpdateDueDate={handleUpdateDueDate}
                      onUpdateTitle={handleUpdateTitle}
                      onToggleUrgent={handleToggleUrgent}
                      onResolveBlocker={handleResolveBlocker}
                      soundEnabled={currentUser.sound_enabled}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Group B: Top Priority Tasks */}
            {urgentTasks.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <div className="section-title section-title-urgent">
                    <Zap size={15} />
                    <span>Top Priority Focus</span>
                  </div>
                  <span className="section-badge pill-badge-urgent tabular-numbers">{urgentTasks.length} Urgent</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {urgentTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUser={currentUser}
                      onUpdateStatus={handleUpdateStatus}
                      onOpenBlockerModal={setActiveBlockerModalTask}
                      onDeleteTask={handleDeleteTask}
                      onSendNudge={handleSendNudge}
                      onUpdateDeliverableLink={handleUpdateDeliverableLink}
                      onUpdateDueDate={handleUpdateDueDate}
                      onUpdateTitle={handleUpdateTitle}
                      onToggleUrgent={handleToggleUrgent}
                      onResolveBlocker={handleResolveBlocker}
                      soundEnabled={currentUser.sound_enabled}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Group C: Today's Focus List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div className="section-title section-title-neutral">
                  <ListTodo size={15} />
                  <span>Today&rsquo;s Focus List</span>
                </div>
                <span className="section-badge tabular-numbers">{regularTasks.length} Active</span>
              </div>

              {regularTasks.length === 0 && overdueTasks.length === 0 && urgentTasks.length === 0 ? (
                searchQuery.trim() || statusFilter !== 'ALL' ? (
                  <div className="glass-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>🔍</div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 750, color: 'var(--text-main)', marginBottom: '0.25rem' }}>No Matching Tasks</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 0.85rem auto' }}>
                      No deliverables matched your current search &ldquo;{searchQuery}&rdquo; or filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('ALL');
                      }}
                      className="btn-accent"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', borderRadius: '10px' }}
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : allTasksDone && completedTasks.length > 0 ? (
                  <div
                    className="glass-panel"
                    style={{
                      padding: '2.5rem 1.75rem',
                      textAlign: 'center',
                      background: 'radial-gradient(ellipse at top, rgba(245, 158, 11, 0.12) 0%, rgba(244, 63, 94, 0.06) 50%, var(--bg-card) 100%)',
                      borderRadius: '24px',
                      border: '1.5px solid var(--border-subtle)',
                      boxShadow: 'inset 2px 2px 4px var(--clay-highlight), 0 16px 36px rgba(45, 39, 36, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.9rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DynoMascot dynamicMood="celebrate" size="lg" interactive={true} />
                    </div>
                    <div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: 'var(--accent-theme)',
                          fontSize: '0.8rem',
                          fontWeight: 750,
                          padding: '0.25rem 0.8rem',
                          borderRadius: '999px',
                          background: 'var(--support-pill)',
                          border: '1px solid var(--border-subtle)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        🌴 SUNSET LOUNGE · ALL CLEAR FOR TODAY
                      </div>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.4rem 0' }}>
                        Work is Done for Today!
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
                        {completedTasks.length} {completedTasks.length === 1 ? 'deliverable' : 'deliverables'} crushed today • Streak: {currentUser.current_streak}d intact. Shut down your laptop and go recharge!
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowVictoryModal(true)}
                      className="btn-accent"
                      style={{
                        padding: '0.55rem 1.35rem',
                        borderRadius: '12px',
                        fontSize: '0.86rem',
                        fontWeight: 750,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      <span>🎊 Replay Victory Celebration</span>
                    </button>
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '3.25rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.8rem', marginBottom: '0.65rem' }}>☕</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 750, color: 'var(--text-main)', marginBottom: '0.35rem' }}>Ready to Ship Deliverables</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
                      No active tasks currently queued. Type a concrete deliverable title above and press Enter to start your flow.
                    </p>
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {regularTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUser={currentUser}
                      onUpdateStatus={handleUpdateStatus}
                      onOpenBlockerModal={setActiveBlockerModalTask}
                      onDeleteTask={handleDeleteTask}
                      onSendNudge={handleSendNudge}
                      onUpdateDeliverableLink={handleUpdateDeliverableLink}
                      onUpdateDueDate={handleUpdateDueDate}
                      onUpdateTitle={handleUpdateTitle}
                      onToggleUrgent={handleToggleUrgent}
                      onResolveBlocker={handleResolveBlocker}
                      soundEnabled={currentUser.sound_enabled}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Group D: Completed & Verified (with 7-Day Auto-Archiving History) */}
            {completedTasks.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <div className="section-title section-title-success">
                    <CheckCircle2 size={15} />
                    <span>Done &amp; Dusted ✨</span>
                  </div>
                  <span className="section-badge pill-badge-success tabular-numbers">{recentCompletedTasks.length} Recent · {completedTasks.length} Total</span>
                </div>

                {/* Recent Completed Deliverables (<7 days) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {recentCompletedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUser={currentUser}
                      onUpdateStatus={handleUpdateStatus}
                      onOpenBlockerModal={setActiveBlockerModalTask}
                      onDeleteTask={handleDeleteTask}
                      onSendNudge={handleSendNudge}
                      onUpdateDeliverableLink={handleUpdateDeliverableLink}
                      onUpdateDueDate={handleUpdateDueDate}
                      onUpdateTitle={handleUpdateTitle}
                      onToggleUrgent={handleToggleUrgent}
                      onResolveBlocker={handleResolveBlocker}
                      soundEnabled={currentUser.sound_enabled}
                    />
                  ))}
                </div>

                {/* Collapsible History for Tasks Completed >7 Days Ago */}
                {archivedCompletedTasks.length > 0 && (
                  <div style={{ marginTop: '0.85rem' }}>
                    <button
                      onClick={() => setShowArchive(!showArchive)}
                      type="button"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.55rem',
                        fontSize: '0.78rem',
                        fontWeight: 650,
                        color: 'var(--text-muted)',
                        padding: '0.65rem 1rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Archive size={14} />
                      <span>{showArchive ? 'Hide Archived History' : `View Archived History (${archivedCompletedTasks.length} older than 7d)`}</span>
                      {showArchive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showArchive && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '0.65rem', opacity: 0.85 }}>
                        {archivedCompletedTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            currentUser={currentUser}
                            onUpdateStatus={handleUpdateStatus}
                            onOpenBlockerModal={setActiveBlockerModalTask}
                            onDeleteTask={handleDeleteTask}
                            onSendNudge={handleSendNudge}
                            onUpdateDeliverableLink={handleUpdateDeliverableLink}
                            onUpdateDueDate={handleUpdateDueDate}
                            onUpdateTitle={handleUpdateTitle}
                            onToggleUrgent={handleToggleUrgent}
                            onResolveBlocker={handleResolveBlocker}
                            soundEnabled={currentUser.sound_enabled}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: TEAM BOARD (People-First Overview for Managers & Admins) */}
        {viewMode === 'team' && (currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
          <div>
            {/* Quick Task Assign Bar */}
            <TaskCreationBar
              currentUser={currentUser}
              allUsers={activeUsers}
              isTeamView={true}
              preselectedAssigneeId={preselectedAssigneeId}
              onCreateTask={handleCreateTask}
              soundEnabled={currentUser.sound_enabled}
            />

            {/* Team Board Grid & Review Shelf */}
            <TeamBoard
              currentUser={currentUser}
              allUsers={activeUsers}
              allTasks={tasks}
              onOpenReviewModal={setActiveReviewModalTask}
              onOpenAssignModal={(memberId) => {
                setPreselectedAssigneeId(memberId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenBlockerModal={setActiveBlockerModalTask}
              onArchiveUser={handleArchiveUser}
              onDeleteUser={handleDeleteUser}
              onUpdateDueDate={handleUpdateDueDate}
              onReassignTask={handleReassignTask}
              onResolveBlocker={handleResolveBlocker}
            />
          </div>
        )}

      </main>

      {/* Modals & Overlays */}
      {activeBlockerModalTask && (
        <BlockerModal
          task={activeBlockerModalTask}
          allUsers={activeUsers}
          currentUserId={currentUser.id}
          onClose={() => setActiveBlockerModalTask(null)}
          onSubmitBlocker={handleSubmitBlocker}
        />
      )}

      {activeReviewModalTask && (
        <ReviewModal
          task={activeReviewModalTask}
          onClose={() => setActiveReviewModalTask(null)}
          onApprove={handleApprove}
          onRequestChanges={handleRequestChanges}
          soundEnabled={currentUser.sound_enabled}
        />
      )}

      {showSettings && (
        <SettingsDrawer
          user={currentUser}
          allUsers={allUsers}
          onClose={() => setShowSettings(false)}
          onUpdateProfile={handleUpdateProfile}
          onAddUser={handleAddUser}
          onArchiveUser={handleArchiveUser}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {showVictoryModal && (
        <DailyVictoryModal
          streak={currentUser.current_streak}
          completedCount={completedTasks.length}
          soundEnabled={currentUser.sound_enabled}
          onClose={() => setShowVictoryModal(false)}
        />
      )}

      {celebratingKudos && (
        <KudosCelebrationModal
          kudosBadge={celebratingKudos.badge}
          taskTitle={celebratingKudos.taskTitle}
          senderName={celebratingKudos.managerName}
          soundEnabled={currentUser.sound_enabled}
          onClose={() => setCelebratingKudos(null)}
        />
      )}

    </div>
  );
}
