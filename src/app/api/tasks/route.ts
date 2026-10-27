import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { Task } from '@/types';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const viewMode = searchParams.get('view'); // 'my' or 'all'

  // Strict Isolation: Employees can ONLY ever see their own tasks
  if (user.role === 'EMPLOYEE' || viewMode === 'my') {
    const tasks = await db.getTasksForUser(user.id);
    return NextResponse.json({ tasks });
  }

  // Managers and Admins can see the global board
  const tasks = await db.getAllTasks();
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, due_date, is_urgent, assignee_id } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Individual contributors can ONLY assign tasks to themselves
    const finalAssigneeId = user.role === 'EMPLOYEE' ? user.id : (assignee_id || user.id);

    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: title.trim(),
      creator_id: user.id,
      assignee_id: finalAssigneeId,
      status: 'TODO',
      is_urgent: Boolean(is_urgent),
      due_date: due_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    const created = await db.createTask(newTask);

    // If a manager assigned this to someone else, dispatch notification
    if (finalAssigneeId !== user.id) {
      await db.createNotification({
        id: `n-${Date.now()}`,
        user_id: finalAssigneeId,
        actor_id: user.id,
        actor_name: user.name,
        task_id: created.id,
        type: 'TASK_ASSIGNED',
        title: 'New Deliverable Assigned',
        body: `${user.name} assigned you "${created.title}"`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ task: created });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
