import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { Blocker } from '@/types';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch blockers where the current user is the one blocking others
  const blockersOnMe = await db.getBlockersForUser(user.id);
  return NextResponse.json({ blockersOnMe });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { task_id, blocked_by_type, blocking_user_id, reason } = body;

    if (!task_id || !blocked_by_type || !reason?.trim()) {
      return NextResponse.json({ error: 'Task ID, Blocker Type, and Reason are required' }, { status: 400 });
    }

    const task = await db.getTaskById(task_id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const newBlocker: Blocker = {
      id: `b-${Date.now()}`,
      task_id,
      blocked_by_type,
      blocking_user_id: blocked_by_type === 'COLLEAGUE' ? blocking_user_id : undefined,
      reason: reason.trim(),
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    const created = await db.createBlocker(newBlocker);

    // 1. If blocked by a colleague, alert that colleague with urgent action card
    if (blocked_by_type === 'COLLEAGUE' && blocking_user_id) {
      await db.createNotification({
        id: `n-${Date.now()}`,
        user_id: blocking_user_id,
        actor_id: user.id,
        actor_name: user.name,
        task_id: task.id,
        type: 'TASK_BLOCKED',
        title: '🚨 You Are Blocking Work',
        body: `${user.name} is waiting on you for "${task.title}": "${reason.trim()}"`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    // 2. Alert the task creator/manager so they have instant transparency
    if (task.creator_id !== user.id) {
      await db.createNotification({
        id: `n-${Date.now() + 1}`,
        user_id: task.creator_id,
        actor_id: user.id,
        actor_name: user.name,
        task_id: task.id,
        type: 'TASK_BLOCKED',
        title: 'Task Blocked',
        body: `${user.name} reported a blocker on "${task.title}": "${reason.trim()}"`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ blocker: created });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { blocker_id } = await req.json();
    if (!blocker_id) {
      return NextResponse.json({ error: 'Blocker ID required' }, { status: 400 });
    }

    const resolved = await db.resolveBlocker(blocker_id);
    if (!resolved) {
      return NextResponse.json({ error: 'Blocker not found' }, { status: 404 });
    }

    // Notify the blocked person that the path is clear!
    if (resolved.blocked_user_id) {
      await db.createNotification({
        id: `n-${Date.now()}`,
        user_id: resolved.blocked_user_id,
        actor_id: user.id,
        actor_name: user.name,
        task_id: resolved.task_id,
        type: 'BLOCKER_RESOLVED',
        title: '⚡ Blocker Resolved!',
        body: `${user.name} marked the blocker resolved on "${resolved.task_title}". Ready to resume!`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ blocker: resolved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
