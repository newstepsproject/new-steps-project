import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { error, errorInfo, url } = await request.json();
    
    // Log to server console
    console.error('[CLIENT ERROR]', {
      error,
      errorInfo,
      url,
      timestamp: new Date().toISOString()
    });
    
    // You could also save to a database or external logging service here
    
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[ERROR ENDPOINT]', err);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}