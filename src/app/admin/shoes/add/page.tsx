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
      // Call the shoe donations API
      const response = await fetch('/api/admin/shoe-donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add shoe');
      }

      const result = await response.json();
      console.log('API result:', result);
      
      // Return the result for the form to display
      return result;
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