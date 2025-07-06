'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { BAY_AREA_ZIP_CODES } from '@/constants/config';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Form Schema
const donationFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().optional(),
  street: z.string().min(2, { message: 'Street address is required' }),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  zipCode: z.string().min(5, { message: 'ZIP code is required' }),
  country: z.string().min(2, { message: 'Country is required' }),
  numberOfShoes: z.number().min(1, { message: 'Please enter the number of shoes you are donating' }),
  donationDescription: z.string().min(10, { message: 'Please describe what you\'re donating (at least 10 characters)' }),
  isBayArea: z.boolean().optional(),
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
}).refine((data) => {
  // Additional validation to ensure ZIP code is in a valid format
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(data.zipCode)) {
    return false;
  }
  return true;
}, {
  message: 'Please enter a valid ZIP code',
  path: ['zipCode']
}).refine((data) => {
  // Additional validation to ensure state is a valid US state
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  if (!validStates.includes(data.state.toUpperCase())) {
    return false;
  }
  return true;
}, {
  message: 'Please enter a valid US state',
  path: ['state']
});

export type DonationFormData = z.infer<typeof donationFormSchema>;

function DonationFormContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationId, setDonationId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Form setup with validation schema
  const methods = useForm<DonationFormData>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      numberOfShoes: 1,
      donationDescription: '',
      isBayArea: false,
    },
    mode: 'onChange',
  });
  
  const { register, watch, setValue, formState: { errors, isSubmitting: formIsSubmitting } } = methods;

  // Watch for ZIP code changes to determine if the donor is in the Bay Area
  const zipCode = watch('zipCode');
  React.useEffect(() => {
    if (zipCode && zipCode.length === 5) {
      const isInBayArea = BAY_AREA_ZIP_CODES.includes(zipCode);
      setValue('isBayArea', isInBayArea);
    }
  }, [zipCode, setValue]);

  const onSubmit = async (data: DonationFormData) => {
    console.log('Submit button clicked, form data:', data);
    try {
      setIsSubmitting(true);
      console.log('Submitting donation form data:', data);
      
      // Validate form data
      const validationResult = donationFormSchema.safeParse(data);
      if (!validationResult.success) {
        console.error('Form validation failed:', validationResult.error);
        const errorMessages = validationResult.error.errors.map(err => err.message).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      
      // Submit to the real API endpoint instead of the test one
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      
      if (!response.ok) {
        console.error('Error response:', result);
        throw new Error(result.error || 'Failed to submit donation');
      }
      
      if (!result.success) {
        console.error('API returned success: false:', result);
        throw new Error(result.message || 'Failed to submit donation');
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
            Your donation has been submitted successfully.
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
              We will contact you soon to arrange donation pickup or provide further instructions.
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
          <CardTitle>Donate Shoes</CardTitle>
          <CardDescription>
            Please provide your contact information and details about the shoes you wish to donate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Your Information</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Enter your first name"
                    className="h-12"
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Enter your last name"
                    className="h-12"
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter your email address"
                    className="h-12"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    placeholder="(555) 123-4567"
                    className="h-12"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">
                    Street Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="street"
                    {...register('street')}
                    placeholder="Enter your street address"
                  />
                  {errors.street && (
                    <p className="text-sm text-red-500">{errors.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="San Francisco"
                      className="h-12"
                      autoComplete="address-level2"
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="state"
                      {...register('state')}
                      placeholder="CA"
                      className="h-12"
                      autoComplete="address-level1"
                      maxLength={2}
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500">{errors.state.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">
                      ZIP Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="zipCode"
                      {...register('zipCode')}
                      placeholder="94105"
                      className="h-12"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={5}
                    />
                    {errors.zipCode && (
                      <p className="text-sm text-red-500">{errors.zipCode.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="country"
                      {...register('country')}
                      placeholder="USA"
                      defaultValue="USA"
                      className="h-12"
                      autoComplete="country"
                      readOnly
                    />
                    {errors.country && (
                      <p className="text-sm text-red-500">{errors.country.message}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-6">
                <h3 className="text-lg font-medium">Donation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfShoes">
                      Number of Shoes <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="numberOfShoes"
                      type="number"
                      min="1"
                      {...register('numberOfShoes', { valueAsNumber: true })}
                      placeholder="Enter number of shoes"
                    />
                    {errors.numberOfShoes && (
                      <p className="text-sm text-red-500">{errors.numberOfShoes.message}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="donationDescription">
                    Description of Shoes <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="donationDescription"
                    {...register('donationDescription')}
                    placeholder="Please describe the shoes you're donating (e.g., brand, size, condition, etc.)"
                    className="h-32"
                  />
                  {errors.donationDescription && (
                    <p className="text-sm text-red-500">{errors.donationDescription.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Include details like brand, size, color, and condition of the shoes.
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-6">
                <h4 className="text-blue-800 font-medium">Donation Information</h4>
                <p className="text-sm text-blue-700 mt-1">
                  {watch('isBayArea') 
                    ? "Since you're in the Bay Area, we can arrange for pickup or drop-off of your donation. We'll contact you to arrange the details."
                    : "We'll contact you with shipping instructions for your donation. Thank you for your generosity!"}
                </p>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting || formIsSubmitting}
                  className="w-full"
                >
                  {isSubmitting || formIsSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Donation'
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 mt-3 text-center">
                  By submitting this donation, you agree to our{' '}
                  <Link href="/privacy" className="text-brand hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  and understand how we handle your personal information.
                </p>
                
                {Object.keys(errors).length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
                    <ul className="list-disc list-inside text-red-700">
                      {Object.entries(errors).map(([field, error]) => {
                        if (field === 'root') {
                          return (
                            <li key={field}>
                              {error.message}
                            </li>
                          );
                        }
                        if (field === 'phone' || field === 'zipCode' || field === 'state') {
                          return (
                            <li key={field}>
                              {error.message}
                            </li>
                          );
                        }
                        return (
                          <li key={field}>
                            {error.message}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

// Wrap the component with error boundary
export default function DonationForm() {
  return (
    <DonationFormContent />
  );
} 