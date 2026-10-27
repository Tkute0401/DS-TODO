import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await db.getNotifications(user.id);
  const unreadCount = items.filter((n) => !n.is_read).length;
  return NextResponse.json({ notifications: items, unreadCount });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, markAll } = await req.json();

    if (markAll) {
      await db.markAllNotificationsRead(user.id);
      return NextResponse.json({ success: true });
    }

    if (id) {
      await db.markNotificationRead(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Notification ID or markAll required' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { target_user_id, task_title, task_id } = await req.json();
    if (!target_user_id || !task_title) {
      return NextResponse.json({ error: 'Target user ID and task title required' }, { status: 400 });
    }

    const notif = await db.createNotification({
      id: `n-${Date.now()}`,
      user_id: target_user_id,
      actor_id: user.id,
      actor_name: user.name,
      task_id,
      type: 'GENTLE_NUDGE',
      title: '🔔 Friendly Nudge',
      body: `${user.name} sent a gentle nudge regarding "${task_title}". Whenever you have a moment to unblock! 🎬`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ notification: notif });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
