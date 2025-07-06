'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  SHOE_BRANDS, 
  SHOE_GENDERS, 
  SHOE_SPORTS, 
  SHOE_STATUSES, 
  SHOE_CONDITIONS 
} from '@/constants/config';
import { ArrowLeft, Save, Upload, X, Camera } from 'lucide-react';
import { createCompressedDataURL, formatFileSize } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

// Form schema for shoe editing
const shoeSchema = z.object({
  id: z.string(),
  sku: z.string().min(1, { message: 'SKU is required' }),
  brand: z.string().min(1, { message: 'Brand is required' }),
  modelName: z.string().min(1, { message: 'Model name is required' }),
  gender: z.enum(['men', 'women', 'unisex', 'boys', 'girls']),
  size: z.string().min(1, { message: 'Size is required' }),
  color: z.string().min(1, { message: 'Color is required' }),
  sport: z.string().min(1, { message: 'Sport is required' }),
  condition: z.enum(['like_new', 'good', 'fair']),
  description: z.string().optional(),
  status: z.enum(Object.values(SHOE_STATUSES) as [string, ...string[]]),
  inventoryCount: z
    .number()
    .min(0, { message: 'Inventory count must be at least 0' })
    .int({ message: 'Inventory count must be a whole number' }),
  inventoryNotes: z.string().optional(),
  // Donor information
  donorFirstName: z.string().optional(),
  donorLastName: z.string().optional(),
  donorEmail: z.string().email({ message: 'Invalid email format' }).optional().or(z.literal('')),
  donorPhone: z.string().optional().or(z.literal('')),
  isOffline: z.boolean().optional().default(true)
});

export default function EditShoePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [fromDonation, setFromDonation] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Setup form
  const form = useForm<z.infer<typeof shoeSchema>>({
    resolver: zodResolver(shoeSchema) as any,
    defaultValues: {
      id: params.id,
      sku: '',
      brand: '',
      modelName: '',
      gender: 'unisex',
      size: '',
      color: '',
      sport: '',
      condition: 'good',
      description: '',
      status: SHOE_STATUSES.AVAILABLE,
      inventoryCount: 1,
      inventoryNotes: '',
      donorFirstName: '',
      donorLastName: '',
      donorEmail: '',
      donorPhone: '',
      isOffline: true
    },
  });

  // Sort sports and brands alphabetically
  const sortedSports = [...SHOE_SPORTS].sort((a, b) => a.localeCompare(b));
  const sortedBrands = [...SHOE_BRANDS].sort((a, b) => a.localeCompare(b));

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

      setImageFiles(prev => [...prev, ...newFiles]);
      setImageUrls(prev => [...prev, ...newUrls]);

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

  // Remove new image
  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Remove existing image
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Fetch shoe data
  useEffect(() => {
    const fetchShoe = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/shoes/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch shoe data');
        }
        
        const data = await response.json();
        const shoe = data.shoe;
        
        // Set existing images
        setExistingImages(shoe.images || []);
        
        // Check if from donation
        setFromDonation(!!shoe.donationId);
        
        // Reset form with fetched data
        form.reset({
          id: params.id,
          sku: shoe.sku,
          brand: shoe.brand,
          modelName: shoe.modelName,
          gender: shoe.gender,
          size: shoe.size,
          color: shoe.color,
          sport: shoe.sport,
          condition: shoe.condition,
          description: shoe.description || '',
          status: shoe.status,
          inventoryCount: shoe.inventoryCount,
          inventoryNotes: shoe.inventoryNotes || '',
          donorFirstName: shoe.donorFirstName || '',
          donorLastName: shoe.donorLastName || '',
          donorEmail: shoe.donorEmail || '',
          donorPhone: shoe.donorPhone || '',
          isOffline: shoe.isOffline !== false
        });
      } catch (error) {
        console.error('Error fetching shoe:', error);
        setError('Failed to load shoe data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchShoe();
  }, [params.id, form]);

  // Handle form submission
  const onSubmit = async (formData: z.infer<typeof shoeSchema>) => {
    try {
      setSaving(true);
      
      // Upload any new images first
      const uploadedImageUrls: string[] = [];
      
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }
          
          const uploadResult = await uploadResponse.json();
          uploadedImageUrls.push(uploadResult.url);
        }
      }
      
      // Combine existing images with newly uploaded ones
      const allImages = [...existingImages, ...uploadedImageUrls];
      
      // Prepare data for API
      const shoeData = {
        ...formData,
        images: allImages,
      };
      
      // Send data to API
      const response = await fetch(`/api/admin/shoes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shoeData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update shoe');
      }
      
      // Navigate back to inventory page
      router.push('/admin/shoes');
      
    } catch (error) {
      console.error('Error updating shoe:', error);
      setError('Failed to update shoe. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Shoe</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update shoe details and inventory information
          </p>
        </div>
        <Link href="/admin/shoes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Inventory</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Donor Information */}
            <Card>
              <CardHeader>
                <CardTitle>Donor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="donorFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Donor First Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter donor first name" 
                            disabled={fromDonation}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="donorLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Donor Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter donor last name" 
                            disabled={fromDonation}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="donorEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Donor Email</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="donor@example.com" 
                            type="email"
                            disabled={fromDonation}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="donorPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Donor Phone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="(123) 456-7890" 
                          type="tel"
                          disabled={fromDonation}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {/* Image Preview */}
                  <div className="mb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {/* Existing Images */}
                      {existingImages.map((url, index) => (
                        <div key={`existing-${index}`} className="relative aspect-square rounded-md overflow-hidden border">
                          <img 
                            src={url} 
                            alt={`Shoe ${index}`} 
                            className="object-cover w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      {/* New Images */}
                      {imageUrls.map((url, index) => (
                        <div key={`new-${index}`} className="relative aspect-square rounded-md overflow-hidden border">
                          <img 
                            src={url} 
                            alt={`New Image ${index}`} 
                            className="object-cover w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Upload Button */}
                  <div>
                    <Label htmlFor="image" className="block mb-2">
                      Upload Images
                    </Label>
                    <div className="flex items-center space-x-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label
                          htmlFor="picture"
                          className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-md cursor-pointer hover:border-gray-400"
                        >
                          <div className="flex flex-col items-center">
                            <Upload className="h-6 w-6 text-gray-400 mb-1" />
                            <span className="text-sm text-gray-500">Upload Images</span>
                          </div>
                          <Input
                            id="picture"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleImageSelect}
                            multiple
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
                            <span className="text-sm text-gray-500">Take Photo</span>
                          </div>
                          <Input
                            id="camera"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleImageSelect}
                          />
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Shoe Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sortedBrands.map(brand => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
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
                        <FormLabel>Model Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(SHOE_GENDERS).map(([key, gender]) => (
                              <SelectItem key={gender} value={gender.toLowerCase()}>
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sortedSports.map(sport => (
                              <SelectItem key={sport} value={sport}>
                                {sport}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(SHOE_CONDITIONS).map(([key, condition]) => (
                              <SelectItem key={condition} value={condition.toLowerCase().replace(' ', '_')}>
                                {condition}
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
                          placeholder="Enter shoe description"
                          className="resize-y min-h-[100px]"
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(SHOE_STATUSES).map(([key, status]) => (
                              <SelectItem key={status} value={status}>
                                {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="inventoryCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory Count</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="1" 
                            {...field} 
                          />
                        </FormControl>
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
            
            <div className="flex justify-end gap-3">
              <Link href="/admin/shoes">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
} 