'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, UserRole } from '@/types';
import { 
  X, 
  UserCheck, 
  Mail, 
  Shield, 
  Briefcase, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Calendar, 
  Archive,
  Save,
  AlertCircle
} from 'lucide-react';
import { playSound } from '@/lib/sound';

interface EditEmployeeModalProps {
  employee: User;
  currentAdmin: User;
  onClose: () => void;
  onSave: (userId: string, data: Partial<User & { password?: string }>) => Promise<void>;
  soundEnabled?: boolean;
}

export function EditEmployeeModal({
  employee,
  currentAdmin,
  onClose,
  onSave,
  soundEnabled = true,
}: EditEmployeeModalProps) {
  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [role, setRole] = useState<UserRole>(employee.role);
  const [designation, setDesignation] = useState(employee.designation || '');
  const [phone, setPhone] = useState(employee.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(employee.is_active !== false);
  const [isOnLeave, setIsOnLeave] = useState(Boolean(employee.is_on_leave));
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Full name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('A valid email address is required');
      return;
    }
    if (newPassword.trim() && newPassword.trim().length < 6) {
      setErrorMessage('New password must be at least 6 characters');
      return;
    }

    // Prevent admin from deactivating their own account
    if (employee.id === currentAdmin.id && !isActive) {
      setErrorMessage('You cannot archive your own active admin account');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updates: Partial<User & { password?: string }> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        designation: designation.trim() || 'Contributor',
        phone: phone.trim(),
        is_active: isActive,
        is_on_leave: isOnLeave,
      };

      if (newPassword.trim()) {
        updates.password = newPassword.trim();
      }

      await onSave(employee.id, updates);
      playSound.click(soundEnabled);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update employee';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(5, 5, 8, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), inset 1px 1px 2px var(--clay-highlight)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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
            background: 'var(--support-pill)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(0, 240, 255, 0.15)',
                color: 'var(--accent-theme)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 1px 1px 2px var(--clay-highlight)',
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>Edit Employee</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 750,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    background: role === 'ADMIN' ? 'rgba(0, 240, 255, 0.15)' : role === 'MANAGER' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: role === 'ADMIN' ? 'var(--accent-theme)' : role === 'MANAGER' ? 'var(--accent-amber)' : 'var(--accent-green)',
                  }}
                >
                  {role}
                </span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Update credentials, permissions &amp; contact info for {employee.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.35rem',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.35rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem',
          }}
        >
          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.7rem 0.9rem',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-red)',
                fontSize: '0.82rem',
                fontWeight: 650,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Full Name & Email (2-Column Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  background: 'var(--support-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@digitalsupremacy.in"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.2rem',
                    borderRadius: '12px',
                    background: 'var(--support-pill)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Role & Designation (2-Column Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                System Role *
              </label>
              <div style={{ position: 'relative' }}>
                <Shield size={15} color="var(--accent-theme)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={employee.id === currentAdmin.id}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.2rem',
                    borderRadius: '12px',
                    background: 'var(--support-pill)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    fontWeight: 650,
                    outline: 'none',
                    cursor: employee.id === currentAdmin.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="EMPLOYEE">Employee (Task Focus)</option>
                  <option value="MANAGER">Manager (Reviews &amp; Deliverables)</option>
                  <option value="ADMIN">Admin (Full System Governance)</option>
                </select>
              </div>
              {employee.id === currentAdmin.id && (
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '3px', display: 'block' }}>
                  You cannot change your own admin role.
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Job Title / Designation *
              </label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Lead Video Editor"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.2rem',
                    borderRadius: '12px',
                    background: 'var(--support-pill)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Phone / WhatsApp */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              WhatsApp Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={15} color="var(--accent-green)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.2rem',
                  borderRadius: '12px',
                  background: 'var(--support-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '3px', display: 'block' }}>
              Enables 1-click WhatsApp nudge &amp; chat on the Team Board.
            </span>
          </div>

          {/* Admin Password Reset Field */}
          <div
            style={{
              padding: '0.9rem',
              borderRadius: '16px',
              background: 'var(--support-pill)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Reset Password (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--accent-amber)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
                style={{
                  width: '100%',
                  padding: '0.65rem 2.4rem 0.65rem 2.2rem',
                  borderRadius: '10px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Allows admin to instantly set a new login password if the employee is locked out.
            </span>
          </div>

          {/* Status Toggles: Active vs Archived & Vacation */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              padding: '0.9rem',
              borderRadius: '16px',
              background: 'var(--support-pill)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Active / Archive Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: employee.id === currentAdmin.id ? 'not-allowed' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={16} color={isActive ? 'var(--accent-green)' : 'var(--accent-red)'} />
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Active Workforce Member
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {isActive ? 'Employee is active and can log in' : 'Archived (deactivated from task assignment)'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                disabled={employee.id === currentAdmin.id}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-green)' }}
              />
            </label>

            <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

            {/* Leave / Vacation Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} color="var(--accent-amber)" />
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    On Vacation / Sick Leave
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Freezes streak and indicates away status to managers
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isOnLeave}
                onChange={(e) => setIsOnLeave(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-amber)' }}
              />
            </label>
          </div>

          {/* Action Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '12px',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 650,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-accent"
              style={{
                padding: '0.6rem 1.45rem',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: 750,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Save size={15} />
              <span>{isSaving ? 'Saving...' : 'Save Employee Info'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
