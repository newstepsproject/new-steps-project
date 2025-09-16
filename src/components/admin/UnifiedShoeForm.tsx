'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Camera, X, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SHOE_BRANDS, SHOE_GENDERS, SHOE_SPORTS, SHOE_CONDITIONS, SHOE_STATUSES } from '@/constants/shoes';
import { createCompressedDataURL, formatFileSize } from '@/lib/image-utils';

// Donor information schema
const donorInfoSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Invalid email' }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

// Form schema
const formSchema = z.object({
  donorInfo: z.object({
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
  isOffline: z.boolean().default(true),
  donationReference: z.string().optional(),
  notes: z.string().optional(),
  brand: z.string().min(1, { message: 'Brand is required' }),
  modelName: z.string().min(1, { message: 'Model name is required' }),
  gender: z.string().min(1, { message: 'Gender is required' }),
  size: z.string().min(1, { message: 'Size is required' }),
  color: z.string().min(1, { message: 'Color is required' }),
  sport: z.string().min(1, { message: 'Sport is required' }),
  condition: z.string().min(1, { message: 'Condition is required' }),
  description: z.string().optional(),
  inventoryCount: z.coerce.number().int().positive().default(1),
  inventoryNotes: z.string().optional(),
  status: z.string().default(SHOE_STATUSES.AVAILABLE),
}).refine(data => {
  // For online donations, we need reference number
  if (!data.isOffline && !data.donationReference) {
    return false;
  }
  return true;
}, {
  message: "Donation reference number is required for online donations",
  path: ["donationReference"]
}).refine(data => {
  // For online donations, we need email
  if (!data.isOffline && !data.donorInfo.email) {
    return false;
  }
  // For all donations, firstName and lastName are required
  return !!data.donorInfo.firstName && !!data.donorInfo.lastName;
}, {
  message: "Online donations require donor name and email",
  path: ["donorInfo", "email"]
});

// Props for the unified form
interface UnifiedShoeFormProps {
  onSubmit: (data: any, submittedShoes: any[]) => Promise<any>;
}

export function UnifiedShoeForm({ onSubmit }: UnifiedShoeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedShoes, setSubmittedShoes] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Sort sports and brands alphabetically
  const sortedSports = [...SHOE_SPORTS].sort((a, b) => a.localeCompare(b));
  const sortedBrands = [...SHOE_BRANDS].sort((a, b) => a.localeCompare(b));
  
  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      donorInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      },
      isOffline: true,
      donationReference: '',
      notes: '',
      brand: '',
      modelName: '',
      gender: 'unisex',
      size: '',
      color: '',
      sport: '',
      condition: 'like_new',
      description: '',
      inventoryCount: 1,
      inventoryNotes: '',
      status: SHOE_STATUSES.AVAILABLE,
    },
  });

  // Handle image file selection with mobile compression
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);

    try {
      const newFiles: File[] = [];
      const newUrls: string[] = [];
      let totalOriginalSize = 0;
      let totalCompressedSize = 0;

      for (const file of files) {
        totalOriginalSize += file.size;
        
        // Use mobile compression for admin uploads
        const compressedDataURL = await createCompressedDataURL(file, true);
        newUrls.push(compressedDataURL);
        
        // Convert compressed data URL back to File for upload
        const response = await fetch(compressedDataURL);
        const blob = await response.blob();
        const compressedFile = new File([blob], file.name, { type: file.type });
        newFiles.push(compressedFile);
        
        totalCompressedSize += compressedFile.size;
      }

      setImageFiles([...imageFiles, ...newFiles]);
      setImageUrls([...imageUrls, ...newUrls]);

      // Show compression feedback
      if (files.length > 0) {
        const compressionRatio = Math.round((1 - totalCompressedSize / totalOriginalSize) * 100);
        toast({
          title: "Images processed successfully",
          description: `${files.length} image(s) processed. Compressed by ~${compressionRatio}% (${formatFileSize(totalOriginalSize)} → ${formatFileSize(totalCompressedSize)})`,
        });
      }
    } catch (error) {
      console.error('Error processing images:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to process images. Please try again.",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove image
  const removeImage = (imageIndex: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== imageIndex));
    setImageUrls(imageUrls.filter((_, i) => i !== imageIndex));
  };

  // Lookup donation by reference
  const fetchDonationByReference = async (reference: string) => {
    if (!reference) return;
    
    try {
      const response = await fetch(`/api/admin/shoe-donations/reference/${reference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases for processed or cancelled donations
        if (data.status === 'processed') {
          toast({
            title: "Already Processed",
            description: "This donation has already been processed and added to inventory.",
            variant: "destructive",
          });
          return;
        }
        
        if (data.status === 'cancelled') {
          toast({
            title: "Donation Cancelled",
            description: "This donation has been cancelled and cannot be processed.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(data.error || 'Failed to fetch donation');
      }
      
      if (data.donation) {
        // Update donor info fields with the found donation
        const donorInfo = data.donation.donorInfo;
        if (donorInfo) {
          // Handle both old (name) and new (firstName/lastName) formats
          if (donorInfo.firstName && donorInfo.lastName) {
            form.setValue('donorInfo.firstName', donorInfo.firstName);
            form.setValue('donorInfo.lastName', donorInfo.lastName);
          } else if (donorInfo.name) {
            // Split single name into first and last name
            const nameParts = donorInfo.name.split(' ');
            form.setValue('donorInfo.firstName', nameParts[0] || '');
            form.setValue('donorInfo.lastName', nameParts.slice(1).join(' ') || '');
          }
          form.setValue('donorInfo.email', donorInfo.email || '');
          form.setValue('donorInfo.phone', donorInfo.phone || '');
        }
        
        // Format processing status for toast message
        const totalShoes = data.donation.numberOfShoes || 0;
        const processedShoes = data.donation.processedShoes || 0;
        const remainingShoes = Math.max(0, totalShoes - processedShoes);
        
        let statusMessage = '';
        if (remainingShoes > 0) {
          statusMessage = `${processedShoes}/${totalShoes} shoes processed. ${remainingShoes} remaining to process.`;
        } else if (totalShoes === 0) {
          statusMessage = 'No shoes information available.';
        } else {
          statusMessage = 'All shoes have been processed.';
        }
        
        toast({
          title: "Donation found",
          description: `Found donation with reference: ${reference}. ${statusMessage}`,
        });
      } else {
        toast({
          title: "Donation not found",
          description: `No donation found with reference: ${reference}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching donation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch donation",
        variant: "destructive",
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setShowResults(false);
    
    try {
      // Upload images for this shoe
      const shoeImages: string[] = [];
      
      if (imageFiles && imageFiles.length > 0) {
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload image`);
          }
          
          const uploadResult = await uploadResponse.json();
          shoeImages.push(uploadResult.url);
        }
      }
      
      // Create a single shoe object
      const shoe = {
        brand: data.brand,
        modelName: data.modelName,
        gender: data.gender,
        size: data.size,
        color: data.color,
        sport: data.sport,
        condition: data.condition,
        quantity: data.inventoryCount,
        notes: data.description || '',
        images: shoeImages,
        status: data.status
      };
      
      // Prepare data for API
      const formData = {
        donorInfo: data.donorInfo,
        shoes: [shoe], // Create an array with a single shoe
        isOffline: data.isOffline,
        donationReference: data.donationReference,
        notes: data.notes,
        description: data.description,
        inventoryNotes: data.inventoryNotes
      };
      
      // Call parent onSubmit and get the response
      const result = await onSubmit(formData, submittedShoes);
      
      // Store the returned shoes from the API
      if (result && result.shoes && Array.isArray(result.shoes)) {
        setSubmittedShoes(result.shoes);
        console.log('Successfully added shoes:', result.shoes.length);
      } else {
        console.warn('No shoes returned in the result:', result);
        // If no shoes returned, use an empty array
        setSubmittedShoes([]);
      }
      
      setShowResults(true);
      
      // Don't reset form immediately to allow admin to see the results
      toast({
        title: "Success",
        description: `Shoe added successfully to inventory and donation record created`,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save. Please try again.",
        variant: "destructive",
      });
      setShowResults(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form for new entry
  const handleNewEntry = () => {
    form.reset({
      donorInfo: { firstName: '', lastName: '', email: '', phone: '' },
      isOffline: true,
      donationReference: '',
      notes: '',
      brand: '',
      modelName: '',
      gender: 'unisex',
      size: '',
      color: '',
      sport: '',
      condition: 'like_new',
      description: '',
      inventoryCount: 1,
      inventoryNotes: '',
      status: SHOE_STATUSES.AVAILABLE,
    });
    setImageFiles([]);
    setImageUrls([]);
    setShowResults(false);
  };

  return (
    <>
      {showResults ? (
        <Card>
          <CardHeader>
            <CardTitle>Shoe Added Successfully</CardTitle>
            <CardDescription>
              This shoe has been added to inventory and a donation record has been created
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Shoe Inventory IDs</h3>
              <p className="text-sm text-gray-500 mb-4">
                Write down these IDs on paper tags to attach to the physical shoes
              </p>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submittedShoes.map((shoe, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap font-bold">{shoe.shoeId || shoe.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{shoe.brand}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{shoe.modelName || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{shoe.size}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{shoe.status === 'available' ? 'Available' : shoe.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button onClick={handleNewEntry} className="w-full h-12 text-base">Add More Shoes</Button>
          </CardFooter>
        </Card>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-20 md:pb-6">
            {/* Donor Information */}
            <Card>
              <CardHeader>
                <CardTitle>Donor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Donation Source Selection */}
                <div className="mb-6 border rounded-md p-4 bg-gray-50">
                  <h3 className="text-sm font-medium mb-4">Donation Source</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isOffline"
                      render={({ field }) => (
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="offline-donation"
                              checked={field.value}
                              onChange={() => {
                                field.onChange(true);
                                form.setValue('donationReference', '');
                              }}
                              className="h-5 w-5 text-blue-600"
                            />
                            <Label htmlFor="offline-donation" className="text-sm font-medium cursor-pointer">
                              Offline Donation
                            </Label>
                          </div>
                          <p className="text-xs text-gray-500 ml-6">
                            Direct donation made in person or by mail
                          </p>
                        </div>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isOffline"
                      render={({ field }) => (
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="online-donation"
                              checked={!field.value}
                              onChange={() => field.onChange(false)}
                              className="h-5 w-5 text-blue-600"
                            />
                            <Label htmlFor="online-donation" className="text-sm font-medium cursor-pointer">
                              Online Donation
                            </Label>
                          </div>
                          <p className="text-xs text-gray-500 ml-6">
                            Donation made through the website with a reference number
                          </p>
                        </div>
                      )}
                    />
                  </div>
                </div>
                
                {/* Reference Number (for online donations) */}
                {!form.watch('isOffline') && (
                  <div className="mb-6">
                    <FormField
                      control={form.control}
                      name="donationReference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Donation Reference Number <span className="text-red-500">*</span>
                          </FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter donation reference number (e.g., DS-ABCD-1234)"
                                onChange={field.onChange}
                                className="h-12"
                              />
                            </FormControl>
                            <Button 
                              type="button"
                              variant="outline"
                              onClick={() => fetchDonationByReference(field.value)}
                              className="h-12 px-4"
                            >
                              Look Up
                            </Button>
                          </div>
                          <FormDescription>
                            Enter the reference number to retrieve the donation information
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="donorInfo.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          First Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter first name" className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="donorInfo.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Last Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter last name" className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="donorInfo.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Donor Email {!form.watch('isOffline') && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="donor@example.com" type="email" className="h-12" />
                        </FormControl>
                        <FormDescription>
                          {form.watch('isOffline') 
                            ? 'Optional for offline donations' 
                            : 'Required for online donations'
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="donorInfo.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Donor Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(123) 456-7890" type="tel" className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Shoe Information */}
            <Card>
              <CardHeader>
                <CardTitle>Shoe Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image section */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2">Shoe Images</h4>
                  
                  {/* Image Preview */}
                  {imageUrls.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {imageUrls.map((url, imgIndex) => (
                          <div key={`img-${imgIndex}`} className="relative aspect-square rounded-md overflow-hidden border">
                            <img 
                              src={url} 
                              alt={`Shoe Image ${imgIndex + 1}`} 
                              className="object-cover w-full h-full"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(imgIndex)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div>
                    <div className="flex items-center space-x-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label
                          htmlFor="picture"
                          className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-md cursor-pointer hover:border-gray-400"
                        >
                          <div className="flex flex-col items-center">
                            <Upload className="h-6 w-6 text-gray-400 mb-1" />
                            <span className="text-sm text-gray-500">
                              {uploadingImages ? 'Processing...' : 'Upload Images'}
                            </span>
                            {uploadingImages && (
                              <div className="mt-1">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                              </div>
                            )}
                          </div>
                          <input
                            id="picture"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </Label>
                      </div>
                      <div className="w-full max-w-[200px]">
                        <Label
                          htmlFor="camera"
                          className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-md cursor-pointer hover:border-gray-400"
                        >
                          <div className="flex flex-col items-center">
                            <Camera className="h-6 w-6 text-gray-400 mb-1" />
                            <span className="text-sm text-gray-500">
                              {uploadingImages ? 'Processing...' : 'Take Photo'}
                            </span>
                            {uploadingImages && (
                              <div className="mt-1">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                              </div>
                            )}
                          </div>
                          <input
                            id="camera"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sortedBrands.map(brand => (
                              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="modelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Air Max 90" className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SHOE_GENDERS.map(gender => (
                              <SelectItem key={gender.toLowerCase()} value={gender.toLowerCase()}>
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 10.5" className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Black/White" className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sortedSports.map(sport => (
                              <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(SHOE_CONDITIONS).map(([key, condition]) => (
                              <SelectItem key={key} value={condition}>
                                {condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter description for this shoe"
                          className="resize-y min-h-[100px] h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Inventory Information */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="inventoryCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory Count</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            step="1" 
                            className="h-12"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select inventory status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(SHOE_STATUSES).map(([key, status]) => (
                              <SelectItem key={key} value={status}>
                                {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="inventoryNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter internal notes about this inventory item"
                          className="resize-y min-h-[140px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-3 pb-16 md:pb-0">
              <Button variant="outline" type="button" onClick={() => form.reset()} className="h-12 px-6">
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-12 px-6">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </>
  );
} 