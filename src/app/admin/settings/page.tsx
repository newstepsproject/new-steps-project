'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Settings, User, MapPin, DollarSign, CreditCard, Plus, X, BookOpen, Globe, Package, Camera, Upload, Instagram, Twitter, Facebook, Youtube, Linkedin } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SITE_CONFIG } from '@/constants/config';

// Settings schema
const settingsSchema = z.object({
  // Project office address
  officeAddress: z.object({
    street: z.string().min(1, { message: 'Street address is required' }),
    city: z.string().min(1, { message: 'City is required' }),
    state: z.string().min(1, { message: 'State is required' }),
    zipCode: z.string().min(1, { message: 'ZIP code is required' }),
    country: z.string().min(1, { message: 'Country is required' }),
  }),
  
  // Project officers (dynamic) - includes founder/director
  // Only founder/director is required, others can be removed
  projectOfficers: z.array(z.object({
    id: z.string().optional(),
    role: z.string().min(1, { message: 'Role is required' }),
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
    name: z.string().optional(), // Keep for backward compatibility
    duty: z.string().min(1, { message: 'Brief duty is required' }),
    bio: z.string().min(1, { message: 'Bio is required' }),
    photo: z.string().optional(),
    canRemove: z.boolean(),
  })).refine(
    (officers) => officers.some(officer => !officer.canRemove), 
    { message: 'At least one primary officer must remain on the team list' }
  ),
  
  // Our Story timeline
  ourStory: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1, { message: 'Timeline title is required' }),
    description: z.string().min(1, { message: 'Timeline description is required' }),
    order: z.number(),
  })).min(1, { message: 'At least one timeline item is required' }),
  
  // System settings
  shippingFee: z.coerce.number().min(0, { message: 'Shipping fee must be 0 or greater' }),
  maxShoesPerRequest: z.coerce.number().int().min(1, { message: 'Max shoes per request must be at least 1' }).default(2),
  projectEmail: z.string().email({ message: 'Invalid email address' }).optional(),
  projectPhone: z.string().optional(),
  contactEmail: z.string().email({ message: 'Invalid email address' }).optional(),
  supportEmail: z.string().email({ message: 'Invalid email address' }).optional(),
  donationsEmail: z.string().email({ message: 'Invalid email address' }).optional(),
  
  // Third-party services
  paypalClientId: z.string().optional(),
  paypalSandboxMode: z.boolean().default(true),
  
  // Social platforms
  socialPlatforms: z.object({
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
    linkedin: z.string().optional(),
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Helper functions for managing project officers
  const addProjectOfficer = () => {
    const currentOfficers = form.getValues('projectOfficers');
    form.setValue('projectOfficers', [
      ...currentOfficers,
      {
        id: `officer-${Date.now()}`,
        role: '',
        firstName: '',
        lastName: '',
        name: '', // Keep for backward compatibility
        duty: '',
        bio: '',
        photo: '',
        canRemove: true,
      },
    ]);
  };

  const removeProjectOfficer = (index: number) => {
    const currentOfficers = form.getValues('projectOfficers');
    const officer = currentOfficers[index];
    if (currentOfficers.length > 1 && officer.canRemove) {
      form.setValue('projectOfficers', currentOfficers.filter((_, i) => i !== index));
    }
  };

  // Helper functions for managing Our Story timeline
  const addTimelineItem = () => {
    const currentItems = form.getValues('ourStory');
    const nextOrder = currentItems.length > 0 ? Math.max(...currentItems.map(item => item.order || 0)) + 1 : 1;
    form.setValue('ourStory', [
      ...currentItems,
      {
        id: `timeline-${Date.now()}`,
        title: '',
        description: '',
        order: nextOrder,
      },
    ]);
  };

  const removeTimelineItem = (index: number) => {
    const currentItems = form.getValues('ourStory');
    if (currentItems.length > 1) {
      form.setValue('ourStory', currentItems.filter((_, i) => i !== index));
    }
  };

  // Individual save functions for each section
  const saveSection = async (sectionName: string, sectionData: any) => {
    setSavingSection(sectionName);
    
    try {
      console.log(`Saving ${sectionName}:`, sectionData);
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(sectionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
      
      toast({
        title: "Settings saved",
        description: `${sectionName} settings have been updated successfully.`,
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: "Error",
        description: `Failed to save ${sectionName} settings: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setSavingSection(null);
    }
  };

  // Section-specific save handlers
  const saveGeneralSettings = () => {
    const generalData = {
      officeAddress: form.getValues('officeAddress'),
      projectEmail: form.getValues('projectEmail'),
      projectPhone: form.getValues('projectPhone'),
      contactEmail: form.getValues('contactEmail'),
      supportEmail: form.getValues('supportEmail'),
      donationsEmail: form.getValues('donationsEmail'),
    };
    saveSection('General Settings', generalData);
  };

  const saveProjectOfficers = () => {
    const officersData = {
      projectOfficers: form.getValues('projectOfficers'),
    };
    saveSection('Project Officers', officersData);
  };

  const saveOurStory = () => {
    const storyData = {
      ourStory: form.getValues('ourStory'),
    };
    saveSection('Our Story', storyData);
  };

  const saveSystemSettings = () => {
    const systemData = {
      shippingFee: Number(form.getValues('shippingFee')),
      maxShoesPerRequest: Number(form.getValues('maxShoesPerRequest')),
      paypalClientId: form.getValues('paypalClientId'),
      paypalSandboxMode: form.getValues('paypalSandboxMode'),
    };
    console.log('System data being saved:', systemData);
    saveSection('System Settings', systemData);
  };

  const saveSocialPlatforms = () => {
    const socialData = {
      socialPlatforms: form.getValues('socialPlatforms'),
    };
    saveSection('Social Platforms', socialData);
  };

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      officeAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
      },
      projectOfficers: [
        {
          id: 'primary-officer',
          role: 'Primary Officer',
          firstName: '',
          lastName: '',
          name: '',
          duty: '',
          bio: '',
          photo: '',
          canRemove: false,
        },
      ],
      ourStory: [
        {
          id: 'timeline-1',
          title: '',
          description: '',
          order: 1,
        },
      ],
      shippingFee: 5,
      paypalClientId: '',
      paypalSandboxMode: true,
      maxShoesPerRequest: 2,
      projectEmail: SITE_CONFIG.contactEmail,
      projectPhone: '',
      contactEmail: SITE_CONFIG.contactEmail,
      supportEmail: SITE_CONFIG.supportEmail,
      donationsEmail: SITE_CONFIG.donationsEmail,
      socialPlatforms: {
        instagram: '',
        twitter: '',
        facebook: '',
        tiktok: '',
        youtube: '',
        linkedin: '',
      },
    },
  });

  // Fetch current settings
  const fetchSettings = async () => {
    if (sessionStatus !== 'authenticated') {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`Error fetching settings: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched settings:', data.settings);
      
      // Transform settings from key-value format to form format
      const formData: Partial<SettingsFormData> = {};
      
      Object.entries(data.settings).forEach(([key, value]) => {
        // Only include non-null, non-undefined values
        if (value !== null && value !== undefined) {
          if (key === 'officeAddress') {
            formData.officeAddress = value as any;
          } else if (key !== 'founderName' && key !== 'founderBio') {
            // Skip deprecated founder fields
            (formData as any)[key] = value;
          }
        }
      });
      
      // Merge with default values instead of replacing them
      const currentValues = form.getValues();
      const mergedData = {
        ...currentValues, // Keep default values
        ...formData,      // Only override with non-null API data
      };
      
      console.log('Merged form data:', mergedData);
      
      // Reset form with merged data
      form.reset(mergedData as SettingsFormData);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Photo upload handler with mobile compression
  const handlePhotoUpload = async (officerIndex: number, file: File | null) => {
    if (!file) return;

    try {
      // Import compression utilities
      const { processImageForUpload, formatFileSize } = await import('@/lib/image-utils');
      
      // Process image with mobile compression
      const processed = await processImageForUpload(file, true);
      
      if (!processed.valid) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: processed.error || 'Invalid image file',
        });
        return;
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append('photo', processed.file);

      // Upload compressed file to server
      const response = await fetch('/api/upload/team-photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update form with uploaded filename
        const currentOfficers = form.getValues('projectOfficers');
        currentOfficers[officerIndex].photo = result.fileName;
        form.setValue('projectOfficers', currentOfficers);
        
        // Show compression feedback
        const compressionRatio = Math.round((1 - processed.compressedSize / processed.originalSize) * 100);
        toast({
          title: "Photo uploaded successfully",
          description: `Photo uploaded for ${currentOfficers[officerIndex].role}. Compressed by ${compressionRatio}% (${formatFileSize(processed.originalSize)} → ${formatFileSize(processed.compressedSize)})`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: result.error || 'Failed to upload photo',
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: 'Failed to upload photo. Please try again.',
      });
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchSettings();
    }
  }, [sessionStatus]);

  // Show loading while checking authentication
  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Project Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure project information and system settings.
          </p>
        </div>
      </div>

      <Form {...form}>
        <div className="w-full max-w-none overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
            <TabsList className="grid w-full grid-cols-5 sticky top-0 z-10 bg-white border shadow-sm max-w-full">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Team</span>
              </TabsTrigger>
              <TabsTrigger value="story" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Story</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6 min-h-[600px] w-full max-w-none">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Project Office Address
                </CardTitle>
                <CardDescription>
                  Official address for donations and shipping.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="officeAddress.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter street address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="officeAddress.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="officeAddress.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="officeAddress.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter ZIP code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="officeAddress.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="projectEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Enter project email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="projectPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Phone</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" placeholder="Enter project phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Enter contact email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="supportEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Enter support email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="donationsEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Donations Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Enter donations email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-6 border-t">
                  <Button
                    type="button"
                    onClick={saveGeneralSettings}
                    disabled={savingSection === 'General Settings'}
                    className="w-full sm:w-auto"
                  >
                    {savingSection === 'General Settings' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save General Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Settings Tab */}
          <TabsContent value="team" className="space-y-6 min-h-[600px] w-full max-w-none">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Project Officers
                </CardTitle>
                <CardDescription>
                  Manage all project officers including founder/director and their information displayed on the About page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {form.watch('projectOfficers')?.map((officer, index) => (
                  <div key={officer.id || index} className="space-y-4 p-4 border rounded-lg relative">
                    {form.watch('projectOfficers').length > 1 && officer.canRemove && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeProjectOfficer(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <h3 className="text-lg font-medium">
                      {officer.role || `Officer #${index + 1}`}
                      {!officer.canRemove && <span className="text-xs text-gray-500 ml-2">(Required)</span>}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`projectOfficers.${index}.role`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Founder & Director" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`projectOfficers.${index}.firstName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter first name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`projectOfficers.${index}.lastName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter last name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`projectOfficers.${index}.duty`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brief Duty</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Brief description of duties and responsibilities"
                              className="min-h-[60px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`projectOfficers.${index}.bio`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Personal biography and background information"
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`projectOfficers.${index}.photo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Photo</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-4">
                              {/* Hidden file inputs */}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(index, e.target.files?.[0] || null)}
                                className="hidden"
                                id={`photo-upload-${index}`}
                              />
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handlePhotoUpload(index, e.target.files?.[0] || null)}
                                className="hidden"
                                id={`photo-camera-${index}`}
                              />
                              
                              {/* Two separate buttons */}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById(`photo-upload-${index}`)?.click()}
                                className="flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                Upload File
                              </Button>
                              
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById(`photo-camera-${index}`)?.click()}
                                className="flex items-center gap-2"
                              >
                                <Camera className="h-4 w-4" />
                                Take Photo
                              </Button>
                              
                              {field.value && (
                                <span className="text-sm text-green-600">✓ Uploaded: {field.value}</span>
                              )}
                            </div>
                          </FormControl>
                          <p className="text-xs text-gray-500">Upload a clear headshot photo (JPG, PNG)</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addProjectOfficer}
                    className="w-full sm:flex-1"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Officer
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={saveProjectOfficers}
                    disabled={savingSection === 'Project Officers'}
                    className="w-full sm:flex-1"
                  >
                    {savingSection === 'Project Officers' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Project Officers
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Our Story Tab */}
          <TabsContent value="story" className="space-y-6 min-h-[600px] w-full max-w-none">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Our Story Timeline
                </CardTitle>
                <CardDescription>
                  Configure the timeline shown in the "Our Story" section on the About page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {form.watch('ourStory')?.map((item, index) => (
                  <div key={item.id || index} className="space-y-4 p-4 border rounded-lg relative">
                    {form.watch('ourStory').length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeTimelineItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <h3 className="text-lg font-medium">
                      Timeline Item #{index + 1}
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name={`ourStory.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., The Beginning (2023)" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`ourStory.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe this milestone in your project's story..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTimelineItem}
                    className="w-full sm:flex-1"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Timeline Item
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={saveOurStory}
                    disabled={savingSection === 'Our Story'}
                    className="w-full sm:flex-1"
                  >
                    {savingSection === 'Our Story' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Our Story
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6 min-h-[600px] w-full max-w-none">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure system behavior and limits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shippingFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Fee ($)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter shipping fee"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxShoesPerRequest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Shoes Per Request</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            placeholder="Enter max shoes per request"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Settings
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="paypalClientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PayPal Client ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter PayPal client ID" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paypalSandboxMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            PayPal Sandbox Mode
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enable for testing, disable for production
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end pt-6 border-t">
                  <Button
                    type="button"
                    onClick={saveSystemSettings}
                    disabled={savingSection === 'System Settings'}
                    className="w-full sm:w-auto"
                  >
                    {savingSection === 'System Settings' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save System Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Platforms Tab */}
          <TabsContent value="social" className="space-y-6 min-h-[600px] w-full max-w-none">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5" />
                  Social Media Platforms
                </CardTitle>
                <CardDescription>
                  Configure social media links for the homepage and footer. Popular platforms for young generations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="socialPlatforms.instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          Instagram URL
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://instagram.com/newstepsproject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="socialPlatforms.tiktok"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          TikTok URL
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://tiktok.com/@newstepsproject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="socialPlatforms.twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Twitter className="h-4 w-4" />
                          X (Twitter) URL
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://x.com/newstepsproject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="socialPlatforms.youtube"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Youtube className="h-4 w-4" />
                          YouTube URL
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://youtube.com/@newstepsproject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="socialPlatforms.facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Facebook className="h-4 w-4" />
                          Facebook URL
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://facebook.com/newstepsproject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="socialPlatforms.linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4" />
                          LinkedIn URL
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://linkedin.com/company/newstepsproject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end pt-6 border-t">
                  <Button
                    type="button"
                    onClick={saveSocialPlatforms}
                    disabled={savingSection === 'Social Platforms'}
                    className="w-full sm:w-auto"
                  >
                    {savingSection === 'Social Platforms' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Social Platforms
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>
      </Form>
    </div>
  );
}
