'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed direct settings import - using API instead

// Form Schema
const moneyDonationFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().optional(),
  amount: z
    .string()
    .min(1, { message: 'Donation amount is required' })
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Donation amount must be a positive number',
    }),
  notes: z.string().optional(),
}).refine((data) => {
  // Additional validation for phone number only if provided
  if (data.phone && data.phone.trim().length > 0) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(data.phone.replace(/\D/g, ''))) {
      return false;
    }
  }
  return true;
}, {
  message: 'Please enter a valid phone number',
  path: ['phone']
});

export type MoneyDonationFormData = z.infer<typeof moneyDonationFormSchema>;

// Using centralized safe router hook from @/hooks/useSafeRouter

export default function MoneyDonationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationId, setDonationId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const router = useSafeRouter();
  const { toast } = useToast();

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const appSettings = await response.json();
        setSettings(appSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Use default settings if API fails
        setSettings({
          maxShoesPerRequest: 2,
          shippingFee: 5,
          projectEmail: 'newstepsfit@gmail.com',
          projectPhone: '(916) 582-7090'
        });
      }
    };
    loadSettings();
  }, []);

  // Form setup with validation schema
  const methods = useForm<MoneyDonationFormData>({
    resolver: zodResolver(moneyDonationFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
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
            
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full max-w-md">
              <h4 className="text-blue-800 font-medium text-center mb-3">📮 Mailing Instructions</h4>
              <p className="text-sm text-blue-700 mb-3 text-center">
                Please make your check payable to <strong>"New Steps Project"</strong> and mail it to:
              </p>
              <div className="bg-white p-4 rounded border border-blue-100 text-left">
                <p className="font-medium text-gray-900">{settings?.founderName || 'Walter Zhang'}</p>
                <p className="text-gray-800">New Steps Project</p>
                {settings?.officeAddress ? (
                  <>
                    <p className="text-gray-800">{settings.officeAddress.street}</p>
                    <p className="text-gray-800">{settings.officeAddress.city}, {settings.officeAddress.state} {settings.officeAddress.zipCode}</p>
                    {settings.officeAddress.country !== 'USA' && (
                      <p className="text-gray-800">{settings.officeAddress.country}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-gray-800">348 Cardona Cir</p>
                    <p className="text-gray-800">San Ramon, CA 94583</p>
                  </>
                )}
              </div>
              <p className="text-xs text-blue-600 mt-3 text-center">
                You'll also receive this information via email confirmation.
              </p>
            </div>
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
                  <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Enter your first name"
                    className="h-12"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Enter your last name"
                    className="h-12"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="Enter your email address"
                      className="h-12"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      placeholder="(555) 123-4567"
                      className="h-12"
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
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Any additional information you'd like to provide"
                    className="h-24"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Donation'}
                </Button>
                
                <p className="text-xs text-gray-500 mt-3 text-center">
                  By submitting this donation, you agree to our{' '}
                  <Link href="/privacy" className="text-brand hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  and understand how we handle your personal information.
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
} 