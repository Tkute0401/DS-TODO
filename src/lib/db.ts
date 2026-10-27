import { neon } from '@neondatabase/serverless';
import { User, Task, Blocker, NotificationItem, KudosItem } from '@/types';

// Initial seed administrator (Tanmay Kute)
const SEED_USERS: (User & { password_hash: string })[] = [
  {
    id: 'u-admin-tanmay',
    email: 'tanmay@firm.com',
    password_hash: 'password123',
    name: 'Tanmay Kute',
    role: 'ADMIN',
    designation: 'Managing Director & Administrator',
    phone: '+919876543210',
    avatar_url: '',
    is_active: true,
    is_on_leave: false,
    theme_skin: 'OBSIDIAN',
    sound_enabled: true,
    email_notifications: true,
    push_notifications: true,
    current_streak: 1,
    created_at: new Date().toISOString(),
  },
];

const SEED_TASKS: Task[] = [];

// In-Memory Database Class
class InMemoryDB {
  users = [...SEED_USERS];
  tasks = [...SEED_TASKS];
  blockers: Blocker[] = [];
  notifications: NotificationItem[] = [];
  kudos: KudosItem[] = [];

  async getUserByEmail(email: string, includeInactive = false) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && (includeInactive || u.is_active));
  }

  async getUserById(id: string, includeInactive = true) {
    return this.users.find((u) => u.id === id && (includeInactive || u.is_active));
  }

  async getAllUsers(includeInactive = false) {
    return includeInactive ? this.users : this.users.filter((u) => u.is_active);
  }

  async createUser(user: User & { password_hash: string }) {
    this.users.push(user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User & { password_hash?: string }>) {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates };
      return this.users[idx];
    }
    return null;
  }

  async deleteUser(id: string) {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.users.splice(idx, 1);
      return true;
    }
    return false;
  }

  async getTasksForUser(userId: string) {
    return this.tasks
      .filter((t) => t.assignee_id === userId)
      .map((t) => this.enrichTask(t));
  }

  async getAllTasks() {
    return this.tasks.map((t) => this.enrichTask(t));
  }

  async getTaskById(id: string) {
    const t = this.tasks.find((task) => task.id === id);
    return t ? this.enrichTask(t) : null;
  }

  enrichTask(task: Task): Task {
    const creator = this.users.find((u) => u.id === task.creator_id);
    const assignee = this.users.find((u) => u.id === task.assignee_id);
    const activeBlocker = this.blockers.find(
      (b) => b.task_id === task.id && b.status === 'ACTIVE'
    );
    return {
      ...task,
      creator_name: creator?.name || 'Unknown',
      assignee_name: assignee?.name || 'Unknown',
      assignee_designation: assignee?.designation || '',
      active_blocker: activeBlocker ? this.enrichBlocker(activeBlocker) : undefined,
    };
  }

  enrichBlocker(b: Blocker): Blocker {
    const task = this.tasks.find((t) => t.id === b.task_id);
    const blockingUser = b.blocking_user_id ? this.users.find((u) => u.id === b.blocking_user_id) : undefined;
    const blockedUser = task ? this.users.find((u) => u.id === task.assignee_id) : undefined;
    return {
      ...b,
      task_title: task?.title || '',
      blocking_user_name: blockingUser?.name,
      blocked_user_id: task?.assignee_id,
      blocked_user_name: blockedUser?.name,
    };
  }

  async createTask(task: Task) {
    this.tasks.unshift(task);
    return this.enrichTask(task);
  }

  async updateTask(id: string, updates: Partial<Task>) {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.tasks[idx] = { ...this.tasks[idx], ...updates };
      return this.enrichTask(this.tasks[idx]);
    }
    return null;
  }

  async deleteTask(id: string) {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.tasks.splice(idx, 1);
      return true;
    }
    return false;
  }

  async createBlocker(blocker: Blocker) {
    this.blockers.push(blocker);
    return this.enrichBlocker(blocker);
  }

  async resolveBlocker(blockerId: string) {
    const idx = this.blockers.findIndex((b) => b.id === blockerId);
    if (idx !== -1) {
      this.blockers[idx].status = 'RESOLVED';
      this.blockers[idx].resolved_at = new Date().toISOString();
      return this.enrichBlocker(this.blockers[idx]);
    }
    return null;
  }

  async getBlockersForUser(userId: string) {
    return this.blockers
      .filter((b) => b.blocking_user_id === userId && b.status === 'ACTIVE')
      .map((b) => this.enrichBlocker(b));
  }

  async getNotifications(userId: string) {
    return this.notifications.filter((n) => n.user_id === userId);
  }

  async createNotification(notif: NotificationItem) {
    this.notifications.unshift(notif);
    return notif;
  }

  async markNotificationRead(id: string) {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n) n.is_read = true;
    return n;
  }

  async markAllNotificationsRead(userId: string) {
    this.notifications.forEach((n) => {
      if (n.user_id === userId) n.is_read = true;
    });
    return true;
  }

  async addKudos(kudos: KudosItem) {
    this.kudos.unshift(kudos);
    return kudos;
  }
}

