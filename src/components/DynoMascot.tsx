'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Sliders, Check, ChevronDown } from 'lucide-react';

export type MascotMood = 'coffee' | 'focus' | 'blocked' | 'celebrate';
export type MascotMoodSetting = 'auto' | MascotMood;
export type MascotCharacter = 'dyno' | 'foxy' | 'gizmo' | 'mochi';

interface DynoMascotProps {
  dynamicMood?: MascotMood; // Mood determined by task state (when set to auto)
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showSelectorPill?: boolean;
}

export function DynoMascot({
  dynamicMood = 'focus',
  size = 'md',
  interactive = true,
  showSelectorPill = false,
}: DynoMascotProps) {
  // State: Mood setting (can be 'auto' or a fixed mood)
  const [moodSetting, setMoodSetting] = useState<MascotMoodSetting>('auto');
  const [character, setCharacter] = useState<MascotCharacter>('dyno');
  const [isHovered, setIsHovered] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [speechIndex, setSpeechIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedMood = localStorage.getItem('dyno_mascot_mood') as MascotMoodSetting;
      const savedChar = localStorage.getItem('dyno_mascot_char') as MascotCharacter;
      if (savedMood) setMoodSetting(savedMood);
      if (savedChar) setCharacter(savedChar);
    } catch {
      // LocalStorage not available
    }
  }, []);

  // Save changes
  const handleSelectMood = (newMood: MascotMoodSetting) => {
    setMoodSetting(newMood);
    try {
      localStorage.setItem('dyno_mascot_mood', newMood);
    } catch {}
    setShowMenu(false);
  };

  const handleSelectCharacter = (newChar: MascotCharacter) => {
    setCharacter(newChar);
    try {
      localStorage.setItem('dyno_mascot_char', newChar);
    } catch {}
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Actual mood displayed
  const effectiveMood: MascotMood = moodSetting === 'auto' ? dynamicMood : moodSetting;

  const speeches: Record<MascotMood, string[]> = {
    coffee: [
      'Fresh brew poured! Let’s crush the queue ☕',
      'Morning cadence locked in. Zero noise! ✨',
      'Pacing my energy, ready for big deliverables 🌿',
    ],
    focus: [
      'Deep focus mode engaged — 120 BPM beats! 🎧',
      'In the groove! High-velocity shipping ⚡',
      'Locked into the flow state — streak on fire! 🔥',
    ],
    blocked: [
      'Hold up! Bottleneck detected on the road 🚧',
      'Deliverable paused — nudge the blocker! 🔔',
      'Clock is paused, take a breather while it clears ⏸️',
    ],
    celebrate: [
      'Inbox Zero! Every single task completed 🎉',
      'Daily victory! Close the laptop and recharge 🌴',
      'On-time streak defended! Absolute craftsmanship 👑',
    ],
  };

  const moodLabels: Record<MascotMood, { label: string; icon: string }> = {
    coffee: { label: 'Coffee & Chill', icon: '☕' },
    focus: { label: 'Deep Focus', icon: '🎧' },
    blocked: { label: 'Blocked Alert', icon: '🚧' },
    celebrate: { label: 'Daily Victory', icon: '🌴' },
  };

  const currentSpeechList = speeches[effectiveMood] || speeches.coffee;

  const handleMascotClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    // Toggle menu on click, or cycle speech if already open
    if (!showMenu) {
      setShowMenu(true);
      setShowSpeechBubble(false);
    } else {
      setShowMenu(false);
    }
  };

  // Dimensions
  const dim = size === 'lg' ? 120 : size === 'sm' ? 28 : 44;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        userSelect: 'none',
      }}
    >
      {/* Mascot Vector Artwork */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={handleMascotClick}
        onMouseEnter={() => {
          setIsHovered(true);
          if (!showMenu) setShowSpeechBubble(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowSpeechBubble(false);
        }}
        title="Click to change Mascot Mode & Character"
      >
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transformOrigin: 'center bottom',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isHovered && interactive ? 'scale(1.1) translateY(-2px)' : 'none',
            filter: 'drop-shadow(0 4px 10px var(--clay-drop-shadow-soft))',
          }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="dyno-body-v2" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34d399" />
              <stop offset="0.6" stopColor="#10b981" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="dyno-belly-v2" x1="40" y1="45" x2="60" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fffbeb" />
              <stop offset="1" stopColor="#fef3c7" />
            </linearGradient>
            <linearGradient id="foxy-body" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fb923c" />
              <stop offset="0.7" stopColor="#ea580c" />
              <stop offset="1" stopColor="#c2410c" />
            </linearGradient>
            <linearGradient id="foxy-chest" x1="40" y1="50" x2="60" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="1" stopColor="#fed7aa" />
            </linearGradient>
            <linearGradient id="gizmo-body" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f8fafc" />
              <stop offset="0.6" stopColor="#e2e8f0" />
              <stop offset="1" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="gizmo-screen" x1="30" y1="35" x2="70" y2="55" gradientUnits="userSpaceOnUse">
              <stop stopColor="#090d16" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="mochi-body" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e0e7ff" />
              <stop offset="0.6" stopColor="#c7d2fe" />
              <stop offset="1" stopColor="#a5b4fc" />
            </linearGradient>
            <linearGradient id="cup-grad-v2" x1="60" y1="65" x2="80" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="1" stopColor="#e5e7eb" />
            </linearGradient>
            <linearGradient id="coffee-liq" x1="64" y1="68" x2="76" y2="68" gradientUnits="userSpaceOnUse">
              <stop stopColor="#854d0e" />
              <stop offset="1" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="sunglasses" x1="30" y1="38" x2="70" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1e1b4b" stopOpacity="0.95" />
              <stop offset="1" stopColor="#09090b" stopOpacity="0.98" />
            </linearGradient>
          </defs>

          {/* ========================================================
              CHARACTER 1: DYNO (The Mint Chibi Dragon)
             ======================================================== */}
          {character === 'dyno' && (
            <g className="dyno-breathing">
              {/* Back Spines */}
              <polygon points="26,34 18,31 27,42" fill="#047857" />
              <polygon points="23,46 14,44 24,53" fill="#047857" />
              <polygon points="22,57 14,56 23,64" fill="#047857" />

              {/* Wagging Dragon Tail */}
              <path
                d="M 28 72 C 16 72 8 66 12 56 C 14 52 20 60 30 64 Z"
                fill="url(#dyno-body-v2)"
                className="dyno-tail-wag"
              />

              {/* Feet */}
              <ellipse cx="40" cy="88" rx="7.5" ry="4.5" fill="#047857" />
              <ellipse cx="60" cy="88" rx="7.5" ry="4.5" fill="#047857" />

              {/* Head Horns */}
              <path d="M 36 28 C 34 18 42 16 43 24 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
              <path d="M 64 28 C 66 18 58 16 57 24 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />

              {/* Chibi Body (Head & Torso with Soft Silhouette) */}
              <path
                d="M 33 42 C 31 28, 41 20, 50 20 C 59 20, 69 28, 67 42 C 67 49, 74 58, 73 70 C 72 82, 64 88, 50 88 C 36 88, 28 82, 27 70 C 26 58, 33 49, 33 42 Z"
                fill="url(#dyno-body-v2)"
              />

              {/* Cream Custard Belly */}
              <ellipse cx="50" cy="66" rx="14" ry="15" fill="url(#dyno-belly-v2)" />

              {/* Cheeks */}
              <ellipse cx="36" cy="49" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6" />
              <ellipse cx="64" cy="49" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6" />

              {/* Nostrils */}
              <circle cx="48" cy="45" r="1.2" fill="#065f46" />
              <circle cx="52" cy="45" r="1.2" fill="#065f46" />

              {/* Mouth */}
              {effectiveMood !== 'blocked' ? (
                <path d="M 47 50 Q 50 54 53 50" stroke="#065f46" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              ) : (
                <path d="M 46 52 Q 50 49 54 52" stroke="#065f46" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              )}

              {/* Big Anime Chibi Eyes */}
              <g className="dyno-blink-eyes">
                <circle cx="41" cy="40" r="5" fill="#0f172a" />
                <circle cx="39.5" cy="38.5" r="2" fill="#ffffff" />
                <circle cx="42.5" cy="41.5" r="0.9" fill="#ffffff" />

                <circle cx="59" cy="40" r="5" fill="#0f172a" />
                <circle cx="57.5" cy="38.5" r="2" fill="#ffffff" />
                <circle cx="60.5" cy="41.5" r="0.9" fill="#ffffff" />
              </g>
            </g>
          )}

          {/* ========================================================
              CHARACTER 2: FOXY (The Cyber Fox)
             ======================================================== */}
          {character === 'foxy' && (
            <g className="dyno-breathing">
              {/* Big Fluffy Fox Tail with White Tip */}
              <path
                d="M 28 70 C 12 72 4 58 10 46 C 14 38 24 50 30 62 Z"
                fill="url(#foxy-body)"
                className="dyno-tail-wag"
              />
              <path d="M 10 46 C 13 41 20 48 23 52 C 18 54 13 52 10 46 Z" fill="#ffffff" className="dyno-tail-wag" />

              {/* Feet */}
              <ellipse cx="40" cy="88" rx="7" ry="4.5" fill="#7c2d12" />
              <ellipse cx="60" cy="88" rx="7" ry="4.5" fill="#7c2d12" />

              {/* Pointed Fox Ears */}
              <polygon points="32,32 24,12 42,22" fill="url(#foxy-body)" />
              <polygon points="32,30 27,15 39,23" fill="#fed7aa" />
              <polygon points="68,32 76,12 58,22" fill="url(#foxy-body)" />
              <polygon points="68,30 73,15 61,23" fill="#fed7aa" />

              {/* Main Fox Body */}
              <path
                d="M 33 42 C 30 28, 41 22, 50 22 C 59 22, 70 28, 67 42 C 67 49, 74 58, 73 70 C 72 82, 64 88, 50 88 C 36 88, 28 82, 27 70 C 26 58, 33 49, 33 42 Z"
                fill="url(#foxy-body)"
              />

              {/* White Fluffy Chest & Muzzle */}
              <path
                d="M 44 46 Q 50 54 56 46 Q 58 64 50 76 Q 42 64 44 46 Z"
                fill="url(#foxy-chest)"
              />

              {/* Tiny Fox Nose */}
              <polygon points="50,47 47,44 53,44" fill="#18181b" />

              {/* Eyes */}
              <g className="dyno-blink-eyes">
                <circle cx="40" cy="38" r="4.5" fill="#1c1917" />
                <circle cx="38.5" cy="36.5" r="1.8" fill="#ffffff" />
                <circle cx="60" cy="38" r="4.5" fill="#1c1917" />
                <circle cx="58.5" cy="36.5" r="1.8" fill="#ffffff" />
              </g>

              {/* Cheeks */}
              <ellipse cx="34" cy="46" rx="4" ry="2.5" fill="#ef4444" opacity="0.45" />
              <ellipse cx="66" cy="46" rx="4" ry="2.5" fill="#ef4444" opacity="0.45" />
            </g>
          )}

          {/* ========================================================
              CHARACTER 3: GIZMO (The Retro-Futuristic Tech Bot)
             ======================================================== */}
          {character === 'gizmo' && (
            <g className="dyno-breathing">
              {/* Antenna */}
              <line x1="50" y1="22" x2="50" y2="12" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="50" cy="10" r="4" fill="var(--accent-theme)" className="beacon-flash" />

              {/* Rounded Metallic Chassis */}
              <rect x="28" y="22" width="44" height="42" rx="16" fill="url(#gizmo-body)" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="33" y="66" width="34" height="18" rx="8" fill="url(#gizmo-body)" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Hover Base */}
              <ellipse cx="50" cy="87" rx="14" ry="4" fill="#0284c7" opacity="0.75" />

              {/* Dark Visor Screen */}
              <rect x="34" y="30" width="32" height="24" rx="8" fill="url(#gizmo-screen)" stroke="#334155" strokeWidth="1" />

              {/* Glowing LED Pixel Eyes */}
              <g className="dyno-blink-eyes">
                {effectiveMood !== 'blocked' ? (
                  <>
                    <rect x="40" y="38" width="6" height="8" rx="3" fill="var(--accent-theme)" />
                    <rect x="54" y="38" width="6" height="8" rx="3" fill="var(--accent-theme)" />
                  </>
                ) : (
                  <>
                    {/* Alert Exclamation on Screen */}
                    <text x="47" y="47" fill="#f59e0b" fontSize="14" fontWeight="900" fontFamily="monospace">!</text>
                  </>
                )}
              </g>

              {/* Cute Cheek Lights */}
              <circle cx="37" cy="48" r="1.5" fill="#06b6d4" opacity="0.8" />
              <circle cx="63" cy="48" r="1.5" fill="#06b6d4" opacity="0.8" />
            </g>
          )}

          {/* ========================================================
              CHARACTER 4: MOCHI (The Boba Pastel Kitten)
             ======================================================== */}
          {character === 'mochi' && (
            <g className="dyno-breathing">
              {/* Swishing Cat Tail */}
              <path
                d="M 28 72 C 16 74 12 60 18 52 C 20 48 24 56 30 64 Z"
                fill="url(#mochi-body)"
                className="dyno-tail-wag"
              />

              {/* Paws */}
              <ellipse cx="40" cy="88" rx="6.5" ry="4.5" fill="#818cf8" />
              <ellipse cx="60" cy="88" rx="6.5" ry="4.5" fill="#818cf8" />

              {/* Cute Cat Ears with Pink Inner */}
              <polygon points="34,30 26,14 44,22" fill="url(#mochi-body)" />
              <polygon points="34,28 29,17 41,23" fill="#f472b6" />
              <polygon points="66,30 74,14 56,22" fill="url(#mochi-body)" />
              <polygon points="66,28 71,17 59,23" fill="#f472b6" />

              {/* Round Kitty Body */}
              <circle cx="50" cy="48" r="22" fill="url(#mochi-body)" />
              <ellipse cx="50" cy="72" rx="18" ry="16" fill="url(#mochi-body)" />
              <ellipse cx="50" cy="72" rx="11" ry="11" fill="#ffffff" opacity="0.85" />

              {/* Cat Whiskers */}
              <line x1="28" y1="46" x2="20" y2="44" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="28" y1="49" x2="19" y2="50" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="72" y1="46" x2="80" y2="44" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="72" y1="49" x2="81" y2="50" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" />

              {/* Nose & Mouth */}
              <polygon points="50,47 48,45 52,45" fill="#f43f5e" />
              <path d="M 47 49 Q 50 51 53 49" stroke="#4338ca" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              {/* Huge Sparkling Cat Eyes */}
              <g className="dyno-blink-eyes">
                <circle cx="41" cy="40" r="5" fill="#1e1b4b" />
                <circle cx="39.5" cy="38.5" r="2" fill="#ffffff" />
                <circle cx="59" cy="40" r="5" fill="#1e1b4b" />
                <circle cx="57.5" cy="38.5" r="2" fill="#ffffff" />
              </g>

              {/* Rosy Cheeks */}
              <ellipse cx="36" cy="47" rx="3.5" ry="2" fill="#fb7185" opacity="0.65" />
              <ellipse cx="64" cy="47" rx="3.5" ry="2" fill="#fb7185" opacity="0.65" />
            </g>
          )}

          {/* ========================================================
              MOOD ACCESSORIES (Shared & Scaled for all characters)
             ======================================================== */}
          {/* 1. COFFEE MOOD ACCESSORY */}
          {effectiveMood === 'coffee' && (
            <g className="dyno-coffee-arm">
              {/* Ceramic Mug */}
              <rect x="63" y="62" width="16" height="15" rx="3" fill="url(#cup-grad-v2)" stroke="#9ca3af" strokeWidth="1" />
              <ellipse cx="71" cy="62" rx="8" ry="2.5" fill="url(#coffee-liq)" />
              {/* Mug Handle */}
              <path d="M 79 65 C 84 65, 84 74, 79 74" stroke="#9ca3af" strokeWidth="2.5" fill="none" />
              {/* Steam Wisps */}
              <path
                d="M 68 58 C 66 52, 70 48, 68 43"
                stroke="var(--accent-theme)"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
                className="steam-wisp-1"
              />
              <path
                d="M 74 58 C 76 53, 72 49, 75 44"
                stroke="var(--accent-theme)"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.7"
                className="steam-wisp-2"
              />
            </g>
          )}

          {/* 2. FOCUS MOOD ACCESSORY (Over-Ear Studio Headphones & Floating Notes) */}
          {effectiveMood === 'focus' && (
            <g className="dyno-head-bob">
              {/* Headband */}
              <path d="M 26 38 C 26 16, 74 16, 74 38" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
              {/* Earcups */}
              <rect x="22" y="32" width="8" height="14" rx="4" fill="var(--accent-theme)" stroke="#0f172a" strokeWidth="1.5" />
              <rect x="70" y="32" width="8" height="14" rx="4" fill="var(--accent-theme)" stroke="#0f172a" strokeWidth="1.5" />

              {/* Floating Animated Musical Notes */}
              <text x="76" y="26" fill="var(--accent-theme)" fontSize="12" fontWeight="bold" className="music-note-1">♪</text>
              <text x="83" y="18" fill="#06b6d4" fontSize="11" fontWeight="bold" className="music-note-2">♫</text>
              <text x="14" y="24" fill="var(--accent-theme)" fontSize="11" fontWeight="bold" className="music-note-3">♩</text>
            </g>
          )}

          {/* 3. BLOCKED MOOD ACCESSORY (Striped Warning Cone with Blinking Beacon) */}
          {effectiveMood === 'blocked' && (
            <g className="dyno-alert-cone">
              {/* Striped Traffic Cone */}
              <polygon points="50,6 38,26 62,26" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
              <polygon points="46,13 41,21 59,21 54,13" fill="#ffffff" />
              <rect x="34" y="25" width="32" height="4" rx="2" fill="#ea580c" />
              {/* Flashing Amber Beacon */}
              <circle cx="50" cy="6" r="4.5" fill="#facc15" className="beacon-flash" />
              <circle cx="50" cy="6" r="2" fill="#ffffff" />
            </g>
          )}

          {/* 4. CELEBRATE MOOD ACCESSORY (Cool Sunglasses & Stars) */}
          {effectiveMood === 'celebrate' && (
            <g>
              {/* Cool Sunglasses */}
              <rect x="36" y="35" width="13" height="10" rx="3" fill="url(#sunglasses)" stroke="#020617" strokeWidth="1.5" />
              <rect x="51" y="35" width="13" height="10" rx="3" fill="url(#sunglasses)" stroke="#020617" strokeWidth="1.5" />
              <line x1="49" y1="39" x2="51" y2="39" stroke="#020617" strokeWidth="2" />
              <line x1="33" y1="37" x2="36" y2="38" stroke="#020617" strokeWidth="1.5" />
              <line x1="64" y1="38" x2="67" y2="37" stroke="#020617" strokeWidth="1.5" />
              {/* Glints */}
              <line x1="38" y1="37" x2="41" y2="43" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
              <line x1="53" y1="37" x2="56" y2="43" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />

              {/* Twinkling Stars */}
              <g className="sparkle-twinkle-1">
                <path d="M 80 18 Q 80 24 86 24 Q 80 24 80 30 Q 80 24 74 24 Q 80 24 80 18" fill="#f59e0b" />
              </g>
              <g className="sparkle-twinkle-2">
                <path d="M 22 24 Q 22 29 27 29 Q 22 29 22 34 Q 22 29 17 29 Q 22 29 22 24" fill="#10b981" />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Optional Quick Mood Switcher Chip beside mascot */}
      {showSelectorPill && (
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="pill-badge"
          style={{
            padding: '0.2rem 0.6rem',
            gap: '0.3rem',
            cursor: 'pointer',
            fontSize: '0.74rem',
            fontWeight: 700,
            background: 'var(--support-pill)',
            border: '1px solid var(--border-subtle)',
          }}
          title="Change Mascot Mood / Character"
        >
          <span>{moodLabels[effectiveMood].icon}</span>
          <span style={{ color: 'var(--text-main)' }}>{moodLabels[effectiveMood].label}</span>
          <ChevronDown size={11} color="var(--text-dim)" />
        </button>
      )}

      {/* ========================================================
          SPEECH BUBBLE (DROPS DOWN BELOW MASCOT TO PREVENT CLIPPING!)
         ======================================================== */}
      {showSpeechBubble && !showMenu && (
        <div
          style={{
            position: 'absolute',
            top: size === 'lg' ? '105%' : '115%', // Render downward below header bounds
            left: 0,
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1.5px solid var(--border-active)',
            padding: size === 'lg' ? '0.65rem 1rem' : '0.45rem 0.8rem',
            borderRadius: '14px',
            fontSize: size === 'lg' ? '0.86rem' : '0.76rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 28px -4px var(--clay-drop-shadow), inset 1px 1px 2px var(--clay-highlight)',
            zIndex: 100,
            pointerEvents: 'none',
            animation: 'bubble-pop-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {currentSpeechList[speechIndex]}
          {/* Top arrow pointing UP to mascot */}
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '18px',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid var(--border-active)',
            }}
          />
        </div>
      )}

      {/* ========================================================
          MASCOT SETTINGS & MOOD COMMAND POPOVER
         ======================================================== */}
      {showMenu && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '120%', // Opens safely downwards into visible page area
            left: 0,
            width: '290px',
            padding: '1rem',
            borderRadius: '20px',
            boxShadow: 'inset 1.5px 1.5px 3px var(--clay-highlight), 0 20px 45px -8px var(--clay-drop-shadow)',
            zIndex: 120,
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-active)',
            animation: 'bubble-pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.45rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 750, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sliders size={13} color="var(--accent-theme)" />
              <span>Mascot Companion Settings</span>
            </span>
            <button
              onClick={() => setShowMenu(false)}
              style={{ minHeight: '22px', minWidth: '22px', padding: 0, fontSize: '0.75rem', color: 'var(--text-dim)', border: 'none', background: 'transparent' }}
            >
              ✕
            </button>
          </div>

          {/* Section 1: Choose Mood */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
              Mood &amp; Mode:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
              {[
                { id: 'auto' as MascotMoodSetting, label: 'Auto (Live Flow)', icon: '🔄', desc: 'Syncs with tasks' },
                { id: 'coffee' as MascotMoodSetting, label: 'Coffee & Chill', icon: '☕', desc: 'Sipping steam' },
                { id: 'focus' as MascotMoodSetting, label: 'Deep Focus', icon: '🎧', desc: '120 BPM beats' },
                { id: 'blocked' as MascotMoodSetting, label: 'Blocked Alert', icon: '🚧', desc: 'Beacon flasher' },
                { id: 'celebrate' as MascotMoodSetting, label: 'Daily Victory', icon: '🌴', desc: 'Shades & stars' },
              ].map((m) => {
                const isSelected = moodSetting === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMood(m.id)}
                    style={{
                      padding: '0.4rem 0.55rem',
                      minHeight: '34px',
                      borderRadius: '11px',
                      background: isSelected ? 'var(--support-pill)' : 'transparent',
                      border: isSelected ? '1.5px solid var(--accent-theme)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.76rem',
                      fontWeight: isSelected ? 750 : 550,
                      color: isSelected ? 'var(--accent-theme)' : 'var(--text-main)',
                      gridColumn: m.id === 'auto' ? 'span 2' : 'auto',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </span>
                    {isSelected && <Check size={12} color="var(--accent-theme)" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Choose Mascot Character */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
              Mascot Character Avatar:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
              {[
                { id: 'dyno' as MascotCharacter, label: 'Dyno', sub: 'Mint Dragon', emoji: '🦖' },
                { id: 'foxy' as MascotCharacter, label: 'Foxy', sub: 'Cyber Fox', emoji: '🦊' },
                { id: 'gizmo' as MascotCharacter, label: 'Gizmo', sub: 'Tech Bot', emoji: '🤖' },
                { id: 'mochi' as MascotCharacter, label: 'Mochi', sub: 'Pastel Kitty', emoji: '🐱' },
              ].map((char) => {
                const isSelected = character === char.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => handleSelectCharacter(char.id)}
                    style={{
                      padding: '0.45rem 0.6rem',
                      minHeight: '38px',
                      borderRadius: '11px',
                      background: isSelected ? 'var(--support-pill)' : 'transparent',
                      border: isSelected ? '1.5px solid var(--accent-theme)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{char.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: isSelected ? 800 : 650, color: isSelected ? 'var(--accent-theme)' : 'var(--text-main)' }}>
                        {char.label}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>
                        {char.sub}
                      </div>
                    </div>
                    {isSelected && <Check size={12} color="var(--accent-theme)" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
