'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UnifiedShoeForm } from '@/components/admin/UnifiedShoeForm';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AddShoesPage() {
  const router = useRouter();

  const handleSubmit = async (formData: any, submittedShoes: any[]) => {
    try {
      // Extract shoe data from the form data structure
      const shoeData = formData.shoes && formData.shoes[0] ? formData.shoes[0] : {
        brand: formData.brand,
        modelName: formData.modelName,
        gender: formData.gender,
        size: formData.size,
        color: formData.color,
        sport: formData.sport,
        condition: formData.condition,
        description: formData.description || formData.notes || '',
        inventoryCount: formData.inventoryCount || formData.quantity || 1,
        inventoryNotes: formData.inventoryNotes || '',
        images: formData.images || [],
        status: formData.status || 'available'
      };

      console.log('Sending shoe data to API:', JSON.stringify(shoeData, null, 2));

      // Call the admin shoes API directly for inventory addition
      const response = await fetch('/api/admin/shoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shoeData),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add shoe');
      }

      const result = await response.json();
      console.log('API result:', result);
      
      // Return the result in the format expected by UnifiedShoeForm
      return {
        success: true,
        shoes: result.shoe ? [result.shoe] : []
      };
    } catch (error) {
      console.error('Error adding shoe:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add shoe",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add a Shoe</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add new shoes to the inventory from donations
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

      <UnifiedShoeForm onSubmit={handleSubmit} />
    </div>
  );
} 