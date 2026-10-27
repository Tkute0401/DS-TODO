# Section 4: Technical Architecture, Neon Postgres & PWA

> **Benchmark Goal**: Keep architecture unified, serverless, and maintainable with zero avoidable dependencies and zero connection pool leaks.

---

## 1. Engineering Stack

* **Framework**: Next.js App Router (React + Server Components + Route Handlers).
* **Database**: **Neon Serverless Postgres** via `@neondatabase/serverless` HTTP query driver and connection pooler endpoint (`-pooler.neon.tech`).
* **Styling**: Vanilla CSS / modern CSS Modules with HSL design tokens (per web application guidelines).
* **PWA & Mobile**: Service Worker + Web App Manifest (`display: standalone`, `viewport-fit=cover`, Apple touch icons).
* **Auth**: Secure session cookies with bcrypt password hashing (Admin-provisioned credentials).
* **Notifications**: In-app Notification Center + Transactional Email (Resend / Nodemailer / SMTP).

---

## 2. Complete Database Schema (DDL)

```sql
-- 1. USERS TABLE
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');
CREATE TYPE theme_skin AS ENUM ('OBSIDIAN', 'CYBERPUNK', 'MATCHA', 'SUNSET');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    designation TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_on_leave BOOLEAN NOT NULL DEFAULT false,
    theme_skin theme_skin NOT NULL DEFAULT 'OBSIDIAN',
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    push_notifications BOOLEAN NOT NULL DEFAULT true,
    current_streak INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TASKS TABLE
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'NEEDS_REVIEW', 'DONE');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assignee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status task_status NOT NULL DEFAULT 'TODO',
    is_urgent BOOLEAN NOT NULL DEFAULT false,
    due_date DATE,
    deliverable_link TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    review_started_at TIMESTAMP WITH TIME ZONE,
    revision_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- 3. BLOCKERS TABLE
CREATE TYPE blocker_type AS ENUM ('COLLEAGUE', 'CLIENT', 'EXTERNAL');
CREATE TYPE blocker_status AS ENUM ('ACTIVE', 'RESOLVED');

CREATE TABLE blockers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    blocked_by_type blocker_type NOT NULL,
    blocking_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status blocker_status NOT NULL DEFAULT 'ACTIVE',
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blockers_blocking_user ON blockers(blocking_user_id, status);

-- 4. NOTIFICATIONS TABLE
CREATE TYPE notification_type AS ENUM (
    'TASK_ASSIGNED', 
    'TASK_BLOCKED', 
    'BLOCKER_RESOLVED', 
    'NEEDS_REVIEW', 
    'REVIEW_APPROVED', 
    'REVIEW_REVISION', 
    'GENTLE_NUDGE'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    email_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- 5. KUDOS TABLE
CREATE TYPE kudos_type AS ENUM ('SPEED_DEMON', 'PIXEL_PERFECT', 'BIG_BRAIN', 'CHEFS_KISS');

CREATE TABLE kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_type kudos_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 3. PWA Manifest & System Tray Standards

* `display`: `"standalone"`
* `start_url`: `"/app"`
* `theme_color`: `"#090A0F"` (Obsidian black)
* `background_color`: `"#090A0F"`
* `icons`: 192x192 and 512x512 maskable PNGs.
* `run_on_os_login`: `true` (enables automatic startup on Windows/Mac desktop login).
* Touch target size: Minimum **48px x 48px** for all interactive buttons.
* iOS Safari support: `viewport-fit=cover` with safe-area bottom padding for home indicator.
