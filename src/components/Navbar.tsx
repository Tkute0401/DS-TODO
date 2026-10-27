'use client';

import React, { useState } from 'react';
import { User, NotificationItem, ThemeSkin } from '@/types';
import { playSound } from '@/lib/sound';
import { DynoMascot, MascotMood } from './DynoMascot';
import { 
  Flame, 
  Bell, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  ShieldAlert, 
  Users, 
  ListTodo, 
  LogOut, 
  Settings,
  Palette,
  Download,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  user: User;
  allUsers: User[];
  viewMode: 'my' | 'team';
  onViewModeChange: (mode: 'my' | 'team') => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onNotificationClick?: (n: NotificationItem) => void;
  onOpenSettings: () => void;
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
  hasActiveBlockers: boolean;
  allTasksDone: boolean;
  onThemeChange?: (theme: ThemeSkin) => void;
  onInstallPWA?: () => void;
  onToggleSound?: (enabled: boolean) => void;
}

const THEME_OPTIONS: { id: ThemeSkin; code: string; label: string; dot: string; tooltip: string }[] = [
  { id: 'CYBERPUNK', code: 'LILAC', label: 'Lilac', dot: '#6835ba', tooltip: 'Lilac (Darker Lavender Ground)' },
  { id: 'MATCHA', code: 'VICTORIAN', label: 'Victorian', dot: '#c59b27', tooltip: 'Victorian Matcha (Herbarium Green & Gilded Brass)' },
  { id: 'SUNSET', code: 'GOTHIC', label: 'Gothic', dot: '#c5222f', tooltip: 'Gothic Dark Vibes (Cathedral Obsidian & Blood Ruby)' },
  { id: 'OBSIDIAN', code: 'DIGITAL', label: 'Digital', dot: '#00f0ff', tooltip: 'Digital Supremacy (Black + White + Electric Cyan)' },
];

