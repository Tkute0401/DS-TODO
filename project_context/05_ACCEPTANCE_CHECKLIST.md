# Section 5: Master Acceptance Checklist & Verification Gate

> **Usage**: This is the final verification benchmark. Before marking the project or any phase complete, every single checkbox below must be tested, validated, and signed off. If a feature is not checked off, the system is not done.

---

## Phase 1 Acceptance Gate: The Core Iron Engine

### 1. Authentication & Role Separation
- [x] Admin can create/provision new team member accounts in Settings (Name, Email, Role, Temp Password).
- [x] Users can log in and remain persistently logged in via secure session cookies.
- [x] An Employee session strictly only queries and returns their own tasks (`WHERE assignee_id = user.id`).
- [x] Opening browser DevTools on an Employee session reveals zero access to peer tasks or global databases.
- [x] A Manager or Admin session has the instant top switcher: `[ My Tasks ]` ➔ `[ Team Board ]`.

### 2. Zero-Friction Task Creation
- [x] In `My Tasks`, typing a title and pressing `Enter` creates a task in <2 seconds.
- [x] The `Assignee` field in `My Tasks` is permanently locked to the current user.
- [x] In `Team Board`, clicking `+ Assign Task` on a person pre-fills their name as the assignee.
- [x] Default due date automatically sets to firm's End of Business Day (7:00 PM local time).

### 3. The 4-State Lifecycle & Blocker Domino Engine
- [x] Task toggles smoothly: `To Do` ➔ `In Progress` ➔ `Needs Review` ➔ `Done`.
- [x] Self-created tasks (`creator_id === assignee_id`) skip `Needs Review` and check off directly to `Done`.
- [x] Assigned tasks cannot be deleted by an employee.
- [x] Flipping status to `Blocked` opens the 10-second modal:
  - [x] Can select a Colleague, Client, or External.
  - [x] Mandatory 1-line reason note is enforced before submission.
- [x] When a colleague is tagged as a blocker:
  - [x] Colleague immediately gets a red/amber alert card at the top of their `My Tasks`: *"🚨 You are blocking [Name] on [Task]"*.
  - [x] Colleague can click 1-button `Mark Resolved`.
  - [x] The original employee gets notified that the blocker is cleared and can resume work.
- [x] Manager's `Team Board` highlights blocked tasks with high-visibility amber/red dependency indicators.

### 4. Manager Sign-Off & Accountability Shields
- [x] Tasks in `Needs Review` give the manager 2 quick choices:
  - [x] `Approve & Award Kudos` ➔ Moves to `Done` with celebration confetti.
  - [x] `Request Changes` ➔ Prompts mandatory feedback note and flips task back to `In Progress` with amber badge.
- [x] Tasks in `Needs Review` for >24 hours turn amber; >48 hours turn red on the Manager's board.
- [x] Admin dashboard displays the **Manager Bottleneck Widget** highlighting stagnant reviews.
- [x] Unfinished tasks from yesterday automatically gather at the top of `My Tasks` under `🔴 Rolled Over`.

### 5. Mobile PWA & Desktop Experience
- [x] App can be installed to Android homescreen and desktop taskbar via standard PWA prompt.
- [x] iOS Safari "Add to Home Screen" opens standalone with correct status bar and safe-area insets.
- [x] Touch targets are at least 48px x 48px; zero cramped clicks on phones.
- [x] Unread notification count appears on the app icon / bell icon.

---

## Phase 2 Acceptance Gate: Extended Culture & Funk Suite

### 6. The Funk & Dopamine Suite
- [x] Animated CSS/SVG Flame Streak evolves across tiers:
  - [x] Tier 1 (1–3 Days): Spark ⚡
  - [x] Tier 2 (4–7 Days): Blaze 🔥
  - [x] Tier 3 (8+ Days): Supernova 🔮
- [x] Toggling "On Leave" in user profile freezes and protects on-time streaks.
- [x] Completing a task triggers the spring-draw SVG checkmark animation and micro-confetti burst.
- [x] Manager can select and attach one of 4 animated Kudos stickers on approval:
  - [x] 🚀 Speed Demon
  - [x] 💎 Pixel Perfect
  - [x] 🧠 Big Brain
  - [x] 👑 Chef's Kiss
- [x] Reaching zero pending tasks for the day triggers the animated **"Inbox Zero / Daily Victory"** lounge screen.
- [x] Tactile ASMR audio triggers on actions (Enter key clack, bubble pop, coin sound) with a working 1-click global mute button.
- [x] User can switch between 4 workspace themes in Settings: Obsidian, Cyberpunk Neon, Tokyo Matcha, and Sunset Lo-Fi.
- [x] Adaptive Pixel Mascot in header dynamically reflects live status (coffee, headphones, construction cone, hammock).
