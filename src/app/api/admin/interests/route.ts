import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionUser } from '@/types/user';
import { ensureDbConnected } from '@/lib/db-utils';
import Interest, { InterestDocument } from '@/models/interest';
import type { FilterQuery } from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type') ?? 'partnership';
    const search = searchParams.get('search');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Number(limitParam ?? '250') || 250, 500);

    const query: FilterQuery<InterestDocument> = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { organizationName: regex },
        { subject: regex },
      ];
    }

    const interests = await Interest.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      interests,
    });
  } catch (error) {
    console.error('Error fetching interest submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partnership submissions' },
      { status: 500 }
    );
  }
}
