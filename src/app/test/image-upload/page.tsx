'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ImageGallery } from '@/components/ui/image-gallery';
import { formatFileSize, validateImageFile, compressImage } from '@/lib/image-utils';
import { UPLOAD_LIMITS, API_ENDPOINTS } from '@/constants/config';
import { AlertCircle, UploadCloud, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ImageUploadTestPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      toast({
        title: 'Validation error',
        description: validation.error,
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setError(null);
    setSuccessMessage(null);

    try {
      // Compress the image if needed
      const compressedFile = await compressImage(file);
      
      // Create a FormData object
      const formData = new FormData();
      formData.append('file', compressedFile);

      // Simulate gradual progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
          }
          return Math.min(newProgress, 90);
        });
      }, 200);

      // Use the test endpoint for uploads
      const response = await fetch(API_ENDPOINTS.imageUploadTest, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Add the new image to the gallery
      setUploadedImages((prev) => [...prev, data.url]);
      
      setSuccessMessage(`Image "${file.name}" uploaded successfully`);
      toast({
        title: 'Upload complete',
        description: 'Image has been uploaded successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setError(errorMessage);
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const clearGallery = () => {
    setUploadedImages([]);
    toast({
      title: 'Gallery cleared',
      description: 'All images have been removed from the gallery',
      variant: 'default',
    });
  };

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Image Upload Test</h1>
      <p className="text-gray-500 mb-8">
        This page demonstrates the image upload functionality using the test API endpoint. 
        You can upload images and see how they appear in the gallery.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>
              Upload an image to test the image processing functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-upload">Choose an image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image-upload"
                    type="file"
                    accept={UPLOAD_LIMITS.allowedTypes.join(',')}
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    type="button" 
                    disabled={uploading || uploadedImages.length === 0} 
                    onClick={clearGallery}
                  >
                    Clear
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Max file size: {formatFileSize(UPLOAD_LIMITS.maxFileSize)}. 
                  Supported formats: JPG, PNG, WebP.
                </p>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-200" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">Uploading... {uploadProgress}%</p>
                </div>
              )}

              {error && (
                <div className="flex items-center p-3 rounded-md bg-red-50 text-red-500 text-sm">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center p-3 rounded-md bg-green-50 text-green-600 text-sm">
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p>{successMessage}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-500">
              These images are not permanently stored and will be lost when you refresh the page.
            </p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Image Gallery</CardTitle>
            <CardDescription>
              {uploadedImages.length === 0 
                ? 'No images uploaded yet' 
                : `${uploadedImages.length} image${uploadedImages.length === 1 ? '' : 's'} in gallery`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed rounded-lg p-4 text-center">
                <UploadCloud className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">Upload an image to see it here</p>
              </div>
            ) : (
              <ImageGallery 
                images={uploadedImages}
                aspectRatio="square"
                alt="Uploaded image"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 

