import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionUser } from '@/types/user';
import { ensureDbConnected } from '@/lib/db-utils';
import Volunteer, { VolunteerDocument } from '@/models/volunteer';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = ['pending', 'approved', 'contacted', 'rejected', 'inactive'] as const;
type VolunteerStatus = typeof ALLOWED_STATUSES[number];

function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeArray(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return undefined;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { volunteerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    await ensureDbConnected();

    const volunteer: VolunteerDocument | null = await Volunteer.findOne({ volunteerId: params.volunteerId });

    if (!volunteer) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    const body = await request.json();

    let hasUpdates = false;

    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid volunteer status' }, { status: 400 });
      }
      if (volunteer.status !== body.status) {
        volunteer.status = body.status as VolunteerStatus;
        hasUpdates = true;
      }
    }

    const firstName = sanitizeString(body.firstName);
    if (firstName !== undefined && volunteer.firstName !== firstName) {
      volunteer.firstName = firstName;
      hasUpdates = true;
    }

    const lastName = sanitizeString(body.lastName);
    if (lastName !== undefined && volunteer.lastName !== lastName) {
      volunteer.lastName = lastName;
      hasUpdates = true;
    }

    const email = sanitizeString(body.email);
    if (email !== undefined && volunteer.email !== email) {
      volunteer.email = email;
      hasUpdates = true;
    }

    if (body.phone !== undefined) {
      const phone = sanitizeString(body.phone);
      if (volunteer.phone !== phone) {
        volunteer.phone = phone;
        hasUpdates = true;
      }
    }

    if (body.city !== undefined) {
      const city = sanitizeString(body.city);
      if (city !== undefined && volunteer.city !== city) {
        volunteer.city = city;
        hasUpdates = true;
      }
    }

    if (body.state !== undefined) {
      const state = sanitizeString(body.state);
      if (state !== undefined && volunteer.state !== state) {
        volunteer.state = state;
        hasUpdates = true;
      }
    }

    if (body.availability !== undefined) {
      const availability = sanitizeString(body.availability);
      if (availability !== undefined && volunteer.availability !== availability) {
        volunteer.availability = availability;
        hasUpdates = true;
      }
    }

    if (body.skills !== undefined) {
      const skills = sanitizeString(body.skills);
      if (volunteer.skills !== skills) {
        volunteer.skills = skills;
        hasUpdates = true;
      }
    }

    if (body.message !== undefined) {
      const message = typeof body.message === 'string' ? body.message : '';
      if (volunteer.message !== message) {
        volunteer.message = message;
        hasUpdates = true;
      }
    }

    if (body.interests !== undefined) {
      const interests = sanitizeArray(body.interests) ?? [];
      if (JSON.stringify(volunteer.interests ?? []) !== JSON.stringify(interests)) {
        volunteer.interests = interests;
        hasUpdates = true;
      }
    }

    // Update derived name if provided explicitly
    if (body.name !== undefined) {
      const name = sanitizeString(body.name);
      if (name && volunteer.name !== name) {
        volunteer.name = name;
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return NextResponse.json({ success: true, volunteer });
    }

    await volunteer.save();

    return NextResponse.json({ success: true, volunteer });
  } catch (error) {
    console.error('Error updating volunteer:', error);
    return NextResponse.json(
      { error: 'Failed to update volunteer' },
      { status: 500 }
    );
  }
}
