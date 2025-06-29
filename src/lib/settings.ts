import connectToDatabase from '@/lib/db';
import { SettingsModel } from '@/models/settings';

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
  founderName: 'Walter Zhang',
  founderBio: '9th grade student, Doughty Valley High School, San Ramon, CA, and a soccer player in MLSNext 2010B, De Anza Force Soccer Club.',
  officeAddress: {
    street: '348 Cardona Cir',
    city: 'San Ramon',
    state: 'CA',
    zipCode: '94583',
    country: 'USA',
  },
  projectOfficers: [
    {
      id: 'founder-director',
      role: 'Founder & Director',
      name: 'Walter Zhang',
      duty: 'Providing visionary leadership, setting strategic direction, making key decisions, and ensuring the mission of connecting athletes with quality sports shoes remains at the heart of every initiative',
      bio: '9th grade student, Doughty Valley High School, San Ramon, CA, and a soccer player in MLSNext 2010B, De Anza Force Soccer Club.',
      photo: '',
      canRemove: false,
    },
    {
      id: 'operation-manager',
      role: 'Operation Manager',
      name: '',
      duty: 'Overseeing daily operations, managing inventory systems, coordinating donation logistics, processing shoe requests, and ensuring efficient workflows from donation intake to delivery',
      bio: '',
      photo: '',
      canRemove: true,
    },
    {
      id: 'volunteer-coordinator',
      role: 'Volunteer Coordinator',
      name: '',
      duty: 'Recruiting and training volunteers, organizing community events, building partnerships with schools and sports clubs, and coordinating volunteer activities to expand our reach',
      bio: '',
      photo: '',
      canRemove: true,
    },
  ],
  ourStory: [
    {
      id: 'timeline-1',
      title: 'The Beginning (2023)',
      description: 'New Steps was founded by Walter Zhang after noticing the large number of perfectly usable sports shoes being discarded while many student athletes couldn\'t afford the equipment they needed. What started as a small community initiative in San Ramon quickly grew into something bigger.',
      order: 1,
    },
    {
      id: 'timeline-2',
      title: 'Growing Our Impact (2024)',
      description: 'As word spread, more volunteers joined our cause, and we expanded our operations to serve the entire Bay Area. We partnered with local schools, sports clubs, and community organizations to reach more athletes in need. Our network of donors and recipients expanded dramatically.',
      order: 2,
    },
    {
      id: 'timeline-3',
      title: 'Today & Beyond (2025)',
      description: 'Today, New Steps continues to grow, with hundreds of shoes donated and matched with athletes across California. Our vision is to expand nationwide, creating a sustainable ecosystem of sports equipment sharing that benefits communities and the environment. We\'re constantly innovating our processes to make donating and receiving shoes as seamless as possible.',
      order: 3,
    },
  ],
  shippingFee: 5,
  maxShoesPerRequest: 2,
  projectEmail: 'newsteps.project@gmail.com',
  projectPhone: '(916) 582-7090',
  contactEmail: 'newsteps.project@gmail.com',
  supportEmail: 'newsteps.project@gmail.com',
  donationsEmail: 'newsteps.project@gmail.com',
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
let settingsCache: { data: AppSettings; expiry: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch application settings from the database
 * Returns cached settings if available and not expired
 */
export async function getAppSettings(): Promise<AppSettings> {
  // Return cached settings if valid
  if (settingsCache && Date.now() < settingsCache.expiry) {
    return settingsCache.data;
  }

  try {
    await connectToDatabase();
    
    // Fetch all settings from database
    const settingsRecords = await SettingsModel.find({}).lean();
    
    // Transform to key-value object
    const dbSettings: Record<string, any> = {};
    settingsRecords.forEach(record => {
      dbSettings[record.key] = record.value;
    });

    // Merge with defaults
    const settings: AppSettings = { ...defaultSettings, ...dbSettings };
    
    // Cache the settings
    settingsCache = {
      data: settings,
      expiry: Date.now() + CACHE_DURATION,
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
  settingsCache = null;
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