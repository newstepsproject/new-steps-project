import connectToDatabase from '@/lib/db';
import { SettingsModel } from '@/models/settings';
import { SITE_CONFIG } from '@/constants/config';

export interface ProjectOfficer {
  id: string;
  role: string;
  name: string;
  duty: string;
  bio: string;
  photo?: string;
  canRemove: boolean;
}

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface SocialPlatforms {
  instagram: string;
  twitter: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
}

export interface AppSettings {
  founderName: string;
  founderBio: string;
  officeAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  projectOfficers: ProjectOfficer[];
  ourStory: TimelineItem[];
  shippingFee: number;
  maxShoesPerRequest: number;
  projectEmail: string;
  projectPhone: string;
  contactEmail: string;
  supportEmail: string;
  donationsEmail: string;
  paypalClientId: string;
  paypalSandboxMode: boolean;
  socialPlatforms: SocialPlatforms;
}

// Default settings fallback
const defaultSettings: AppSettings = {
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
  maxShoesPerRequest: 2,
  projectEmail: SITE_CONFIG.contactEmail,
  projectPhone: '',
  contactEmail: SITE_CONFIG.contactEmail,
  supportEmail: SITE_CONFIG.supportEmail,
  donationsEmail: SITE_CONFIG.donationsEmail,
  paypalClientId: '',
  paypalSandboxMode: true,
  socialPlatforms: {
    instagram: '',
    twitter: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    linkedin: '',
  },
};

// Cache settings for 5 minutes to avoid repeated database calls
let settingsCache: { data: AppSettings; expiry: number; lastCleared: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let lastCacheCleared = 0; // Global cache clear timestamp

/**
 * Fetch application settings from the database
 * Returns cached settings if available and not expired
 */
export async function getAppSettings(): Promise<AppSettings> {
  // Return cached settings if valid and not cleared
  if (settingsCache && 
      Date.now() < settingsCache.expiry && 
      settingsCache.lastCleared >= lastCacheCleared) {
    console.log('🔍 [CACHE] Returning cached settings');
    return settingsCache.data;
  }

  console.log('🔍 [CACHE] Fetching fresh settings from database');

  try {
    await connectToDatabase();
    
    // Fetch all settings from database
    const settingsRecords = await SettingsModel.find({}).lean();
    console.log('🔍 [DEBUG] Found settings records:', settingsRecords.length);
    
    // Transform to key-value object
    const dbSettings: Record<string, any> = {};
    settingsRecords.forEach(record => {
      console.log(`🔍 [DEBUG] Processing setting: ${record.key} = ${typeof record.value} (${Array.isArray(record.value) ? record.value.length + ' items' : 'single value'})`);
      dbSettings[record.key] = record.value;
    });

    console.log('🔍 [DEBUG] DB Settings keys:', Object.keys(dbSettings));
    console.log('🔍 [DEBUG] ourStory from DB:', dbSettings.ourStory?.length || 'undefined');

    // Merge with defaults
    const settings: AppSettings = { ...defaultSettings, ...dbSettings };
    console.log('🔍 [DEBUG] Final settings ourStory length:', settings.ourStory?.length || 'undefined');
    
    // Cache the settings
    settingsCache = {
      data: settings,
      expiry: Date.now() + CACHE_DURATION,
      lastCleared: Date.now(),
    };
    
    return settings;
  } catch (error) {
    console.error('Error fetching app settings:', error);
    
    // Return default settings on error
    return defaultSettings;
  }
}

/**
 * Get specific setting by key
 */
export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  const settings = await getAppSettings();
  return settings[key];
}

/**
 * Clear settings cache (useful after settings update)
 */
export function clearSettingsCache(): void {
  lastCacheCleared = Date.now();
  settingsCache = null;
  console.log('🔄 Settings cache cleared at:', new Date().toISOString());
}

/**
 * Get project officers with only those that have names filled
 */
export async function getActiveProjectOfficers(): Promise<ProjectOfficer[]> {
  const settings = await getAppSettings();
  return settings.projectOfficers.filter(officer => officer.name.trim() !== '');
}

/**
 * Get shipping fee for calculations
 */
export async function getShippingFee(): Promise<number> {
  const settings = await getAppSettings();
  return settings.shippingFee;
}

/**
 * Get maximum shoes per request
 */
export async function getMaxShoesPerRequest(): Promise<number> {
  const settings = await getAppSettings();
  return settings.maxShoesPerRequest;
}

/**
 * Get PayPal configuration
 */
export async function getPayPalConfig(): Promise<{ clientId: string; sandboxMode: boolean }> {
  const settings = await getAppSettings();
  return {
    clientId: settings.paypalClientId,
    sandboxMode: settings.paypalSandboxMode,
  };
}

/**
 * Get email addresses from settings
 */
export async function getEmailAddresses(): Promise<{
  projectEmail: string;
  contactEmail: string;
  supportEmail: string;
  donationsEmail: string;
}> {
  const settings = await getAppSettings();
  return {
    projectEmail: settings.projectEmail,
    contactEmail: settings.contactEmail,
    supportEmail: settings.supportEmail,
    donationsEmail: settings.donationsEmail,
  };
}

/**
 * Get specific email address by type
 */
export async function getEmailAddress(type: 'project' | 'contact' | 'support' | 'donations'): Promise<string> {
  const settings = await getAppSettings();
  switch (type) {
    case 'project':
      return settings.projectEmail;
    case 'contact':
      return settings.contactEmail;
    case 'support':
      return settings.supportEmail;
    case 'donations':
      return settings.donationsEmail;
    default:
      return settings.projectEmail;
  }
}

/**
 * Get Our Story timeline items sorted by order
 */
export async function getOurStoryTimeline(): Promise<TimelineItem[]> {
  const settings = await getAppSettings();
  return settings.ourStory.sort((a, b) => a.order - b.order);
}

/**
 * Get social platform URLs
 */
export async function getSocialPlatforms(): Promise<SocialPlatforms> {
  const settings = await getAppSettings();
  return settings.socialPlatforms;
}

/**
 * Get active social platforms (only those with URLs)
 */
export async function getActiveSocialPlatforms(): Promise<Array<{platform: keyof SocialPlatforms, url: string}>> {
  const socialPlatforms = await getSocialPlatforms();
  return Object.entries(socialPlatforms)
    .filter(([, url]) => url.trim() !== '')
    .map(([platform, url]) => ({ platform: platform as keyof SocialPlatforms, url }));
}
