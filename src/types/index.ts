export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type ThemeSkin = 'OBSIDIAN' | 'CYBERPUNK' | 'MATCHA' | 'SUNSET';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'NEEDS_REVIEW' | 'DONE';
export type BlockerType = 'COLLEAGUE' | 'CLIENT' | 'EXTERNAL';
export type BlockerStatus = 'ACTIVE' | 'RESOLVED';
export type KudosType = 'SPEED_DEMON' | 'PIXEL_PERFECT' | 'BIG_BRAIN' | 'CHEFS_KISS';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_BLOCKED'
  | 'BLOCKER_RESOLVED'
  | 'NEEDS_REVIEW'
  | 'REVIEW_APPROVED'
  | 'REVIEW_REVISION'
  | 'GENTLE_NUDGE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  designation: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_on_leave: boolean;
  theme_skin: ThemeSkin;
  sound_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  current_streak: number;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  creator_id: string;
  creator_name?: string;
  assignee_id: string;
  assignee_name?: string;
  assignee_designation?: string;
  status: TaskStatus;
  is_urgent: boolean;
  due_date: string; // YYYY-MM-DD
  deadline_extended?: boolean;
  deliverable_link?: string;
  completed_at?: string;
  review_started_at?: string;
  revision_note?: string;
  kudos_badge?: KudosType;
  active_blocker?: Blocker;
  created_at: string;
}

export interface Blocker {
  id: string;
  task_id: string;
  task_title?: string;
  blocked_by_type: BlockerType;
  blocking_user_id?: string;
  blocking_user_name?: string;
  blocked_user_id?: string;
  blocked_user_name?: string;
  reason: string;
  status: BlockerStatus;
  resolved_at?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  actor_id: string;
  actor_name?: string;
  task_id?: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface KudosItem {
  id: string;
  task_id: string;
  from_user_id: string;
  from_user_name?: string;
  to_user_id: string;
  badge_type: KudosType;
  created_at: string;
}
