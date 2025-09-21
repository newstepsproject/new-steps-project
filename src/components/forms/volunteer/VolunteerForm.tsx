'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const volunteerFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().optional(),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  availability: z.string().min(1, { message: 'Please select availability' }),
  interests: z.array(z.string()).min(1, { message: 'Select at least one area of interest' }),
  skills: z.string().optional(),
  message: z.string().optional(),
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

type VolunteerFormData = z.infer<typeof volunteerFormSchema>;

const availabilityOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'events', label: 'Special Events Only' },
  { value: 'remote', label: 'Remote Only' },
];

const interestOptions = [
  { id: 'collection', label: 'Shoe Collection Events' },
  { id: 'sorting', label: 'Sorting & Inventory' },
  { id: 'outreach', label: 'Community Outreach' },
  { id: 'tech', label: 'Technical Support' },
  { id: 'admin', label: 'Administrative' },
  { id: 'marketing', label: 'Marketing & Communications' },
];

export default function VolunteerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      availability: '',
      interests: [],
      skills: '',
      message: '',
    },
  });

  useEffect(() => {
    register('availability');
    register('interests');
  }, [register]);

  const onSubmit = async (data: VolunteerFormData) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        phone: data.phone?.trim() ? data.phone.trim() : undefined,
      };

      console.log('Submitting volunteer form data:', payload);
      
      const response = await fetch('/api/volunteers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        const errorDetail = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
        const message = result.message || 'Failed to submit form';
        throw new Error(errorDetail ? `${message} (${errorDetail})` : message);
      }
      
      // Show success toast
      toast({
        title: 'Form Submitted',
        description: 'Thank you for your interest in volunteering! We will contact you soon.',
        variant: 'default'
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Show error toast
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit form',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedInterests = watch('interests');
  const availabilityValue = watch('availability');

  const handleInterestChange = (checked: boolean | "indeterminate", id: string) => {
    if (checked === true) {
      setValue('interests', [...watchedInterests, id], { shouldValidate: true });
    } else {
      setValue(
        'interests',
        watchedInterests.filter((interest) => interest !== id),
        { shouldValidate: true }
      );
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thank You!</CardTitle>
          <CardDescription>
            Your volunteer application has been submitted successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="bg-green-100 text-green-700 p-3 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Application Received</h3>
            <p className="text-gray-600 mb-4">
              Thank you for your interest in volunteering with New Steps Project!
            </p>
            <p className="text-sm text-gray-500">
              We will review your application and reach out to you soon about volunteer opportunities that match your interests and skills.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => setSubmitted(false)} className="mt-4">
            Submit Another Application
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volunteer Application</CardTitle>
        <CardDescription>
          Join our team of volunteers and help make a difference in your community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="Enter your first name"
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
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
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
                    placeholder="Enter your email address"
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
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="Enter your city"
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
                    placeholder="Enter your state"
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500">{errors.state.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">
                Availability <span className="text-red-500">*</span>
              </Label>
              <Select
                value={availabilityValue}
                onValueChange={(value) => setValue('availability', value, { shouldValidate: true })}
              >
                <SelectTrigger id="availability">
                  <SelectValue placeholder="Select your availability" />
                </SelectTrigger>
                <SelectContent>
                  {availabilityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.availability && (
                <p className="text-sm text-red-500">{errors.availability.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label>
                  Areas of Interest <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-gray-500 mb-2">
                  Select all areas you're interested in volunteering
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {interestOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={watchedInterests.includes(option.id)}
                      onCheckedChange={(checked) => handleInterestChange(checked as boolean, option.id)}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.interests && (
                <p className="text-sm text-red-500">{errors.interests.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">
                Skills & Experience
              </Label>
              <Textarea
                id="skills"
                {...register('skills')}
                placeholder="Tell us about any specific skills or relevant experience you have"
                className="h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Additional Information
              </Label>
              <Textarea
                id="message"
                {...register('message')}
                placeholder="Is there anything else you'd like us to know about you?"
                className="h-20"
              />
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 h-12 min-h-[44px] touch-manipulation"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              By submitting this application, you agree to our{' '}
              <Link href="/privacy" className="text-brand hover:underline">
                Privacy Policy
              </Link>{' '}
              and understand how we handle your personal information.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 
