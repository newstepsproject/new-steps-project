'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Heart, Users, Package, Calendar, MapPin } from 'lucide-react';

const volunteerActivities = [
  { id: 'collection', label: 'Shoe Collection', icon: Package },
  { id: 'sorting', label: 'Sorting & Organizing', icon: Users },
  { id: 'outreach', label: 'Community Outreach', icon: Heart },
  { id: 'events', label: 'Event Support', icon: Calendar },
  { id: 'tech', label: 'Tech & Website Support', icon: MapPin },
];

export default function VolunteerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    interests: [] as string[],
    availability: '',
    experience: '',
    message: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.interests.length === 0) {
      toast({
        title: "Please select interests",
        description: "Select at least one volunteer activity you're interested in.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest in volunteering. We'll contact you soon!",
      });
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        interests: [],
        availability: '',
        experience: '',
        message: '',
      });
      
      // Redirect to home after a delay
      setTimeout(() => router.push('/'), 3000);
      
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-12 pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Volunteer With Us</h1>
          <p className="text-lg text-gray-600">
            Join our mission to provide quality sports footwear to those in need
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Why Volunteer?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Make a Difference</h3>
                    <p className="text-sm text-gray-600">
                      Help provide essential footwear to young athletes in need
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-energy/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-energy" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Join Our Community</h3>
                    <p className="text-sm text-gray-600">
                      Connect with like-minded individuals passionate about helping others
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Volunteer Application</CardTitle>
            <CardDescription>
              Fill out the form below to join our volunteer team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location (City, State) <span className="text-red-500">*</span></Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., San Francisco, CA"
                    required
                    className="h-12"
                  />
                </div>
              </div>

              {/* Volunteer Interests */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Volunteer Interests <span className="text-red-500">*</span></h3>
                <p className="text-sm text-gray-600">Select all activities you're interested in</p>
                <div className="space-y-3">
                  {volunteerActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <label
                        key={activity.id}
                        className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <Checkbox
                          checked={formData.interests.includes(activity.id)}
                          onCheckedChange={() => handleInterestToggle(activity.id)}
                          className="h-5 w-5"
                        />
                        <Icon className="h-5 w-5 text-gray-500" />
                        <span className="flex-1">{activity.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    placeholder="e.g., Weekends, Evenings, Flexible"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Relevant Experience</Label>
                  <Textarea
                    id="experience"
                    name="experience"
                    placeholder="Tell us about any relevant volunteer or work experience..."
                    className="h-24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Why do you want to volunteer with us?</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Share your motivation for joining our team..."
                    className="h-24"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base touch-manipulation"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 