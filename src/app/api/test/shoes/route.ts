import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Shoe from '@/models/shoe';
import { ensureDbConnected } from '@/lib/db-utils';

// Test endpoint to add sample shoes without authentication
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await ensureDbConnected();
    
    const data = await request.json();
    console.log('Adding test shoe:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.brand || !data.modelName || !data.size || !data.color || !data.sport) {
      return NextResponse.json({ 
        error: 'Missing required fields: brand, modelName, size, color, sport' 
      }, { status: 400 });
    }

    // Generate SKU for the shoe
    const sku = `${data.brand.toUpperCase().replace(/\s+/g, '')}-${data.modelName.toUpperCase().replace(/\s+/g, '')}-${data.size.replace(/\s+/g, '')}-${Date.now()}`;

    // Create shoe using Mongoose model (shoeId will be auto-generated)
    const newShoe = new Shoe({
      sku: sku,
      brand: data.brand,
      modelName: data.modelName,
      gender: data.gender || 'unisex',
      size: data.size,
      color: data.color || '',
      sport: data.sport || '',
      condition: data.condition || 'good',
      description: data.description || '',
      features: data.features || [],
      images: data.images && data.images.length > 0 ? data.images : ['/images/placeholder-shoe.jpg'],
      status: data.status || 'available',
      inventoryCount: data.inventoryCount || 1,
      inventoryNotes: data.inventoryNotes || '',
      dateAdded: new Date(),
      lastUpdated: new Date()
    });
    
    const savedShoe = await newShoe.save();
    
    console.log('Test shoe saved with ID:', savedShoe.shoeId);
    
    return NextResponse.json({ 
      success: true, 
      shoe: savedShoe
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding test shoe:', error);
    return NextResponse.json(
      { error: 'Failed to add test shoe', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
