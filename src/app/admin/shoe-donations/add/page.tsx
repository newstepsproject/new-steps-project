'use client';

import { useRouter } from 'next/navigation';
import { UnifiedShoeForm } from '@/components/admin/UnifiedShoeForm';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

export default function AddShoeDonationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [submittedShoes, setSubmittedShoes] = useState<any[]>([]);

  const handleSubmit = async (data: any, resultShoes: any[]) => {
    // Make sure we have a session
    if (!session?.user?.email) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add donations.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add current user as creator
      const dataWithCreator = {
        ...data,
        createdBy: session.user.email,
      };
      
      console.log('Submitting donation with', dataWithCreator.shoes.length, 'shoes');
      
      // Submit to API
      const response = await fetch('/api/admin/shoe-donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithCreator),
        credentials: 'include',  // Include credentials for authenticated request
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
            if (errorJson.details) {
              errorMessage += `: ${errorJson.details}`;
            }
          }
        } catch (e) {
          // If not JSON, use the raw error text
          if (errorText) errorMessage = errorText;
        }
        
        console.error('Donation submission failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Donation added successfully:', result);
      
      return result;
    } catch (error) {
      console.error('Error saving donation:', error);
      // Error is handled by the UnifiedShoeForm component
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add Shoes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add new shoes to inventory with donation information.
        </p>
      </div>

      <UnifiedShoeForm 
        onSubmit={handleSubmit}
      />
    </div>
  );
} 