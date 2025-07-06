'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';

// Define a more complete type that includes all required fields for the multi-step form
interface DonationFormWithMethodData {
  donorInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isBayArea?: boolean;
  };
  shoeDetails: {
    shoes: Array<{
      brand: string;
      modelName: string;
      size: string;
      gender: string;
      condition: string;
      sport: string;
      color: string;
      description?: string;
      images?: string[];
    }>;
  };
  donationMethod: {
    method: 'dropoff' | 'pickup' | 'ship';
  };
  donationDescription: string;
  // Updated form fields for firstName/lastName
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function DonorInfoStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<DonationFormWithMethodData>();

  return (
    <>
      <CardHeader>
        <CardTitle>Your Information</CardTitle>
        <CardDescription>
          Please provide your contact information for the donation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">
                ZIP Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="zipCode"
                {...register('zipCode')}
                placeholder="Enter your ZIP code"
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
                placeholder="Enter your country"
                defaultValue="USA"
              />
              {errors.country && (
                <p className="text-sm text-red-500">{errors.country.message}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
} 