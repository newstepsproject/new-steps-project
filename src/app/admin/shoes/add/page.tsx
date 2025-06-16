'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedShoeForm } from '@/components/admin/UnifiedShoeForm';
import { toast } from '@/components/ui/use-toast';

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
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Add a Shoe</h1>
      <UnifiedShoeForm onSubmit={handleSubmit} />
    </div>
  );
} 