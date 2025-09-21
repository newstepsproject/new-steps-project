import { NextResponse } from 'next/server';
import { getAppSettings } from '@/lib/settings';
import { SITE_CONFIG } from '@/constants/config';

export async function GET() {
  try {
    const settings = await getAppSettings();
    
    // Return only the settings that client-side components need
    const clientSettings = {
      maxShoesPerRequest: settings.maxShoesPerRequest,
      shippingFee: settings.shippingFee,
      projectEmail: settings.projectEmail,
      projectPhone: settings.projectPhone,
    };
    
    return NextResponse.json(clientSettings);
  } catch (error) {
    console.error('Error fetching client settings:', error);
    
    // Return default settings if database fails
    return NextResponse.json({
      maxShoesPerRequest: 2,
      shippingFee: 5,
      projectEmail: SITE_CONFIG.contactEmail,
      projectPhone: '',
    });
  }
}
