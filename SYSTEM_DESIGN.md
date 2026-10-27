# System Design & Architecture Specification
## Dynamic Todo & Team Accountability Engine

> **Project Goal**: Eliminate timeline slippage, lack of ownership, and inter-departmental finger-pointing in a 10–30 person firm with fast-moving, non-standardized workflows.
> **Philosophy**: Radical simplicity, minimum code that works, zero bureaucratic form-bloat, high visual aesthetics, and undeniable accountability.

---

## 1. Context & Lessons from Past Failures

| Tool Attempted | Reason for Failure | Lesson Learned |
| :--- | :--- | :--- |
| **Google Sheets** | Static, un-engaging, quickly became outdated because nobody updated it. | Needs active mobile notifications, tactile dopamine, and friction-free status updates. |
| **Trello** | Too loose; cards lingered in columns without clear accountability or urgency. | Needs strict blocker alarms, deadline consequences, and manager sign-off. |
| **In-House Custom Tracker** | Work was non-standardized, so users added too many custom fields and overcomplicated it until it was abandoned. | Must lock task creation to **maximum 3 core inputs** (Title, Auto-filled Assignee, Due Date). |

---

## 2. Core Decision Log

| Decision | Chosen Solution | Alternatives Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **Tech Stack** | Next.js Unified Full-Stack + Neon Serverless Postgres (`@neondatabase/serverless`) | React SPA + separate Express/FastAPI; Supabase BaaS | One codebase, zero CORS overhead, instant deployment, server-side data security, serverless Postgres with zero connection pool leaks. |
| **Platform** | Responsive Web App + Installable PWA (iOS, Android & Desktop Taskbar/Dock) | Native Swift/Kotlin apps; Electron wrapper | 100% cross-platform with one codebase; runs on phone lock screens and desktop docks; low maintenance. |
| **Data Privacy** | Strict SQL-level isolation (`WHERE assignee_id = user.id` for Employees) | Client-side filtering | Zero data leakage; employees cannot inspect peer deliverables via DevTools or API endpoints. |
| **Sign-Off Rule** | Manager sign-off required only for assigned deliverables; self-todos complete directly | All tasks require manager approval; no approval required | Prevents manager approval fatigue on routine subtasks while ensuring core client deliverables are verified. |
| **Blocker Engine** | Colleague tagging auto-creates urgent *"You are blocking [Name]"* card on colleague's screen | Generic comment threads; Slack/WhatsApp pings | Moves accountability directly to the bottleneck in 10 seconds; eliminates meeting finger-pointing. |
| **Rollout Strategy** | 2-Phase Rollout (Phase 1 Core Engine ➔ Phase 2 Funk & Culture Suite) | Launching all 25 features at once | Prevents repeating the "feature creep" trap that killed the previous custom tracker. |

---

## 3. Database Schema (Neon Serverless Postgres)

```
┌────────────────────────────────────────────────────────┐
│               Neon Serverless Postgres                 │
├──────────────┬──────────────┬─────────────┬────────────┤
│    users     │    tasks     │  blockers   │notifications
└──────────────┴──────────────┴─────────────┴────────────┘
```

### Table 1: `users`
* `id` (UUID, Primary Key)
* `email` (Text, Unique)
* `password_hash` (Text)
* `name` (Text)
* `role` (Enum: `'ADMIN'`, `'MANAGER'`, `'EMPLOYEE'`)
* `designation` (Text, e.g. "Senior Video Editor")
* `phone` (Text, optional for 1-tap WhatsApp/Call)
* `avatar_url` (Text, image URL or generated gradient initials)
* `is_active` (Boolean, default: `true` — for safe offboarding without cascade deletes)
* `is_on_leave` (Boolean, default: `false` — protects streaks during vacations/sick leave)
* `theme_skin` (Enum: `'OBSIDIAN'`, `'CYBERPUNK'`, `'MATCHA'`, `'SUNSET'`, default: `'OBSIDIAN'`)
* `sound_enabled` (Boolean, default: `true`)
* `current_streak` (Integer, default: 0 — consecutive on-time deliverable days)
* `created_at` (Timestamp)

### Table 2: `tasks`
* `id` (UUID, Primary Key)
* `title` (Text — concrete deliverable noun, e.g. "Final 30s cut with music")
* `creator_id` (UUID ➔ references `users.id`)
* `assignee_id` (UUID ➔ references `users.id`, indexed)
* `status` (Enum: `'TODO'`, `'IN_PROGRESS'`, `'NEEDS_REVIEW'`, `'DONE'`)
* `is_urgent` (Boolean, default: `false` — ⚡ P0 emergency pin)
* `due_date` (Date, defaults to 7:00 PM local firm time)
* `deliverable_link` (Text, optional Figma/Drive/Dropbox URL for 1-click review)
* `completed_at` (Timestamp, for streak calculations)
* `review_started_at` (Timestamp, for 24h/48h manager aging warnings)
* `created_at` (Timestamp)