// Neon Postgres Database Adapter Class
class NeonDB {
  private sql: ReturnType<typeof neon>;
  private schemaInitialized = false;

  constructor(connectionString: string) {
    this.sql = neon(connectionString);
  }

  private async ensureSchema() {
    if (this.schemaInitialized) return;
    try {
      // Create tables if not exists
      await this.sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'EMPLOYEE',
          designation TEXT,
          phone TEXT,
          avatar_url TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          is_on_leave BOOLEAN NOT NULL DEFAULT false,
          theme_skin TEXT NOT NULL DEFAULT 'OBSIDIAN',
          sound_enabled BOOLEAN NOT NULL DEFAULT true,
          email_notifications BOOLEAN NOT NULL DEFAULT true,
          push_notifications BOOLEAN NOT NULL DEFAULT true,
          current_streak INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await this.sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          creator_id TEXT NOT NULL,
          assignee_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'TODO',
          is_urgent BOOLEAN NOT NULL DEFAULT false,
          due_date TEXT,
          deadline_extended BOOLEAN NOT NULL DEFAULT false,
          deliverable_link TEXT,
          completed_at TIMESTAMPTZ,
          review_started_at TIMESTAMPTZ,
          revision_note TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await this.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline_extended BOOLEAN DEFAULT false;`;
      await this.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS kudos_badge TEXT;`;

      await this.sql`
        CREATE TABLE IF NOT EXISTS blockers (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          blocked_by_type TEXT NOT NULL,
          blocking_user_id TEXT,
          reason TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          resolved_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await this.sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          actor_id TEXT NOT NULL,
          actor_name TEXT,
          task_id TEXT,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT false,
          email_sent BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await this.sql`
        CREATE TABLE IF NOT EXISTS kudos (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          from_user_id TEXT NOT NULL,
          from_user_name TEXT,
          to_user_id TEXT NOT NULL,
          badge_type TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      // Seed initial admin if users table is empty
      const existing = (await this.sql`SELECT COUNT(*)::int AS count FROM users;`) as unknown as { count: number }[];
      if (existing[0]?.count === 0) {
        for (const u of SEED_USERS) {
          await this.sql`
            INSERT INTO users (id, email, password_hash, name, role, designation, phone, current_streak)
            VALUES (${u.id}, ${u.email}, ${u.password_hash}, ${u.name}, ${u.role}, ${u.designation}, ${u.phone}, ${u.current_streak});
          `;
        }
      }

      this.schemaInitialized = true;
    } catch (e) {
      console.error('Neon schema initialization error:', e);
    }
  }

  async getUserByEmail(email: string, includeInactive = false) {
    await this.ensureSchema();
    const rows = includeInactive
      ? ((await this.sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1;`) as unknown as (User & { password_hash: string })[])
      : ((await this.sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) AND is_active = true LIMIT 1;`) as unknown as (User & { password_hash: string })[]);
    return rows[0] || null;
  }

  async getUserById(id: string) {
    await this.ensureSchema();
    const rows = (await this.sql`SELECT * FROM users WHERE id = ${id} LIMIT 1;`) as unknown as User[];
    return rows[0] || null;
  }

  async getAllUsers(includeInactive = false) {
    await this.ensureSchema();
    const rows = includeInactive
      ? await this.sql`SELECT * FROM users ORDER BY name ASC;`
      : await this.sql`SELECT * FROM users WHERE is_active = true ORDER BY name ASC;`;
    return rows as unknown as User[];
  }

  async createUser(user: User & { password_hash: string }) {
    await this.ensureSchema();
    await this.sql`
      INSERT INTO users (id, email, password_hash, name, role, designation, phone)
      VALUES (${user.id}, ${user.email}, ${user.password_hash}, ${user.name}, ${user.role}, ${user.designation}, ${user.phone});
    `;
    return user;
  }

  async updateUser(id: string, updates: Partial<User & { password_hash?: string }>) {
    await this.ensureSchema();
    // Dynamic update helper
    const current = (await this.getUserById(id)) as (User & { password_hash?: string }) | null;
    if (!current) return null;
    const merged = { ...current, ...updates };
    await this.sql`
      UPDATE users SET 
        name = ${merged.name},
        role = ${merged.role},
        designation = ${merged.designation},
        phone = ${merged.phone || null},
        password_hash = ${merged.password_hash || current.password_hash || 'password123'},
        theme_skin = ${merged.theme_skin},
        sound_enabled = ${merged.sound_enabled},
        is_active = ${merged.is_active !== undefined ? merged.is_active : true},
        is_on_leave = ${merged.is_on_leave},
        current_streak = ${merged.current_streak}
      WHERE id = ${id};
    `;
    return merged;
  }

  async deleteUser(id: string) {
    await this.ensureSchema();
    await this.sql`DELETE FROM kudos WHERE from_user_id = ${id} OR to_user_id = ${id};`;
    await this.sql`DELETE FROM notifications WHERE user_id = ${id} OR actor_id = ${id};`;
    await this.sql`DELETE FROM blockers WHERE blocking_user_id = ${id} OR task_id IN (SELECT id FROM tasks WHERE assignee_id = ${id} OR creator_id = ${id});`;
    await this.sql`DELETE FROM tasks WHERE assignee_id = ${id} OR creator_id = ${id};`;
    await this.sql`DELETE FROM users WHERE id = ${id};`;
    return true;
  }

  async getTasksForUser(userId: string) {
    await this.ensureSchema();
    const tasks = (await this.sql`
      SELECT t.*, u_creator.name as creator_name, u_assignee.name as assignee_name, u_assignee.designation as assignee_designation
      FROM tasks t
      LEFT JOIN users u_creator ON t.creator_id = u_creator.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      WHERE t.assignee_id = ${userId}
      ORDER BY t.created_at DESC;
    `) as unknown as Task[];
    return this.attachBlockers(tasks);
  }

  async getAllTasks() {
    await this.ensureSchema();
    const tasks = (await this.sql`
      SELECT t.*, u_creator.name as creator_name, u_assignee.name as assignee_name, u_assignee.designation as assignee_designation
      FROM tasks t
      LEFT JOIN users u_creator ON t.creator_id = u_creator.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      ORDER BY t.created_at DESC;
    `) as unknown as Task[];
    return this.attachBlockers(tasks);
  }

  private async attachBlockers(tasks: Task[]) {
    if (tasks.length === 0) return [];
    const blockers = (await this.sql`
      SELECT b.*, t.title as task_title, t.assignee_id as blocked_user_id, u_blocker.name as blocking_user_name, u_blocked.name as blocked_user_name
      FROM blockers b
      LEFT JOIN tasks t ON b.task_id = t.id
      LEFT JOIN users u_blocker ON b.blocking_user_id = u_blocker.id
      LEFT JOIN users u_blocked ON t.assignee_id = u_blocked.id
      WHERE b.status = 'ACTIVE';
    `) as unknown as Blocker[];

    return tasks.map((t) => ({
      ...t,
      active_blocker: blockers.find((b) => b.task_id === t.id),
    }));
  }

  async getTaskById(id: string) {
    await this.ensureSchema();
    const rows = (await this.sql`
      SELECT t.*, u_creator.name as creator_name, u_assignee.name as assignee_name, u_assignee.designation as assignee_designation
      FROM tasks t
      LEFT JOIN users u_creator ON t.creator_id = u_creator.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      WHERE t.id = ${id}
      LIMIT 1;
    `) as unknown as Task[];
    if (rows.length === 0) return null;
    const enriched = await this.attachBlockers([rows[0]]);
    return enriched[0];
  }

  async createTask(task: Task) {
    await this.ensureSchema();
    await this.sql`
      INSERT INTO tasks (id, title, creator_id, assignee_id, status, is_urgent, due_date, deadline_extended, deliverable_link, kudos_badge)
      VALUES (${task.id}, ${task.title}, ${task.creator_id}, ${task.assignee_id}, ${task.status}, ${task.is_urgent}, ${task.due_date}, ${Boolean(task.deadline_extended)}, ${task.deliverable_link || null}, ${task.kudos_badge || null});
    `;
    return this.getTaskById(task.id) as Promise<Task>;
  }

  async updateTask(id: string, updates: Partial<Task>) {
    await this.ensureSchema();
    const current = await this.getTaskById(id);
    if (!current) return null;
    const merged = { ...current, ...updates };
    await this.sql`
      UPDATE tasks SET
        title = ${merged.title},
        assignee_id = ${merged.assignee_id},
        status = ${merged.status},
        is_urgent = ${merged.is_urgent},
        due_date = ${merged.due_date || null},
        deadline_extended = ${Boolean(merged.deadline_extended)},
        deliverable_link = ${merged.deliverable_link || null},
        completed_at = ${merged.completed_at ? new Date(merged.completed_at) : null},
        review_started_at = ${merged.review_started_at ? new Date(merged.review_started_at) : null},
        revision_note = ${merged.revision_note || null},
        kudos_badge = ${merged.kudos_badge || null}
      WHERE id = ${id};
    `;
    return this.getTaskById(id);
  }

  async deleteTask(id: string) {
    await this.ensureSchema();
    await this.sql`DELETE FROM tasks WHERE id = ${id};`;
    return true;
  }

  async createBlocker(blocker: Blocker) {
    await this.ensureSchema();
    await this.sql`
      INSERT INTO blockers (id, task_id, blocked_by_type, blocking_user_id, reason, status)
      VALUES (${blocker.id}, ${blocker.task_id}, ${blocker.blocked_by_type}, ${blocker.blocking_user_id || null}, ${blocker.reason}, 'ACTIVE');
    `;
    return blocker;
  }

  async resolveBlocker(blockerId: string) {
    await this.ensureSchema();
    await this.sql`
      UPDATE blockers SET status = 'RESOLVED', resolved_at = NOW()
      WHERE id = ${blockerId};
    `;
    const rows = (await this.sql`
      SELECT b.*, t.title as task_title, t.assignee_id as blocked_user_id, u_blocker.name as blocking_user_name, u_blocked.name as blocked_user_name
      FROM blockers b
      LEFT JOIN tasks t ON b.task_id = t.id
      LEFT JOIN users u_blocker ON b.blocking_user_id = u_blocker.id
      LEFT JOIN users u_blocked ON t.assignee_id = u_blocked.id
      WHERE b.id = ${blockerId}
      LIMIT 1;
    `) as unknown as Blocker[];
    return rows[0] || null;
  }

  async getBlockersForUser(userId: string) {
    await this.ensureSchema();
    const rows = (await this.sql`
      SELECT b.*, t.title as task_title, t.assignee_id as blocked_user_id, u_blocker.name as blocking_user_name, u_blocked.name as blocked_user_name
      FROM blockers b
      LEFT JOIN tasks t ON b.task_id = t.id
      LEFT JOIN users u_blocker ON b.blocking_user_id = u_blocker.id
      LEFT JOIN users u_blocked ON t.assignee_id = u_blocked.id
      WHERE b.blocking_user_id = ${userId} AND b.status = 'ACTIVE';
    `) as unknown as Blocker[];
    return rows;
  }

  async getNotifications(userId: string) {
    await this.ensureSchema();
    const rows = (await this.sql`
      SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC;
    `) as unknown as NotificationItem[];
    return rows;
  }

  async createNotification(notif: NotificationItem) {
    await this.ensureSchema();
    await this.sql`
      INSERT INTO notifications (id, user_id, actor_id, actor_name, task_id, type, title, body, is_read)
      VALUES (${notif.id}, ${notif.user_id}, ${notif.actor_id}, ${notif.actor_name || null}, ${notif.task_id || null}, ${notif.type}, ${notif.title}, ${notif.body}, false);
    `;
    return notif;
  }

  async markNotificationRead(id: string) {
    await this.ensureSchema();
    await this.sql`UPDATE notifications SET is_read = true WHERE id = ${id};`;
    return { id, is_read: true };
  }

  async markAllNotificationsRead(userId: string) {
    await this.ensureSchema();
    await this.sql`UPDATE notifications SET is_read = true WHERE user_id = ${userId};`;
    return true;
  }

  async addKudos(kudos: KudosItem) {
    await this.ensureSchema();
    await this.sql`
      INSERT INTO kudos (id, task_id, from_user_id, from_user_name, to_user_id, badge_type)
      VALUES (${kudos.id}, ${kudos.task_id}, ${kudos.from_user_id}, ${kudos.from_user_name || null}, ${kudos.to_user_id}, ${kudos.badge_type});
    `;
    return kudos;
  }
}

// Global Singleton factory: Switches seamlessly between Neon and In-Memory
const globalForDb = globalThis as unknown as { dbInstance?: InMemoryDB | NeonDB };

function getDatabase(): InMemoryDB | NeonDB {
  if (globalForDb.dbInstance) return globalForDb.dbInstance;

  const connectionString = process.env.DATABASE_URL;
  if (connectionString && connectionString.trim() !== '') {
    globalForDb.dbInstance = new NeonDB(connectionString.trim());
  } else {
    globalForDb.dbInstance = new InMemoryDB();
  }

  return globalForDb.dbInstance;
}

export const db = getDatabase();

export function getNeonSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  return neon(connectionString);
}
