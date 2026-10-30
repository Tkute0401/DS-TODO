'use client';

import React, { useState } from 'react';
import { User, ThemeSkin, UserRole } from '@/types';
import { 
  X, 
  User as UserIcon, 
  Palette, 
  Volume2, 
  Shield, 
  UserPlus, 
  Calendar, 
  Phone, 
  Users, 
  Archive, 
  RotateCcw, 
  Trash2, 
  AlertTriangle,
  Search,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsDrawerProps {
  user: User;
  allUsers?: User[];
  onClose: () => void;
  onUpdateProfile: (updates: Partial<User & { password?: string }>) => Promise<void>;
  onAddUser: (data: {
    name: string;
    email: string;
    role: UserRole;
    designation: string;
    phone?: string;
    password?: string;
  }) => Promise<void>;
  onArchiveUser?: (userId: string, is_active: boolean) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
}

export function SettingsDrawer({
  user,
  allUsers = [],
  onClose,
  onUpdateProfile,
  onAddUser,
  onArchiveUser,
  onDeleteUser,
}: SettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'workforce' | 'provision'>('profile');
  
  // Profile state
  const [name, setName] = useState(user.name);
  const [designation, setDesignation] = useState(user.designation || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [themeSkin, setThemeSkin] = useState<ThemeSkin>(user.theme_skin || 'OBSIDIAN');
  const [soundEnabled, setSoundEnabled] = useState(user.sound_enabled);
  const [isOnLeave, setIsOnLeave] = useState(user.is_on_leave);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Admin add user state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserRole, setNewUserRole] = useState<UserRole>('EMPLOYEE');
  const [newUserDesignation, setNewUserDesignation] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Workforce directory state
  const [searchQuery, setSearchQuery] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates: Partial<User & { password?: string }> = {
        name,
        designation,
        phone,
        theme_skin: themeSkin,
        sound_enabled: soundEnabled,
        is_on_leave: isOnLeave,
      };
      if (newPassword.trim()) {
        if (newPassword.trim().length < 6) {
          setProfileError('New password must be at least 6 characters long.');
          setIsSaving(false);
          return;
        }
        updates.password = newPassword.trim();
      }
      setProfileError(null);
      await onUpdateProfile(updates);
      setNewPassword('');
      document.body.setAttribute('data-theme', themeSkin);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    setIsAddingUser(true);
    try {
      await onAddUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
        designation: newUserDesignation.trim() || 'Contributor',
        phone: newUserPhone.trim(),
        password: newUserPassword.trim() || 'password123',
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('password123');
      setNewUserDesignation('');
      setNewUserPhone('');
      setActiveTab('workforce');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleToggleArchive = async (targetUser: User) => {
    if (!onArchiveUser) return;
    const willArchive = targetUser.is_active !== false;
    const confirmText = willArchive
      ? `Archive "${targetUser.name}"? They will be deactivated, unable to log in, and hidden from active task assignments.`
      : `Restore "${targetUser.name}" to active workforce status?`;

    if (!window.confirm(confirmText)) return;

    setProcessingUserId(targetUser.id);
    try {
      await onArchiveUser(targetUser.id, !willArchive);
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete || !onDeleteUser) return;
    setProcessingUserId(memberToDelete.id);
    try {
      await onDeleteUser(memberToDelete.id);
      setMemberToDelete(null);
    } finally {
      setProcessingUserId(null);
    }
  };

  const filteredMembers = allUsers.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.designation && m.designation.toLowerCase().includes(q))
    );
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(45, 39, 36, 0.45)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 100,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          borderRadius: '24px 0 0 24px',
          background: 'var(--bg-card)',
          borderLeft: '1.5px solid var(--border-subtle)',
          boxShadow: 'inset 2px 2px 5px var(--clay-highlight), -12px 0 40px rgba(45, 39, 36, 0.12)',
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img
              src="/ds-emblem.png"
              alt="DS"
              style={{ height: '22px', width: 'auto', objectFit: 'contain' }}
            />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 750, color: 'var(--text-main)', margin: 0 }}>
              Digital Supremacy · Workforce
            </h2>
          </div>
          <button onClick={onClose} style={{ minHeight: '32px', minWidth: '32px', padding: 0, color: 'var(--text-muted)', borderRadius: '10px' }} aria-label="Close settings drawer">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation for Admin */}
        {user.role === 'ADMIN' && (
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-secondary)', 
            padding: '3px', 
            borderRadius: '14px', 
            border: '1px solid var(--border-subtle)',
            gap: '3px'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              style={{
                flex: 1,
                minHeight: '36px',
                borderRadius: '11px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                border: 'none',
                background: activeTab === 'profile' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'profile' ? 'var(--accent-theme)' : 'var(--text-muted)',
                boxShadow: activeTab === 'profile' ? '0 2px 8px var(--clay-drop-shadow-soft)' : 'none',
              }}
            >
              <UserIcon size={14} />
              <span>My Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('workforce')}
              style={{
                flex: 1.2,
                minHeight: '36px',
                borderRadius: '11px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                border: 'none',
                background: activeTab === 'workforce' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'workforce' ? 'var(--accent-theme)' : 'var(--text-muted)',
                boxShadow: activeTab === 'workforce' ? '0 2px 8px var(--clay-drop-shadow-soft)' : 'none',
              }}
            >
              <Users size={14} />
              <span>Roster ({allUsers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('provision')}
              style={{
                flex: 1.1,
                minHeight: '36px',
                borderRadius: '11px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                border: 'none',
                background: activeTab === 'provision' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'provision' ? 'var(--accent-theme)' : 'var(--text-muted)',
                boxShadow: activeTab === 'provision' ? '0 2px 8px var(--clay-drop-shadow-soft)' : 'none',
              }}
            >
              <UserPlus size={14} />
              <span>+ Add User</span>
            </button>
          </div>
        )}

        {/* TAB 1: My Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem', boxShadow: 'inset 1px 1px 2px rgba(45,39,36,0.05)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                Designation / Role Title
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem', boxShadow: 'inset 1px 1px 2px rgba(45,39,36,0.05)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                Phone Number (WhatsApp Direct Alerts)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem', boxShadow: 'inset 1px 1px 2px rgba(45,39,36,0.05)' }}
              />
            </div>

            {/* Change Password Section */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={14} color="var(--accent-theme)" />
                <span>Change Password</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 500 }}>(Leave blank to keep current)</span>
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  background: 'var(--support-pill)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '0.55rem 0.85rem',
                  boxShadow: 'inset 1px 1px 2px rgba(45,39,36,0.05)',
                }}
              >
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '20px',
                    minWidth: '20px',
                  }}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {profileError && (
                <div style={{ color: 'var(--accent-red)', fontSize: '0.78rem', marginTop: '0.35rem', fontWeight: 650 }}>
                  ⚠️ {profileError}
                </div>
              )}
            </div>

            {/* Theme Skin Selection - 3-Color Triad Palette Engine */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Palette size={14} color="var(--accent-theme)" /> 
                  <span>3-Color Theme Triad (60-30-10)</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
                  4 Calibrated Skins
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
                {[
                  { id: 'CYBERPUNK' as ThemeSkin, name: '1. Lilac & Lavender', desc: 'Darker Lavender Ground', triad: ['#a690c5', '#ffffff', '#6835ba'] },
                  { id: 'MATCHA' as ThemeSkin, name: '2. Victorian Matcha', desc: 'Herbarium & Gilded Brass', triad: ['#1e2f23', '#fcf9f2', '#c59b27'] },
                  { id: 'SUNSET' as ThemeSkin, name: '3. Gothic Dark Vibes', desc: 'Cathedral Obsidian & Ruby', triad: ['#07080b', '#0d0e14', '#c5222f'] },
                  { id: 'OBSIDIAN' as ThemeSkin, name: '4. Digital Supremacy', desc: 'Black + White + Cyan', triad: ['#08090c', '#ffffff', '#00f0ff'] },
                ].map((theme) => {
                  const isSelected = themeSkin === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setThemeSkin(theme.id);
                        document.body.setAttribute('data-theme', theme.id);
                      }}
                      style={{
                        padding: '0.75rem 0.85rem',
                        minHeight: '68px',
                        borderRadius: '16px',
                        background: isSelected ? 'var(--support-pill)' : 'var(--bg-card)',
                        border: isSelected ? '2px solid var(--accent-theme)' : '1px solid var(--border-subtle)',
                        boxShadow: isSelected
                          ? 'inset 1.5px 1.5px 3px var(--clay-inner-shadow), 0 0 12px var(--accent-glow)'
                          : '0 4px 10px var(--clay-drop-shadow-soft), inset 1.5px 1.5px 2px var(--clay-highlight)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 750, color: isSelected ? 'var(--accent-theme)' : 'var(--text-main)' }}>
                          {theme.name}
                        </span>
                        {isSelected && (
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-theme)' }} />
                        )}
                      </div>

                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {theme.desc}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: theme.triad[0], border: '1px solid var(--border-subtle)' }} />
                          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: theme.triad[1], border: '1px solid var(--border-subtle)' }} />
                          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: theme.triad[2], border: '1px solid var(--border-subtle)' }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggles: Sound & On Leave */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', background: 'var(--support-pill)', padding: '0.9rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.86rem', cursor: 'pointer', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-main)' }}>
                  <Volume2 size={16} color="var(--accent-theme)" /> ASMR Satisfying Sound FX
                </span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-theme)' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.86rem', cursor: 'pointer', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-main)' }}>
                  <Calendar size={16} color="var(--accent-amber)" /> On Vacation / Sick Leave
                </span>
                <input
                  type="checkbox"
                  checked={isOnLeave}
                  onChange={(e) => setIsOnLeave(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-amber)' }}
                />
              </label>
              <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                Freezes your streak and alerts colleagues you are away.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="btn-accent"
              style={{
                width: '100%',
                minHeight: '44px',
                borderRadius: '14px',
                fontSize: '0.92rem',
              }}
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        )}

        {/* TAB 2: Workforce Roster (Archive & Delete Employee Controls) */}
        {activeTab === 'workforce' && user.role === 'ADMIN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 750, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={16} color="var(--accent-theme)" />
                  <span>Workforce Directory</span>
                </h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Archive (deactivate) or permanently delete employees.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('provision')}
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.65rem',
                  borderRadius: '10px',
                  background: 'var(--support-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--accent-theme)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <UserPlus size={13} />
                <span>+ Add</span>
              </button>
            </div>

            {/* Filter / Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filter by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem 0.55rem 2rem',
                  borderRadius: '12px',
                  background: 'var(--support-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                }}
              />
            </div>

            {/* Members List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredMembers.map((member) => {
                const isSelf = member.id === user.id;
                const isArchived = member.is_active === false;
                const isProcessing = processingUserId === member.id;

                return (
                  <div
                    key={member.id}
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: '16px',
                      background: isArchived ? 'rgba(0, 0, 0, 0.04)' : 'var(--support-pill)',
                      border: isArchived ? '1px dashed var(--border-subtle)' : '1px solid var(--border-subtle)',
                      boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      opacity: isArchived ? 0.68 : 1,
                    }}
                  >
                    {/* Left: Avatar & Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: isArchived ? 'var(--text-dim)' : 'var(--accent-theme)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 750,
                          fontSize: '0.86rem',
                          flexShrink: 0,
                        }}
                      >
                        {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 750, fontSize: '0.88rem', color: 'var(--text-main)', textDecoration: isArchived ? 'line-through' : 'none' }}>
                            {member.name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '6px',
                              background: member.role === 'ADMIN' ? 'rgba(0, 240, 255, 0.15)' : member.role === 'MANAGER' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: member.role === 'ADMIN' ? 'var(--accent-theme)' : member.role === 'MANAGER' ? 'var(--accent-amber)' : 'var(--accent-green)',
                            }}
                          >
                            {member.role}
                          </span>
                          {isArchived && (
                            <span style={{ fontSize: '0.62rem', fontWeight: 750, padding: '1px 5px', borderRadius: '6px', background: 'rgba(255, 71, 87, 0.15)', color: 'var(--accent-red)' }}>
                              ARCHIVED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '1px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {member.designation} &bull; {member.email}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                      {isSelf ? (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontStyle: 'italic', paddingRight: '0.3rem' }}>
                          (You)
                        </span>
                      ) : (
                        <>
                          {/* Archive / Restore Button */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleToggleArchive(member)}
                            title={isArchived ? 'Restore Employee' : 'Archive Employee'}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              background: isArchived ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: isArchived ? 'var(--accent-green)' : 'var(--accent-amber)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease',
                            }}
                          >
                            {isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setMemberToDelete(member)}
                            title="Delete Employee Permanently"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              background: 'rgba(255, 71, 87, 0.15)',
                              color: 'var(--accent-red)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredMembers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.84rem' }}>
                  No employees found matching &ldquo;{searchQuery}&rdquo;.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Admin Provisioning Section */}
        {activeTab === 'provision' && user.role === 'ADMIN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-theme)' }}>
              <UserPlus size={16} />
              <span>Provision New Team Member</span>
            </h3>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <input
                type="text"
                required
                placeholder="Full Name (e.g. Vikram Joshi)"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.86rem', boxShadow: 'inset 1px 1px 2px rgba(45,39,36,0.05)' }}
              />
              <input
                type="email"
                required
                placeholder="Email (e.g. vikram@firm.com)"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.86rem', boxShadow: 'inset 1px 1px 2px rgba(45,39,36,0.05)' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <input
                  type="text"
                  placeholder="Designation"
                  value={newUserDesignation}
                  onChange={(e) => setNewUserDesignation(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <input
                    type="text"
                    placeholder="Password (default: password123)"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', paddingLeft: '4px', marginTop: '2px', display: 'block' }}>
                    Default: password123
                  </span>
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Phone / WhatsApp"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'var(--support-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', paddingLeft: '4px', marginTop: '2px', display: 'block' }}>
                    For 1-tap WhatsApp ping
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAddingUser}
                className="btn-accent"
                style={{
                  width: '100%',
                  minHeight: '42px',
                  borderRadius: '12px',
                  fontSize: '0.86rem',
                  marginTop: '0.35rem',
                }}
              >
                {isAddingUser ? 'Adding...' : '+ Add to Workforce'}
              </button>
            </form>
          </div>
        )}

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
                  onClick={handleConfirmDelete}
                  disabled={processingUserId === memberToDelete.id}
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
                  {processingUserId === memberToDelete.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
