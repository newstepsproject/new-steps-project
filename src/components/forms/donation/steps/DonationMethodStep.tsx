import { useFormContext } from 'react-hook-form';
import { 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CalendarIcon, TruckIcon, MapPinIcon } from 'lucide-react';

// Define a more complete type that includes all required fields for the multi-step form
interface DonationFormWithMethodData {
  donorInfo: {
    name: string;
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
}

interface DonationMethodStepProps {
  isBayArea?: boolean;
}

export default function DonationMethodStep({ isBayArea: propIsBayArea }: DonationMethodStepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<DonationFormWithMethodData>();

  // Use prop value if provided, otherwise use form value
  const formIsBayArea = watch('donorInfo.isBayArea');
  const isBayArea = propIsBayArea !== undefined ? propIsBayArea : formIsBayArea;
  const donationMethod = watch('donationMethod.method');

  return (
    <>
      <CardHeader>
        <CardTitle>Donation Method</CardTitle>
        <CardDescription>
          How would you like to donate your shoes?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <RadioGroup
            defaultValue={donationMethod}
            onValueChange={(value) => {
              const event = {
                target: { value },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              register('donationMethod.method').onChange(event);
            }}
            className="space-y-4"
          >
            {isBayArea && (
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <RadioGroupItem 
                  value="dropoff" 
                  id="dropoff"
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="dropoff" 
                    className="flex items-center text-base font-medium cursor-pointer"
                  >
                    <MapPinIcon className="h-5 w-5 mr-2 text-primary" />
                    Drop Off
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Drop off your shoes at our Bay Area locations.
                  </p>
                  <div className="mt-3 text-sm">
                    <strong>Locations:</strong>
                    <ul className="list-disc pl-5 mt-2">
                      <li>San Francisco: 123 Market St, San Francisco, CA 94105</li>
                      <li>Oakland: 456 Broadway Ave, Oakland, CA 94612</li>
                      <li>San Jose: 789 Tech Dr, San Jose, CA 95110</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {isBayArea && (
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <RadioGroupItem 
                  value="pickup" 
                  id="pickup"
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="pickup" 
                    className="flex items-center text-base font-medium cursor-pointer"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
                    Schedule Pickup
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    We'll pick up the shoes from your address (Bay Area only).
                  </p>
                  <div className="mt-3 text-sm">
                    <strong>Available Days:</strong> Monday to Friday, 9am to 5pm
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem 
                value="ship" 
                id="ship"
                className="mt-1"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="ship" 
                  className="flex items-center text-base font-medium cursor-pointer"
                >
                  <TruckIcon className="h-5 w-5 mr-2 text-primary" />
                  Ship to Us
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Ship your shoes to our distribution center.
                </p>
                <div className="mt-3 text-sm">
                  <strong>Shipping Address:</strong><br />
                  New Steps Project<br />
                  1000 Donation Way<br />
                  San Francisco, CA 94107
                </div>
              </div>
            </div>
          </RadioGroup>

          {errors.donationMethod?.method && (
            <p className="text-sm text-red-500">
              {errors.donationMethod.method.message}
            </p>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-blue-800 font-medium">Important Information</h4>
            <p className="text-sm text-blue-700 mt-1">
              {donationMethod === 'dropoff' && "Please ensure the shoes are clean and tied together before drop-off. Our drop-off locations are open Monday to Saturday, 10am to 6pm."}
              {donationMethod === 'pickup' && "A team member will contact you to confirm the pickup time. Please have the shoes packaged and ready for pickup."}
              {donationMethod === 'ship' && "Please package the shoes securely and include a note with your name and contact information. We recommend using USPS or FedEx for shipping."}
              {!donationMethod && "Once you select a donation method, additional information will be displayed here."}
            </p>
          </div>
        </div>
      </CardContent>
    </>
  );
} 