export function Navbar({
  user,
  allUsers,
  viewMode,
  onViewModeChange,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNotificationClick,
  onOpenSettings,
  onSwitchUser,
  onLogout,
  hasActiveBlockers,
  allTasksDone,
  onThemeChange,
  onInstallPWA,
  onToggleSound,
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMobileDrawer(false);
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      if (unreadCount > 0) {
        navigator.setAppBadge(unreadCount).catch(() => {});
      } else {
        (navigator as { clearAppBadge?: () => Promise<void> }).clearAppBadge?.().catch(() => {});
      }
    }
  }, [unreadCount]);

  // Streak Flame Tier Calculation
  const streak = user.current_streak || 0;
  const flameClass = streak >= 8 ? 'flame-supernova' : streak >= 4 ? 'flame-blaze' : 'flame-spark';
  const flameTierName = streak >= 8 ? 'Supernova' : streak >= 4 ? 'Blaze' : 'Spark';

  // Adaptive Dyno Mascot State
  let mascotMood: MascotMood = 'coffee';
  if (hasActiveBlockers) {
    mascotMood = 'blocked';
  } else if (allTasksDone) {
    mascotMood = 'celebrate';
  } else {
    mascotMood = 'focus';
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1.5px solid var(--border-subtle)',
      boxShadow: '0 4px 20px -2px rgba(45, 39, 36, 0.05)',
    }}>
      <div style={{
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '0.65rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        
        {/* Brand & Animated Mascot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/ds-logo.png"
            alt="Digital Supremacy"
            className="nav-brand-logo"
            style={{
              height: '24px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div style={{ height: '22px', width: '1px', background: 'var(--border-subtle)' }} />
          <DynoMascot dynamicMood={mascotMood} size="sm" interactive={true} showSelectorPill={true} />
          <div className="hide-on-compact">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className="pill-badge" style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem', fontWeight: 750, color: 'var(--accent-theme)' }}>
                PERFORMANCE OS
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '-0.01em', marginTop: '1px' }}>
              {user.name} &bull; <span style={{ color: 'var(--accent-theme)', fontWeight: 600 }}>{user.designation}</span>
            </div>
          </div>
        </div>

        {/* View Switcher (For Managers & Admins - Desktop) */}
        {(user.role === 'MANAGER' || user.role === 'ADMIN') && (
          <div className="hide-on-mobile" style={{ 
            display: 'flex', 
            background: 'var(--support-pill)', 
            padding: '3px', 
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'inset 1px 1px 3px rgba(45, 39, 36, 0.05)',
          }}>
            <button
              onClick={() => onViewModeChange('my')}
              style={{
                padding: '0.35rem 0.9rem',
                minHeight: '34px',
                borderRadius: '10px',
                background: viewMode === 'my' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'my' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: viewMode === 'my' ? 700 : 600,
                fontSize: '0.82rem',
                border: viewMode === 'my' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                boxShadow: viewMode === 'my' ? '0 2px 6px var(--clay-drop-shadow-soft), inset 1px 1px 2px var(--clay-highlight)' : 'none',
              }}
            >
              <ListTodo size={14} />
              <span>My Tasks</span>
            </button>
            <button
              onClick={() => onViewModeChange('team')}
              style={{
                padding: '0.35rem 0.9rem',
                minHeight: '34px',
                borderRadius: '10px',
                background: viewMode === 'team' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'team' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: viewMode === 'team' ? 700 : 600,
                fontSize: '0.82rem',
                border: viewMode === 'team' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                boxShadow: viewMode === 'team' ? '0 2px 6px var(--clay-drop-shadow-soft), inset 1px 1px 2px var(--clay-highlight)' : 'none',
              }}
            >
              <Users size={14} />
              <span>Team Board</span>
            </button>
          </div>
        )}

        {/* Right Action Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          
          {/* Quick 4-Theme Segmented Switcher (Clay Pastel Worlds - Desktop) */}
          <div
            title="Instant Clay Pastel Theme Switcher"
            className="hide-on-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--support-pill)',
              padding: '3px',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              gap: '2px',
              boxShadow: 'inset 1px 1px 3px rgba(45, 39, 36, 0.05)',
            }}
          >
            {THEME_OPTIONS.map((t) => {
              const isSelected = user.theme_skin === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    playSound.pop(user.sound_enabled);
                    if (onThemeChange) {
                      onThemeChange(t.id);
                    } else {
                      document.body.setAttribute('data-theme', t.id);
                      user.theme_skin = t.id;
                    }
                  }}
                  title={t.tooltip}
                  style={{
                    padding: '0.22rem 0.6rem',
                    minHeight: '30px',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--bg-card)' : 'transparent',
                    color: isSelected ? 'var(--text-main)' : 'var(--text-dim)',
                    fontWeight: isSelected ? 750 : 500,
                    fontSize: '0.72rem',
                    border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    boxShadow: isSelected ? '0 2px 6px var(--clay-drop-shadow-soft), inset 1px 1px 2px var(--clay-highlight)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.16s ease',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: t.dot,
                      boxShadow: isSelected ? `0 0 6px ${t.dot}` : 'none',
                    }}
                  />
                  <span>{t.code}</span>
                </button>
              );
            })}
          </div>

          {/* Animated Streak Flame */}
          <div 
            title={`${user.current_streak} Consecutive On-Time Days (${flameTierName} Tier)`}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              padding: '0.35rem 0.85rem', 
              borderRadius: '999px', 
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'inset 1px 1px 2px var(--clay-highlight), 0 2px 6px var(--clay-drop-shadow-soft)',
              fontSize: '0.85rem',
              fontWeight: 700 
            }}
          >
            <Flame className={flameClass} size={18} />
            <span>{streak}d</span>
          </div>

          {/* Sound Mute Toggle (Desktop) */}
          <button
            onClick={() => {
              const next = !user.sound_enabled;
              if (onToggleSound) {
                onToggleSound(next);
              } else {
                user.sound_enabled = next;
              }
              if (next) playSound.pop(true);
            }}
            title={user.sound_enabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="hide-on-mobile"
            style={{ width: '38px', height: '38px', minHeight: '38px', minWidth: '38px', borderRadius: '12px' }}
          >
            {user.sound_enabled ? <Volume2 size={17} color="var(--text-muted)" /> : <VolumeX size={17} color="var(--text-dim)" />}
          </button>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ 
                position: 'relative', 
                width: '38px', 
                height: '38px', 
                minHeight: '38px', 
                minWidth: '38px', 
                borderRadius: '12px' 
              }}
            >
              <Bell size={17} color={unreadCount > 0 ? 'var(--accent-theme)' : 'var(--text-muted)'} />
              {unreadCount > 0 && (
                <span
                  className="tabular-numbers"
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    minWidth: '17px',
                    height: '17px',
                    padding: '0 4px',
                    borderRadius: '999px',
                    background: 'var(--accent-red)',
                    color: '#ffffff',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(255, 71, 87, 0.4)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '320px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '0.85rem',
                  borderRadius: '18px',
                  boxShadow: 'inset 1.5px 1.5px 3px var(--clay-highlight), 0 16px 36px rgba(45, 39, 36, 0.12)',
                  zIndex: 100
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.45rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontWeight: 750, fontSize: '0.86rem', color: 'var(--text-main)' }}>Notifications</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }} className="tabular-numbers">{unreadCount} unread</span>
                    {unreadCount > 0 && onMarkAllNotificationsRead && (
                      <button
                        type="button"
                        onClick={onMarkAllNotificationsRead}
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--accent-theme)',
                          background: 'transparent',
                          border: 'none',
                          padding: '0 0.2rem',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    No notifications yet!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (onNotificationClick) {
                          onNotificationClick(n);
                        } else {
                          onMarkNotificationRead(n.id);
                        }
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: '0.65rem',
                        borderRadius: '12px',
                        background: n.is_read ? 'transparent' : 'var(--support-pill)',
                        borderLeft: n.is_read ? 'none' : '3px solid var(--accent-theme)',
                        marginBottom: '0.4rem',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ fontWeight: 650, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {n.type === 'TASK_BLOCKED' && <ShieldAlert size={14} color="var(--accent-red)" />}
                        {n.type === 'BLOCKER_RESOLVED' && <CheckCircle2 size={14} color="var(--accent-green)" />}
                        {n.title}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                        {n.body}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Profile Avatar / Quick Switcher (Desktop) */}
          <div className="hide-on-mobile" style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                width: '38px',
                height: '38px',
                minHeight: '38px',
                minWidth: '38px',
                borderRadius: '12px',
                background: 'var(--support-pill)',
                fontWeight: 750,
                fontSize: '0.88rem',
                border: streak >= 8 ? '1.5px solid rgba(168, 85, 247, 0.7)' : '1px solid var(--border-subtle)',
                color: 'var(--accent-theme)',
                boxShadow: streak >= 8
                  ? '0 0 12px rgba(168, 85, 247, 0.5), inset 1px 1px 2px var(--clay-highlight), 0 2px 6px var(--clay-drop-shadow-soft)'
                  : 'inset 1px 1px 2px var(--clay-highlight), 0 2px 6px var(--clay-drop-shadow-soft)',
              }}
            >
              {user.name.split(' ').map(n => n[0]).join('')}
            </button>

            {showUserMenu && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '260px',
                  padding: '0.85rem',
                  borderRadius: '18px',
                  boxShadow: 'inset 1.5px 1.5px 3px var(--clay-highlight), 0 16px 36px rgba(45, 39, 36, 0.12)',
                  zIndex: 100
                }}
              >
                <div style={{ paddingBottom: '0.6rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 750, fontSize: '0.92rem', color: 'var(--text-main)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--accent-theme)', fontWeight: 650 }}>{user.role} &bull; {user.designation}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '1px' }}>{user.email}</div>
                </div>

                {/* Instant Role Testing Switcher */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Switch Demo User
                  </div>
                  {allUsers.filter((u) => u.is_active !== false).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setShowUserMenu(false);
                      }}
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        padding: '0.45rem 0.65rem',
                        minHeight: '34px',
                        borderRadius: '10px',
                        background: u.id === user.id ? 'var(--support-pill)' : 'transparent',
                        border: u.id === user.id ? '1px solid var(--border-subtle)' : '1px solid transparent',
                        fontSize: '0.82rem',
                        color: u.id === user.id ? 'var(--accent-theme)' : 'var(--text-muted)'
                      }}
                    >
                      <span style={{ fontWeight: 650 }}>{u.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>({u.role})</span>
                    </button>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {onInstallPWA && (
                    <button
                      onClick={() => {
                        onInstallPWA();
                        setShowUserMenu(false);
                      }}
                      style={{ width: '100%', justifyContent: 'flex-start', minHeight: '36px', padding: '0.4rem 0.65rem', fontSize: '0.82rem', borderRadius: '10px', color: 'var(--accent-theme)' }}
                    >
                      <Download size={15} />
                      <span>Install App (PWA)</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowUserMenu(false);
                    }}
                    style={{ width: '100%', justifyContent: 'flex-start', minHeight: '36px', padding: '0.4rem 0.65rem', fontSize: '0.82rem', borderRadius: '10px' }}
                  >
                    <Settings size={15} />
                    <span>Settings &amp; Profile</span>
                  </button>
                  <button
                    onClick={onLogout}
                    style={{ width: '100%', justifyContent: 'flex-start', minHeight: '36px', padding: '0.4rem 0.65rem', fontSize: '0.82rem', color: 'var(--accent-red)', borderRadius: '10px' }}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            className="show-on-mobile"
            onClick={() => setShowMobileDrawer(true)}
            title="Open Navigation Menu"
            style={{
              width: '38px',
              height: '38px',
              minHeight: '38px',
              minWidth: '38px',
              borderRadius: '12px',
              background: 'var(--support-pill)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 1px 1px 2px var(--clay-highlight), 0 2px 6px var(--clay-drop-shadow-soft)',
            }}
          >
            <Menu size={18} />
          </button>

        </div>
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      {showMobileDrawer && (
        <div
          className="mobile-drawer-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMobileDrawer(false);
          }}
        >
          <div className="mobile-drawer-panel">
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <img src="/ds-logo.png" alt="Digital Supremacy" style={{ height: '20px', width: 'auto' }} />
                <span className="pill-badge" style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem', fontWeight: 750, color: 'var(--accent-theme)' }}>
                  PERFORMANCE OS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileDrawer(false)}
                title="Close Navigation Drawer"
                style={{ width: '34px', height: '34px', minHeight: '34px', minWidth: '34px', borderRadius: '10px', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* User Profile Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--support-pill)', padding: '0.75rem 0.95rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                color: 'var(--accent-theme)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
              }}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 750, fontSize: '0.92rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--accent-theme)', fontWeight: 650 }}>
                  {user.role} &bull; {user.designation}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            </div>

            {/* 1. Board Switcher (Managers / Admins) */}
            {(user.role === 'MANAGER' || user.role === 'ADMIN') && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                  Workspace Board
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', background: 'var(--support-pill)', padding: '3px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      onViewModeChange('my');
                      setShowMobileDrawer(false);
                    }}
                    style={{
                      padding: '0.55rem',
                      minHeight: '40px',
                      borderRadius: '10px',
                      background: viewMode === 'my' ? 'var(--bg-card)' : 'transparent',
                      color: viewMode === 'my' ? 'var(--text-main)' : 'var(--text-muted)',
                      fontWeight: viewMode === 'my' ? 750 : 600,
                      fontSize: '0.82rem',
                      border: viewMode === 'my' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                      boxShadow: viewMode === 'my' ? '0 2px 6px var(--clay-drop-shadow-soft)' : 'none',
                    }}
                  >
                    <ListTodo size={15} />
                    <span>My Tasks</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onViewModeChange('team');
                      setShowMobileDrawer(false);
                    }}
                    style={{
                      padding: '0.55rem',
                      minHeight: '40px',
                      borderRadius: '10px',
                      background: viewMode === 'team' ? 'var(--bg-card)' : 'transparent',
                      color: viewMode === 'team' ? 'var(--text-main)' : 'var(--text-muted)',
                      fontWeight: viewMode === 'team' ? 750 : 600,
                      fontSize: '0.82rem',
                      border: viewMode === 'team' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                      boxShadow: viewMode === 'team' ? '0 2px 6px var(--clay-drop-shadow-soft)' : 'none',
                    }}
                  >
                    <Users size={15} />
                    <span>Team Board</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Theme Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                Theme Skin
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {THEME_OPTIONS.map((t) => {
                  const isSelected = user.theme_skin === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        playSound.pop(user.sound_enabled);
                        if (onThemeChange) {
                          onThemeChange(t.id);
                        } else {
                          document.body.setAttribute('data-theme', t.id);
                          user.theme_skin = t.id;
                        }
                      }}
                      style={{
                        padding: '0.5rem 0.65rem',
                        minHeight: '42px',
                        borderRadius: '12px',
                        background: isSelected ? 'var(--support-pill)' : 'var(--bg-card)',
                        color: isSelected ? 'var(--accent-theme)' : 'var(--text-main)',
                        fontWeight: isSelected ? 750 : 600,
                        fontSize: '0.82rem',
                        border: isSelected ? '1.5px solid var(--accent-theme)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: t.dot,
                          boxShadow: isSelected ? `0 0 6px ${t.dot}` : 'none',
                        }}
                      />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Audio & Sound FX */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                Sound &amp; Feedback
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !user.sound_enabled;
                  if (onToggleSound) {
                    onToggleSound(next);
                  } else {
                    user.sound_enabled = next;
                  }
                  if (next) playSound.pop(true);
                }}
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  minHeight: '44px',
                  borderRadius: '12px',
                  background: 'var(--support-pill)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.84rem',
                  fontWeight: 650,
                  color: 'var(--text-main)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {user.sound_enabled ? <Volume2 size={16} color="var(--accent-theme)" /> : <VolumeX size={16} color="var(--text-dim)" />}
                  <span>Micro-Sound FX</span>
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: user.sound_enabled ? 'var(--accent-green)' : 'var(--text-dim)' }}>
                  {user.sound_enabled ? 'ENABLED' : 'MUTED'}
                </span>
              </button>
            </div>

            {/* 4. Demo User Switcher */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                Switch Demo User
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {allUsers.filter((u) => u.is_active !== false).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onSwitchUser(u);
                      setShowMobileDrawer(false);
                    }}
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      padding: '0.5rem 0.75rem',
                      minHeight: '40px',
                      borderRadius: '11px',
                      background: u.id === user.id ? 'var(--support-pill)' : 'transparent',
                      border: u.id === user.id ? '1px solid var(--border-subtle)' : '1px solid transparent',
                      fontSize: '0.82rem',
                      color: u.id === user.id ? 'var(--accent-theme)' : 'var(--text-muted)',
                    }}
                  >
                    <span style={{ fontWeight: 650 }}>{u.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>({u.role})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. System Controls */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {onInstallPWA && (
                <button
                  type="button"
                  onClick={() => {
                    onInstallPWA();
                    setShowMobileDrawer(false);
                  }}
                  style={{ width: '100%', justifyContent: 'flex-start', minHeight: '42px', padding: '0.5rem 0.75rem', fontSize: '0.84rem', borderRadius: '11px', color: 'var(--accent-theme)' }}
                >
                  <Download size={16} />
                  <span>Install App (PWA)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setShowMobileDrawer(false);
                }}
                style={{ width: '100%', justifyContent: 'flex-start', minHeight: '42px', padding: '0.5rem 0.75rem', fontSize: '0.84rem', borderRadius: '11px' }}
              >
                <Settings size={16} />
                <span>Settings &amp; Workforce</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobileDrawer(false);
                  onLogout();
                }}
                style={{ width: '100%', justifyContent: 'flex-start', minHeight: '42px', padding: '0.5rem 0.75rem', fontSize: '0.84rem', color: 'var(--accent-red)', borderRadius: '11px' }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
