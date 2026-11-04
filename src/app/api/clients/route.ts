import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { ClientDeliverable } from '@/types';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only Managers and Admins can view client deliverables
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Manager or Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || undefined;

  try {
    const clients = await db.getClientDeliverables(month);
    return NextResponse.json({ clients });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Manager or Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, client_name, month, target_reels, completed_reels, target_graphics, completed_graphics, notes } = body;

    if (!client_name || !client_name.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Valid month (YYYY-MM) is required' }, { status: 400 });
    }

    const deliverableId = id || `cd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const deliverable: ClientDeliverable = {
      id: deliverableId,
      client_name: client_name.trim(),
      month,
      target_reels: Number(target_reels) || 0,
      completed_reels: Number(completed_reels) || 0,
      target_graphics: Number(target_graphics) || 0,
      completed_graphics: Number(completed_graphics) || 0,
      notes: notes ? String(notes).trim() : undefined,
      created_at: new Date().toISOString(),
    };

    const saved = await db.upsertClientDeliverable(deliverable);
    return NextResponse.json({ client: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Manager or Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, field, delta, target_reels, target_graphics, completed_reels, completed_graphics, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Deliverable ID is required' }, { status: 400 });
    }

    const allClients = await db.getClientDeliverables();
    const current = allClients.find((c) => c.id === id);
    if (!current) {
      return NextResponse.json({ error: 'Client deliverable not found' }, { status: 404 });
    }

    const updated: ClientDeliverable = { ...current };

    if (field === 'reels' && typeof delta === 'number') {
      updated.completed_reels = Math.max(0, (updated.completed_reels || 0) + delta);
    } else if (field === 'graphics' && typeof delta === 'number') {
      updated.completed_graphics = Math.max(0, (updated.completed_graphics || 0) + delta);
    }

    if (target_reels !== undefined) updated.target_reels = Math.max(0, Number(target_reels));
    if (target_graphics !== undefined) updated.target_graphics = Math.max(0, Number(target_graphics));
    if (completed_reels !== undefined && field !== 'reels') updated.completed_reels = Math.max(0, Number(completed_reels));
    if (completed_graphics !== undefined && field !== 'graphics') updated.completed_graphics = Math.max(0, Number(completed_graphics));
    if (notes !== undefined) updated.notes = String(notes);

    const saved = await db.upsertClientDeliverable(updated);
    return NextResponse.json({ client: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Manager or Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    await db.deleteClientDeliverable(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
