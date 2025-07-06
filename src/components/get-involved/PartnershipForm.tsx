"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const formSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required'),
  organizationType: z.string().min(1, 'Please select an organization type'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  message: z.string().min(20, 'Please provide more details about your partnership interest'),
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

type FormValues = z.infer<typeof formSchema>;

export default function PartnershipForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      organizationType: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...values,
          name: `${values.firstName} ${values.lastName}`, // Combine for backward compatibility
          type: 'partnership',
          subject: `Partnership Inquiry from ${values.organizationName}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit partnership inquiry');
      }
      
      setSubmitSuccess(true);
      form.reset();
    } catch (error) {
      console.error('Partnership form submission error:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Thank You for Your Interest!
            </h3>
            <p className="text-green-700 mb-4">
              We've received your partnership inquiry and will be in touch within 2-3 business days.
            </p>
            <p className="text-sm text-green-600">
              In the meantime, feel free to explore our other ways to get involved.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Partnership Application</CardTitle>
          <CardDescription>
            Tell us about your organization and how you'd like to partner with New Steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your organization name" 
                          {...field} 
                          className="focus:ring-2 focus:ring-brand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Type <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="focus:ring-2 focus:ring-brand">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="school">School / Educational Institution</SelectItem>
                          <SelectItem value="sports-org">Sports Organization / Club</SelectItem>
                          <SelectItem value="business">Business / Corporation</SelectItem>
                          <SelectItem value="non-profit">Non-Profit Organization</SelectItem>
                          <SelectItem value="community-group">Community Group</SelectItem>
                          <SelectItem value="government">Government Agency</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your first name" 
                          {...field} 
                          className="focus:ring-2 focus:ring-brand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your last name" 
                          {...field} 
                          className="focus:ring-2 focus:ring-brand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your.email@organization.com" 
                          {...field} 
                          className="focus:ring-2 focus:ring-brand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          {...field}
                          className="focus:ring-2 focus:ring-brand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partnership Interest *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe how you'd like to partner with New Steps. Include details about your organization, the type of partnership you're interested in, and any specific goals or ideas you have."
                        className="h-32 focus:ring-2 focus:ring-brand resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-success to-success-600 hover:from-success-600 hover:to-success-700 text-white font-medium py-2.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Partnership Inquiry'
                )}
              </Button>
              
              <p className="text-xs text-gray-500 mt-3 text-center">
                By submitting this inquiry, you agree to our{' '}
                <Link href="/privacy" className="text-brand hover:underline">
                  Privacy Policy
                </Link>{' '}
                and understand how we handle your organization's information.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 