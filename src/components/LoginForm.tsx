'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, Shield, AlertCircle, Sparkles } from 'lucide-react';
import { DynoMascot } from './DynoMascot';
import { playSound } from '@/lib/sound';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your work email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        setErrorMessage(data.error || 'Invalid email or password. Please try again.');
        playSound.click(true);
        return;
      }

      playSound.pop(true);
      onLoginSuccess(data.user);
    } catch {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.25rem 2rem',
          borderRadius: '24px',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: 'inset 2px 2px 5px var(--clay-highlight), 0 24px 60px -12px var(--clay-drop-shadow)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header: Official Digital Supremacy Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.15rem' }}>
            <img
              src="/ds-logo.png"
              alt="Digital Supremacy"
              style={{
                height: '36px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(0, 240, 255, 0.15))',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <DynoMascot dynamicMood="coffee" size="md" interactive={true} />
          </div>
          <h1
            style={{
              fontSize: '1.35rem',
              fontWeight: 850,
              letterSpacing: '-0.02em',
              color: 'var(--text-main)',
              margin: '0 0 0.35rem 0',
            }}
          >
            Performance Operating System
          </h1>
          <p
            style={{
              fontSize: '0.84rem',
              color: 'var(--text-muted)',
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            Dynamic Deliverables &amp; Workforce Accountability Engine
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.65rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--accent-theme)',
              background: 'var(--support-pill)',
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Shield size={12} />
            <span>Digital Supremacy Internal Workspace</span>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: 'rgba(255, 71, 87, 0.12)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              color: 'var(--accent-red)',
              padding: '0.7rem 0.9rem',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Work Email Field */}
          <div>
            <label
              htmlFor="login-email"
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 750,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.4rem',
              }}
            >
              Work Email
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'var(--support-pill)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '0.65rem 0.95rem',
                boxShadow: 'inset 1.5px 1.5px 3px var(--clay-highlight)',
                transition: 'border-color 0.2s ease',
              }}
            >
              <Mail size={16} color="var(--text-dim)" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firm.com"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label
                htmlFor="login-password"
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 750,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Password
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Default: <code style={{ color: 'var(--accent-theme)' }}>password123</code>
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'var(--support-pill)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '0.65rem 0.95rem',
                boxShadow: 'inset 1.5px 1.5px 3px var(--clay-highlight)',
              }}
            >
              <Lock size={16} color="var(--text-dim)" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: '24px',
                  minWidth: '24px',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-accent"
            style={{
              width: '100%',
              minHeight: '46px',
              fontSize: '0.92rem',
              fontWeight: 750,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.4rem',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.25)',
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.75 : 1,
            }}
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In to Workspace</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Pre-fill Pills */}
        <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.65rem',
            }}
          >
            <Sparkles size={12} color="var(--accent-gold)" />
            <span>Quick Fill (Demo &amp; Testing)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => handleQuickDemo('tanmay@digitalsupremacy.in', 'password123')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.85rem',
                borderRadius: '10px',
                background: 'var(--support-pill)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
                color: 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <strong>Tanmay Kute</strong>
                <span style={{ color: 'var(--accent-theme)', marginLeft: '0.4rem', fontSize: '0.72rem' }}>
                  (Admin · Digital Supremacy)
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>tanmay@digitalsupremacy.in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
