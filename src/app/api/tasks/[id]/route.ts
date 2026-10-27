import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { TaskStatus } from '@/types';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const task = await db.getTaskById(id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Permission check: An employee can only update tasks assigned to them
  if (user.role === 'EMPLOYEE' && task.assignee_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, status, deliverable_link, due_date, is_urgent, revision_note, kudos_badge, assignee_id } = body;

    const updates: Record<string, unknown> = {};

    if (title !== undefined && typeof title === 'string') {
      const trimmed = title.trim();
      if (!trimmed) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      if (user.role === 'EMPLOYEE' && task.creator_id !== user.id) {
        return NextResponse.json({ error: 'Employees cannot rename assigned tasks' }, { status: 403 });
      }
      updates.title = trimmed;
    }

    if (assignee_id !== undefined && assignee_id !== task.assignee_id) {
      if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only managers and admins can reassign tasks' }, { status: 403 });
      }
      updates.assignee_id = assignee_id;
      await db.createNotification({
        id: `n-${Date.now()}`,
        user_id: assignee_id,
        actor_id: user.id,
        actor_name: user.name,
        task_id: task.id,
        type: 'TASK_ASSIGNED',
        title: 'Deliverable Reassigned to You',
        body: `${user.name} reassigned "${task.title}" to you.`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    if (due_date !== undefined) {
      // Only Managers/Admins or self-creators can alter due dates
      if (user.role === 'EMPLOYEE' && task.creator_id !== user.id) {
        return NextResponse.json({ error: 'Employees cannot alter assigned due dates' }, { status: 403 });
      }
      updates.due_date = due_date;

      // When a Manager or Admin extends a deadline
      if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        if (due_date > task.due_date) {
          updates.deadline_extended = true;
        }
        if (task.assignee_id !== user.id) {
          await db.createNotification({
            id: `n-${Date.now()}`,
            user_id: task.assignee_id,
            actor_id: user.id,
            actor_name: user.name,
            task_id: task.id,
            type: 'TASK_ASSIGNED',
            title: 'Deadline Extended',
            body: `${user.name} extended the deadline on "${task.title}" to ${due_date}.`,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    if (body.deadline_extended !== undefined) {
      updates.deadline_extended = Boolean(body.deadline_extended);
    }

    if (is_urgent !== undefined) {
      if (user.role === 'EMPLOYEE' && task.creator_id !== user.id) {
        return NextResponse.json({ error: 'Only task creator or manager can toggle urgent status' }, { status: 403 });
      }
      updates.is_urgent = Boolean(is_urgent);
    }

    if (deliverable_link !== undefined) {
      updates.deliverable_link = deliverable_link;
    }

    // 1. Revision Request (Manager / Admin sending deliverable back to In Progress with feedback)
    if (revision_note) {
      if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only managers and admins can request revisions' }, { status: 403 });
      }

      updates.status = 'IN_PROGRESS';
      updates.revision_note = typeof revision_note === 'string' ? revision_note.trim() : revision_note;
      updates.review_started_at = null;
      updates.completed_at = null;

      if (task.status === 'DONE') {
        const assignee = await db.getUserById(task.assignee_id);
        if (assignee && !assignee.is_on_leave && (assignee.current_streak || 0) > 0) {
          await db.updateUser(assignee.id, { current_streak: assignee.current_streak - 1 });
        }
      }

      await db.createNotification({
        id: `n-${Date.now()}`,
        user_id: task.assignee_id,
        actor_id: user.id,
        actor_name: user.name,
        task_id: task.id,
        type: 'REVIEW_REVISION',
        title: 'Revisions Requested',
        body: `${user.name} requested changes on "${task.title}": "${String(revision_note).trim()}"`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } else if (status) {
      const newStatus = status as TaskStatus;

      // Rule: If deliverable is submitted for review or if an employee marks it Done (including self-made tasks),
      // it MUST route to 'NEEDS_REVIEW' for manager / admin sign-off!
      const isEmployeeSubmission = user.role === 'EMPLOYEE' && (newStatus === 'DONE' || newStatus === 'NEEDS_REVIEW');
      const isExplicitReview = newStatus === 'NEEDS_REVIEW';

      if (isEmployeeSubmission || isExplicitReview) {
        updates.status = 'NEEDS_REVIEW';
        updates.review_started_at = new Date().toISOString();

        // If employee created the task themselves, alert all active managers and admins!
        if (task.creator_id === user.id) {
          const allUsers = await db.getAllUsers();
          const reviewers = allUsers.filter(
            (u) => u.is_active !== false && (u.role === 'MANAGER' || u.role === 'ADMIN') && u.id !== user.id
          );
          for (const reviewer of reviewers) {
            await db.createNotification({
              id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              user_id: reviewer.id,
              actor_id: user.id,
              actor_name: user.name,
              task_id: task.id,
              type: 'NEEDS_REVIEW',
              title: 'Self-Made Task Submitted for Review',
              body: `${user.name} submitted self-created task "${task.title}" for review.`,
              is_read: false,
              created_at: new Date().toISOString(),
            });
          }
        } else {
          // Deliverable assigned by another user: notify creator
          await db.createNotification({
            id: `n-${Date.now()}`,
            user_id: task.creator_id,
            actor_id: user.id,
            actor_name: user.name,
            task_id: task.id,
            type: 'NEEDS_REVIEW',
            title: 'Deliverable Submitted for Review',
            body: `${user.name} submitted "${task.title}" for verification.`,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      } else if (newStatus === 'DONE') {
        // Officially approved
        updates.status = 'DONE';
        updates.completed_at = new Date().toISOString();
        updates.review_started_at = null;
        updates.revision_note = null;

        // Increment on-time streak ONLY when newly transitioning to DONE on or before due date
        if (task.status !== 'DONE') {
          const todayDateStr = new Date().toISOString().split('T')[0];
          const isTodayOrEarlier = (task.due_date ? task.due_date >= todayDateStr : true) || Boolean(task.deadline_extended);
          if (isTodayOrEarlier) {
            const assignee = await db.getUserById(task.assignee_id);
            if (assignee && !assignee.is_on_leave) {
              await db.updateUser(assignee.id, { current_streak: (assignee.current_streak || 0) + 1 });
            }
          }
        }

        // Add kudos or approval notification if signed off by manager/admin
        if (kudos_badge) {
          updates.kudos_badge = kudos_badge;
          await db.addKudos({
            id: `k-${Date.now()}`,
            task_id: task.id,
            from_user_id: user.id,
            from_user_name: user.name,
            to_user_id: task.assignee_id,
            badge_type: kudos_badge,
            created_at: new Date().toISOString(),
          });

          await db.createNotification({
            id: `n-${Date.now()}`,
            user_id: task.assignee_id,
            actor_id: user.id,
            actor_name: user.name,
            task_id: task.id,
            type: 'REVIEW_APPROVED',
            title: `Deliverable Approved with Kudos: ${task.title}`,
            body: `${user.name} approved "${task.title}" with ${kudos_badge} kudos badge! 💎`,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        } else if (user.id !== task.assignee_id) {
          await db.createNotification({
            id: `n-${Date.now()}`,
            user_id: task.assignee_id,
            actor_id: user.id,
            actor_name: user.name,
            task_id: task.id,
            type: 'REVIEW_APPROVED',
            title: `Deliverable Approved: ${task.title}`,
            body: `${user.name} approved "${task.title}". Great job!`,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      } else {
        updates.status = newStatus;
        if (newStatus === 'IN_PROGRESS' || newStatus === 'TODO') {
          updates.review_started_at = null;
          if (task.status === 'DONE') {
            const assignee = await db.getUserById(task.assignee_id);
            if (assignee && !assignee.is_on_leave && (assignee.current_streak || 0) > 0) {
              await db.updateUser(assignee.id, { current_streak: assignee.current_streak - 1 });
            }
          }
        }
      }
    }

    const updated = await db.updateTask(id, updates);
    return NextResponse.json({ task: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const task = await db.getTaskById(id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Anti-cheating guard: Employees cannot delete tasks assigned by a manager
  if (user.role === 'EMPLOYEE' && task.creator_id !== user.id) {
    return NextResponse.json(
      { error: 'You cannot delete tasks assigned to you by a manager' },
      { status: 403 }
    );
  }

  await db.deleteTask(id);
  return NextResponse.json({ success: true });
}
