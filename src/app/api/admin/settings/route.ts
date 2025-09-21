import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { SettingsModel } from '@/models/settings';
import { SessionUser } from '@/types/user';
import { clearSettingsCache } from '@/lib/settings';
import { SITE_CONFIG } from '@/constants/config';

// Force dynamic to handle request-specific data
export const dynamic = 'force-dynamic';

// GET - Fetch current settings
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user is an admin
    const user = session.user as SessionUser;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    await connectToDatabase();

    // Fetch all settings
    const settingsRecords = await SettingsModel.find({});
    
    // Transform to key-value object, excluding null/undefined values
    const settings: Record<string, any> = {};
    settingsRecords.forEach(record => {
      // Only include non-null, non-undefined values
      if (record.value !== null && record.value !== undefined) {
        settings[record.key] = record.value;
      }
    });

    // Provide default values if settings don't exist
    const defaultSettings = {
      founderName: '',
      founderBio: '',
      officeAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
      },
      projectOfficers: [],
      ourStory: [],
      shippingFee: 5,
      paypalClientId: '',
      paypalSandboxMode: true,
      maxShoesPerRequest: 2,
      projectEmail: SITE_CONFIG.contactEmail,
      projectPhone: '',
      contactEmail: SITE_CONFIG.contactEmail,
      supportEmail: SITE_CONFIG.supportEmail,
      donationsEmail: SITE_CONFIG.donationsEmail,
    };

    // Merge with defaults (only non-null values from DB will override defaults)
    const finalSettings = { ...defaultSettings, ...settings };
    
    // Ensure projectOfficers always has default values if null/undefined
    if (!finalSettings.projectOfficers || finalSettings.projectOfficers === null) {
      finalSettings.projectOfficers = defaultSettings.projectOfficers;
    }

    return NextResponse.json({
      success: true,
      settings: finalSettings
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST - Save settings
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user is an admin
    const user = session.user as SessionUser;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    await connectToDatabase();

    // Parse request body
    const settingsData = await request.json();

    // Validate individual fields when present (support partial updates)
    // No required fields - allow partial updates

    // Validate office address (only if present)
    if (settingsData.officeAddress) {
      if (!settingsData.officeAddress.street || 
          !settingsData.officeAddress.city || 
          !settingsData.officeAddress.state || 
          !settingsData.officeAddress.zipCode || 
          !settingsData.officeAddress.country) {
        return NextResponse.json(
          { error: 'Office address must include street, city, state, zipCode, and country' },
          { status: 400 }
        );
      }
    }

    // Validate project officers (only if present)
    if (settingsData.projectOfficers) {
      if (!Array.isArray(settingsData.projectOfficers) || settingsData.projectOfficers.length === 0) {
        return NextResponse.json(
          { error: 'At least one project officer is required' },
          { status: 400 }
        );
      }

      for (let i = 0; i < settingsData.projectOfficers.length; i++) {
        const officer = settingsData.projectOfficers[i];
        
        // Check for required fields - accept either name or firstName/lastName
        const hasName = officer.name && officer.name.trim();
        const hasFirstLastName = officer.firstName && officer.firstName.trim() && 
                                officer.lastName && officer.lastName.trim();
        
        if (!officer.role || (!hasName && !hasFirstLastName) || !officer.duty || !officer.bio) {
          return NextResponse.json(
            { error: `Project officer ${i + 1} must have role, name (or firstName/lastName), duty, and bio` },
            { status: 400 }
          );
        }
        
        // Ensure name consistency
        if (hasFirstLastName && !hasName) {
          officer.name = `${officer.firstName} ${officer.lastName}`;
        } else if (hasName && !hasFirstLastName) {
          const nameParts = officer.name.trim().split(' ');
          if (nameParts.length >= 2) {
            officer.firstName = nameParts[0];
            officer.lastName = nameParts.slice(1).join(' ');
          } else {
            officer.firstName = officer.name;
            officer.lastName = '';
          }
        }
      }
    }

    // Validate shipping fee (only if present)
    if (settingsData.shippingFee !== undefined) {
      if (typeof settingsData.shippingFee !== 'number' || settingsData.shippingFee < 0) {
        return NextResponse.json(
          { error: 'Shipping fee must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    // Validate max shoes per request (only if present)
    if (settingsData.maxShoesPerRequest !== undefined) {
      if (typeof settingsData.maxShoesPerRequest !== 'number' || 
          settingsData.maxShoesPerRequest < 1) {
        return NextResponse.json(
          { error: 'Max shoes per request must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Save each setting
    const settingsToSave = Object.entries(settingsData);
    
    for (const [key, value] of settingsToSave) {
      await SettingsModel.findOneAndUpdate(
        { key },
        {
          key,
          value,
          lastUpdated: new Date(),
          updatedBy: user.id
        },
        { upsert: true, new: true }
      );
    }

    // Clear settings cache so changes are reflected immediately
    clearSettingsCache();

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    });

  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
} 
