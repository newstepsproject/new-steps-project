'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CONTACT_INFO } from '@/constants/config';

// Form Schema
const moneyDonationFormSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().min(10, { message: 'Valid phone number is required' }),
  amount: z
    .string()
    .min(1, { message: 'Donation amount is required' })
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Donation amount must be a positive number',
    }),
  notes: z.string().optional(),
});

export type MoneyDonationFormData = z.infer<typeof moneyDonationFormSchema>;

export default function MoneyDonationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationId, setDonationId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Form setup with validation schema
  const methods = useForm<MoneyDonationFormData>({
    resolver: zodResolver(moneyDonationFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      amount: '',
      notes: '',
    },
    mode: 'onChange',
  });
  
  const { register, formState: { errors } } = methods;

  const onSubmit = async (data: MoneyDonationFormData) => {
    try {
      setIsSubmitting(true);
      
      // Submit to test API endpoint instead of the production one for now
      const response = await fetch('/api/test/donations/money', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit donation');
      }
      
      // Set donation ID from API response
      setDonationId(result.donationId);
      setSubmitted(true);
      
      // Show success toast
      toast({
        title: 'Donation Submitted',
        description: 'Thank you for your donation! We will contact you soon.',
        variant: 'default'
      });
      
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Show error toast
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit donation',
        variant: 'destructive'
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Thank You!</CardTitle>
          <CardDescription>
            Your money donation has been submitted successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="bg-green-100 text-green-700 p-3 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Donation Received</h3>
            <p className="text-gray-600 mb-4">
              Thank you for your generous donation to New Steps Project!
            </p>
            <div className="bg-gray-100 p-4 rounded-lg w-full max-w-md">
              <p className="text-sm font-medium mb-1">Donation Reference Number:</p>
              <p className="text-lg font-mono bg-white p-2 rounded border">{donationId}</p>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Please make your check payable to "New Steps Project" and mail it to the address below.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push('/')} variant="outline" className="mr-4">
            Return Home
          </Button>
          <Button onClick={() => {
            methods.reset();
            setSubmitted(false);
          }}>
            Make Another Donation
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <FormProvider {...methods}>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Donate Money</CardTitle>
          <CardDescription>
            Support our mission with a financial contribution. We gratefully accept checks to help cover operational costs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Your Information</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-6">
                <h3 className="text-lg font-medium">Donation Details</h3>
                <Label htmlFor="amount">
                  Donation Amount ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  {...register('amount')}
                  placeholder="Enter donation amount"
                  className="mb-1"
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
                
                <div className="mt-4">
                  <Label htmlFor="notes">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Any additional information you'd like to provide"
                    className="h-24"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-6">
                <h4 className="text-blue-800 font-medium">Mailing Information</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Please make your check payable to "New Steps Project" and mail it to:
                </p>
                <div className="mt-2 bg-white p-3 rounded border border-blue-100">
                  <p className="font-medium">{CONTACT_INFO.managerName}</p>
                  <p>New Steps Project</p>
                  <p>{CONTACT_INFO.address}</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  After submitting this form, you'll receive a confirmation email with these instructions.
                </p>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Donation'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
} 