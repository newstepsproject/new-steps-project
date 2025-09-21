import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionUser } from '@/types/user';
import { ensureDbConnected } from '@/lib/db-utils';
import Interest, { InterestStatus, InterestDocument } from '@/models/interest';

const ALLOWED_STATUSES: InterestStatus[] = ['new', 'contacted', 'in_progress', 'closed'];

function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { interestId: string } }
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

    const interest: InterestDocument | null = await Interest.findOne({ interestId: params.interestId });

    if (!interest) {
      return NextResponse.json({ error: 'Interest submission not found' }, { status: 404 });
    }

    const body = await request.json();
    let hasUpdates = false;

    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      if (interest.status !== body.status) {
        interest.status = body.status;
        hasUpdates = true;
      }
    }

    const firstName = sanitizeString(body.firstName);
    if (body.firstName !== undefined && firstName !== interest.firstName) {
      interest.firstName = firstName;
      hasUpdates = true;
    }

    const lastName = sanitizeString(body.lastName);
    if (body.lastName !== undefined && lastName !== interest.lastName) {
      interest.lastName = lastName;
      hasUpdates = true;
    }

    const email = sanitizeString(body.email);
    if (body.email !== undefined && email && interest.email !== email) {
      interest.email = email;
      hasUpdates = true;
    }

    if (body.phone !== undefined) {
      const phone = sanitizeString(body.phone);
      if (interest.phone !== phone) {
        interest.phone = phone;
        hasUpdates = true;
      }
    }

    if (body.organizationName !== undefined) {
      const orgName = sanitizeString(body.organizationName);
      if (interest.organizationName !== orgName) {
        interest.organizationName = orgName;
        hasUpdates = true;
      }
    }

    if (body.organizationType !== undefined) {
      const orgType = sanitizeString(body.organizationType);
      if (interest.organizationType !== orgType) {
        interest.organizationType = orgType;
        hasUpdates = true;
      }
    }

    if (body.subject !== undefined) {
      const subject = sanitizeString(body.subject);
      if (interest.subject !== subject) {
        interest.subject = subject;
        hasUpdates = true;
      }
    }

    if (body.message !== undefined && typeof body.message === 'string') {
      if (interest.message !== body.message) {
        interest.message = body.message;
        hasUpdates = true;
      }
    }

    if (body.notes !== undefined) {
      const notes = typeof body.notes === 'string' ? body.notes : undefined;
      if (interest.notes !== notes) {
        interest.notes = notes;
        hasUpdates = true;
      }
    }

    // Update composite name if provided directly or derived from first/last name
    const explicitName = sanitizeString(body.name);
    if (explicitName && interest.name !== explicitName) {
      interest.name = explicitName;
      hasUpdates = true;
    } else if (firstName !== undefined || lastName !== undefined) {
      const derivedName = [interest.firstName, interest.lastName].filter(Boolean).join(' ');
      if (derivedName && interest.name !== derivedName) {
        interest.name = derivedName;
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return NextResponse.json({ success: true, interest });
    }

    await interest.save();

    return NextResponse.json({ success: true, interest });
  } catch (error) {
    console.error('Error updating interest submission:', error);
    return NextResponse.json(
      { error: 'Failed to update interest submission' },
      { status: 500 }
    );
  }
}
