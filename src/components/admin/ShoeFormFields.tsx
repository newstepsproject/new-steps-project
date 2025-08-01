'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Camera, X, Upload } from 'lucide-react';
import { SHOE_BRANDS, SHOE_CONDITIONS, SHOE_SPORTS, SHOE_GENDERS, SHOE_STATUSES } from '@/constants/config';
import { createCompressedDataURL, formatFileSize, batchProcessImages } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';

export interface ShoeFormItem {
  id?: string; // Optional for existing items
  brand: string;
  modelName: string;
  gender: string;
  size: string;
  color: string;
  sport: string;
  condition: string;
  quantity: number;
  notes?: string;
  images: string[];
  status: string;
}

export interface ShoeFormFieldsProps {
  items: ShoeFormItem[];
  setItems: (items: ShoeFormItem[]) => void;
  maxItems?: number;
  readOnly?: boolean;
  singleItemMode?: boolean;
}

export function ShoeFormFields({
  items,
  setItems,
  maxItems = Infinity,
  readOnly = false,
  singleItemMode = false
}: ShoeFormFieldsProps) {
  const { toast } = useToast();
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: { progress: number; currentFile: string } }>({});
  
  // Sort brands and sports alphabetically
  const sortedBrands = [...SHOE_BRANDS].sort((a, b) => a.localeCompare(b));
  const sortedSports = [...SHOE_SPORTS].sort((a, b) => a.localeCompare(b));

  const handleAddItem = () => {
    if (items.length >= maxItems) {
      // Could show a notification or alert here
      return;
    }

    setItems([...items, {
      brand: '',
      modelName: '',
      gender: 'unisex',
      size: '',
      color: '',
      sport: '',
      condition: 'like_new',
      quantity: 1,
      notes: '',
      images: [],
      status: SHOE_STATUSES.AVAILABLE
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ShoeFormItem, value: string | number | string[]) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Handle image upload for a specific item with mobile compression and batch processing
  const handleImageSelect = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const uploadKey = `${index}-${Date.now()}`;
    setUploadingImages(prev => ({ ...prev, [uploadKey]: true }));
    setUploadProgress(prev => ({ ...prev, [uploadKey]: { progress: 0, currentFile: '' } }));

    try {
      // Use batch processing for better mobile experience
      const results = await batchProcessImages(
        files,
        true, // Use mobile compression
        (progress, currentFile) => {
          setUploadProgress(prev => ({
            ...prev,
            [uploadKey]: { progress, currentFile }
          }));
        }
      );

      // Filter successful results and convert to data URLs
      const successfulResults = results.filter(result => result.valid);
      const processedImages: string[] = [];
      
      for (const result of successfulResults) {
        const dataURL = await createCompressedDataURL(result.file, true);
        processedImages.push(dataURL);
      }

      // Update the items with compressed images
      const newItems = [...items];
      newItems[index].images = [...newItems[index].images, ...processedImages];
      setItems(newItems);

      // Calculate total compression statistics
      const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
      const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
      const averageCompression = Math.round((1 - totalCompressedSize / totalOriginalSize) * 100);

      // Show detailed feedback
      if (successfulResults.length > 0) {
        toast({
          title: "Images processed successfully",
          description: `${successfulResults.length} image(s) processed. Compressed by ~${averageCompression}% (${formatFileSize(totalOriginalSize)} → ${formatFileSize(totalCompressedSize)})`,
        });
      }

      // Show errors for failed uploads
      const failedResults = results.filter(result => !result.valid);
      if (failedResults.length > 0) {
        toast({
          variant: "destructive",
          title: "Some uploads failed",
          description: `${failedResults.length} image(s) failed to process. Please try again.`,
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
      setUploadingImages(prev => {
        const newState = { ...prev };
        delete newState[uploadKey];
        return newState;
      });
      setUploadProgress(prev => {
        const newState = { ...prev };
        delete newState[uploadKey];
        return newState;
      });
    }
  };

  // Remove image from a specific item
  const removeImage = (itemIndex: number, imageIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].images = newItems[itemIndex].images.filter((_, i) => i !== imageIndex);
    setItems(newItems);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">{singleItemMode ? 'Shoe Details' : `Item ${index + 1}`}</h4>
            {!readOnly && !singleItemMode && items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Image Upload Area */}
          {!readOnly && (
            <div className="space-y-4">
              {/* Hidden file inputs */}
              <input
                id={`image-upload-${index}`}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageSelect(index, e)}
                className="hidden"
                disabled={readOnly}
              />
              <input
                id={`image-camera-${index}`}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleImageSelect(index, e)}
                className="hidden"
                disabled={readOnly}
              />
              
              {/* Two separate buttons */}
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                  className="flex items-center gap-2 flex-1"
                  disabled={Object.keys(uploadingImages).length > 0}
                >
                  <Upload className="h-4 w-4" />
                  {Object.keys(uploadingImages).length > 0 ? 'Processing...' : 'Upload Files'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(`image-camera-${index}`)?.click()}
                  className="flex items-center gap-2 flex-1"
                  disabled={Object.keys(uploadingImages).length > 0}
                >
                  <Camera className="h-4 w-4" />
                  {Object.keys(uploadingImages).length > 0 ? 'Processing...' : 'Take Photo'}
                </Button>
              </div>
              
              {Object.keys(uploadingImages).length > 0 && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
                  {Object.entries(uploadProgress).map(([key, progress]) => (
                    <div key={key} className="mt-2">
                      <p className="text-xs text-gray-500">
                        Processing: {progress.currentFile || 'Starting...'}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {Math.round(progress.progress)}% complete
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Image Previews */}
              {item.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {item.images.map((url, imgIndex) => (
                    <div key={imgIndex} className="relative group">
                      <img
                        src={url}
                        alt={`Shoe image ${imgIndex + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => removeImage(index, imgIndex)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Brand <span className="text-red-500">*</span></Label>
              <Select
                value={item.brand}
                onValueChange={(value) => handleItemChange(index, 'brand', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {sortedBrands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Model Name</Label>
              <Input
                value={item.modelName}
                onChange={(e) => handleItemChange(index, 'modelName', e.target.value)}
                placeholder="e.g., Air Max 90"
                disabled={readOnly}
              />
            </div>
            
            <div>
              <Label>Gender <span className="text-red-500">*</span></Label>
              <Select
                value={item.gender}
                onValueChange={(value) => handleItemChange(index, 'gender', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {SHOE_GENDERS.map(gender => (
                    <SelectItem key={gender.toLowerCase()} value={gender.toLowerCase()}>
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Size <span className="text-red-500">*</span></Label>
              <Input
                value={item.size}
                onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                placeholder="e.g., 10.5"
                disabled={readOnly}
              />
            </div>
            
            <div>
              <Label>Color</Label>
              <Input
                value={item.color}
                onChange={(e) => handleItemChange(index, 'color', e.target.value)}
                placeholder="e.g., Black/White"
                disabled={readOnly}
              />
            </div>
            
            <div>
              <Label>Sport <span className="text-red-500">*</span></Label>
              <Select
                value={item.sport}
                onValueChange={(value) => handleItemChange(index, 'sport', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {sortedSports.map(sport => (
                    <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Condition <span className="text-red-500">*</span></Label>
              <Select
                value={item.condition}
                onValueChange={(value) => handleItemChange(index, 'condition', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {SHOE_CONDITIONS.map(condition => (
                    <SelectItem key={condition.toLowerCase().replace(' ', '_')} value={condition.toLowerCase().replace(' ', '_')}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                disabled={readOnly}
              />
            </div>
            
            <div className="md:col-span-3">
              <Label>Notes</Label>
              <Textarea
                value={item.notes || ''}
                onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                placeholder="Any additional details about this item"
                rows={2}
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      ))}
      
      {!readOnly && !singleItemMode && items.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddItem}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Item
        </Button>
      )}
    </div>
  );
} 