### Table 3: `blockers` (The Accountability Domino Engine)
* `id` (UUID, Primary Key)
* `task_id` (UUID ➔ references `tasks.id`, Unique active blocker per task)
* `blocked_by_type` (Enum: `'COLLEAGUE'`, `'CLIENT'`, `'EXTERNAL'`)
* `blocking_user_id` (UUID, nullable ➔ references `users.id` if colleague)
* `reason` (Text, mandatory 1-line explanation)
* `status` (Enum: `'ACTIVE'`, `'RESOLVED'`)
* `resolved_at` (Timestamp)
* `created_at` (Timestamp)

### Table 4: `notifications`
* `id` (UUID, Primary Key)
* `user_id` (UUID ➔ recipient, references `users.id`, indexed)
* `actor_id` (UUID ➔ who triggered it, references `users.id`)
* `task_id` (UUID, nullable ➔ links directly to target task)
* `type` (Enum: `'TASK_ASSIGNED'`, `'TASK_BLOCKED'`, `'BLOCKER_RESOLVED'`, `'NEEDS_REVIEW'`, `'REVIEW_APPROVED'`, `'REVIEW_REVISION'`, `'GENTLE_NUDGE'`)
* `title` & `body` (Text)
* `is_read` (Boolean, default: `false`)
* `email_sent` (Boolean, default: `false`)
* `created_at` (Timestamp)

---

## 4. User Roles & Permission Matrix

| Capability | Employee | Manager | Admin |
| :--- | :--- | :--- | :--- |
| **Default View** | `My Tasks` | `My Tasks` | `Team Board` |
| **Visible Scope** | Strictly own assigned/created tasks | Own tasks + Team Board | Full firm oversight + User Admin |
| **Task Creation** | Fast inline (Assignee auto-fills to self) | Fast inline for self + Assign to team | Assign to anyone in firm |
| **Sign-Off Authority** | Can complete personal subtasks only | Can approve/reject team deliverables | Can approve/reject any deliverable |
| **Deadline Modification** | No (prevents cheating on streaks) | Yes (tags as "Extended by Manager") | Yes |
| **User Provisioning** | No | No | Yes (create/deactivate team accounts) |

---

## 5. Phased Implementation Roadmap

### Phase 1: The Core Iron Engine (Launch First)
1. **Foundation & Auth**:
   * Next.js App Router with `@neondatabase/serverless` connection pooler.
   * Simple credential auth (Admin provisions accounts in Settings; zero public signup clutter).
   * PWA manifest setup (iOS safe-area support, Android standalone, desktop taskbar installable).
2. **Task Management & Views**:
   * Employee `My Tasks` view with 3-field rapid task entry (Title, auto-filled Assignee, Due Date).
   * Manager `Team Board` (People-First cards showing who is doing what right now).
   * Dual switcher for Managers/Admins (`[ My Tasks ]` / `[ Team Board ]`).
3. **The Accountability Loop**:
   * Lifecycle: `To Do` ➔ `In Progress` ➔ `Blocked` ➔ `Needs Review` ➔ `Done`.
   * Blocker modal with colleague/client selector + mandatory 1-line note.
   * Urgent blocker card on the responsible colleague's interface with 1-click `Mark Resolved`.
   * Manager sign-off interface (Approve or Request Changes with note).
   * 24h/48h aging alert for managers + Admin Bottleneck Widget.
4. **Core Aesthetics & Dopamine**:
   * Obsidian dark mode with sleek borders and contrast.
   * Tiered animated flame streak (CSS/SVG keyframes, zero battery drain).
   * Spring-draw SVG checkmark completion animation.
   * In-app notification center + transactional emails for critical blockers and reviews.

### Phase 2: The Extended Culture & Funk Suite (Layered After Habit is Formed)
1. **Manager Kudos Stickers** (🚀 Speed Demon, 💎 Pixel Perfect, 🧠 Big Brain, 👑 Chef's Kiss).
2. **"Inbox Zero / Daily Victory" Screen** with animated sunset/chill lounge illustration and stats.
3. **Tactile Sound ASMR** (mechanical keyboard clack, bubble pop, power-up unblock, with 1-click global mute).
4. **Theme Skins** (Cyberpunk Neon, Tokyo Matcha, Sunset Lo-Fi).
5. **Adaptive Pixel Mascot** reacting to workday state.
6. **Deliverable Links & Deep Linking**.
