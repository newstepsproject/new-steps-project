import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Shoe from '@/models/shoe';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const shoe = await Shoe.findById(params.id);
    
    if (!shoe) {
      return NextResponse.json({ error: 'Shoe not found' }, { status: 404 });
    }
    
    return NextResponse.json({ shoe });
  } catch (error) {
    console.error('Error fetching shoe:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shoe' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const data = await request.json();
    
    const shoe = await Shoe.findByIdAndUpdate(
      params.id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!shoe) {
      return NextResponse.json({ error: 'Shoe not found' }, { status: 404 });
    }
    
    return NextResponse.json({ shoe });
  } catch (error) {
    console.error('Error updating shoe:', error);
    return NextResponse.json(
      { error: 'Failed to update shoe' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const shoe = await Shoe.findByIdAndDelete(params.id);
    
    if (!shoe) {
      return NextResponse.json({ error: 'Shoe not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Shoe deleted successfully' });
  } catch (error) {
    console.error('Error deleting shoe:', error);
    return NextResponse.json(
      { error: 'Failed to delete shoe' },
      { status: 500 }
    );
  }
} 