import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { User, UserRole } from '@/types';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get('include_archived') === 'true' && user.role === 'ADMIN';

  const users = await db.getAllUsers(includeArchived);
  // Strip any internal password hashes
  const safeUsers = users.map((u) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safe } = u as User & { password_hash?: string };
    return safe as User;
  });
  return NextResponse.json({ users: safeUsers });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, role, designation, phone, password } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const existing = await db.getUserByEmail(email, true);
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const newUser = {
      id: `u-${Date.now()}`,
      email: email.trim().toLowerCase(),
      password_hash: password || 'password123',
      name: name.trim(),
      role: (role as UserRole) || 'EMPLOYEE',
      designation: designation?.trim() || 'Contributor',
      phone: phone?.trim() || '',
      avatar_url: '',
      is_active: true,
      is_on_leave: false,
      theme_skin: 'OBSIDIAN' as const,
      sound_enabled: true,
      email_notifications: true,
      push_notifications: true,
      current_streak: 0,
      created_at: new Date().toISOString(),
    };

    await db.createUser(newUser);
    const { password_hash: _, ...safe } = newUser;
    return NextResponse.json({ user: safe });
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
    const updates = await req.json();
    const targetUserId = (updates.userId && user.role === 'ADMIN') ? updates.userId : user.id;

    // Allow updating profile fields without overwriting omitted properties with undefined
    const allowedUpdates: Partial<User & { password_hash?: string }> = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.designation !== undefined) allowedUpdates.designation = updates.designation;
    if (updates.phone !== undefined) allowedUpdates.phone = updates.phone;
    if (updates.theme_skin !== undefined) allowedUpdates.theme_skin = updates.theme_skin;
    if (updates.sound_enabled !== undefined) allowedUpdates.sound_enabled = Boolean(updates.sound_enabled);
    if (updates.is_on_leave !== undefined) allowedUpdates.is_on_leave = Boolean(updates.is_on_leave);

    if (updates.password && typeof updates.password === 'string') {
      const trimmed = updates.password.trim();
      if (trimmed.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      allowedUpdates.password_hash = trimmed;
    }

    // Admin-specific actions: role modification and archiving/unarchiving
    if (user.role === 'ADMIN') {
      if (updates.role !== undefined) allowedUpdates.role = updates.role;
      if (updates.is_active !== undefined) {
        if (targetUserId === user.id && updates.is_active === false) {
          return NextResponse.json({ error: 'You cannot archive your own admin account' }, { status: 400 });
        }
        allowedUpdates.is_active = Boolean(updates.is_active);
      }
    }

    const updated = await db.updateUser(targetUserId, allowedUpdates);
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safe } = updated as User & { password_hash?: string };
    return NextResponse.json({ user: safe as User });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let targetUserId = searchParams.get('id');

    if (!targetUserId) {
      const body = await req.json().catch(() => ({}));
      targetUserId = body.id || body.userId;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 400 });
    }

    const targetUser = await db.getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.deleteUser(targetUserId);
    return NextResponse.json({ success: true, message: `User ${targetUser.name} deleted successfully` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
