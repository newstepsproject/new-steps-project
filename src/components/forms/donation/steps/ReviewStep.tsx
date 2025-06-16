import { useFormContext } from 'react-hook-form';
import { 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckIcon, PencilIcon, ImageIcon } from 'lucide-react';
import Image from 'next/image';

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

interface ReviewStepProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  onEditSection: (step: number) => void;
}

export default function ReviewStep({ onSubmit, isSubmitting, onEditSection }: ReviewStepProps) {
  const { watch, trigger } = useFormContext<DonationFormWithMethodData>();
  
  const formData = watch();
  const { donorInfo, shoeDetails, donationMethod } = formData;

  // Function to handle navigating back to a specific step
  const handleEditSection = (step: number) => {
    // Trigger validation before allowing to go back
    trigger().then((isValid) => {
      if (isValid) {
        onEditSection(step);
      }
    });
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Review Your Donation</CardTitle>
        <CardDescription>
          Please review your donation details before submission.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Donor Information Review */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
              <h3 className="font-medium text-gray-900">Donor Information</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 flex items-center text-gray-600"
                onClick={() => handleEditSection(0)}
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-sm text-gray-900">{donorInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{donorInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{donorInfo.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-sm text-gray-900">
                  {donorInfo.street}, {donorInfo.city}, {donorInfo.state} {donorInfo.zipCode}, {donorInfo.country}
                </p>
              </div>
            </div>
          </div>

          {/* Shoe Details Review */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
              <h3 className="font-medium text-gray-900">Shoe Details</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 flex items-center text-gray-600"
                onClick={() => handleEditSection(1)}
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {shoeDetails.shoes.map((shoe, index) => (
                <div 
                  key={index} 
                  className={`p-3 ${index !== shoeDetails.shoes.length - 1 ? 'border-b' : ''}`}
                >
                  <h4 className="font-medium mb-2">Shoe {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-500">Brand & Model</p>
                      <p className="text-gray-900">{shoe.brand} {shoe.modelName}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Size & Gender</p>
                      <p className="text-gray-900">Size {shoe.size} ({shoe.gender})</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Color</p>
                      <p className="text-gray-900">{shoe.color}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Sport</p>
                      <p className="text-gray-900">{shoe.sport}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Condition</p>
                      <p className="text-gray-900">{shoe.condition}</p>
                    </div>
                    {shoe.description && (
                      <div className="md:col-span-3">
                        <p className="font-medium text-gray-500">Description</p>
                        <p className="text-gray-900">{shoe.description}</p>
                      </div>
                    )}
                    
                    {/* Image Gallery */}
                    {shoe.images && shoe.images.length > 0 && (
                      <div className="md:col-span-3 mt-2">
                        <p className="font-medium text-gray-500 mb-2">Images</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {shoe.images.map((imageUrl, imgIndex) => (
                            <div key={imgIndex} className="relative rounded-md overflow-hidden h-24 border">
                              <Image 
                                src={imageUrl} 
                                alt={`Shoe ${index + 1} image ${imgIndex + 1}`}
                                fill
                                className="object-cover" 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(!shoe.images || shoe.images.length === 0) && (
                      <div className="md:col-span-3 flex items-center mt-2 text-gray-500">
                        <ImageIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm">No images uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Donation Method Review */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
              <h3 className="font-medium text-gray-900">Donation Method</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 flex items-center text-gray-600"
                onClick={() => handleEditSection(2)}
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Method</p>
                  <p className="text-sm text-gray-900 capitalize">
                    {donationMethod.method === 'dropoff' && 'Drop Off at Location'}
                    {donationMethod.method === 'pickup' && 'Schedule Pickup'}
                    {donationMethod.method === 'ship' && 'Ship to Distribution Center'}
                  </p>
                </div>
                
                {donationMethod.method === 'dropoff' && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Drop-off Locations</p>
                    <ul className="list-disc pl-5 mt-1 text-sm text-gray-900">
                      <li>San Francisco: 123 Market St, San Francisco, CA 94105</li>
                      <li>Oakland: 456 Broadway Ave, Oakland, CA 94612</li>
                      <li>San Jose: 789 Tech Dr, San Jose, CA 95110</li>
                    </ul>
                  </div>
                )}
                
                {donationMethod.method === 'ship' && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Shipping Address</p>
                    <p className="text-sm text-gray-900">
                      New Steps Project<br />
                      1000 Donation Way<br />
                      San Francisco, CA 94107
                    </p>
                  </div>
                )}
                
                {donationMethod.method === 'pickup' && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pickup Details</p>
                    <p className="text-sm text-gray-900">
                      We'll contact you to schedule a pickup time at your address.<br />
                      Available Days: Monday to Friday, 9am to 5pm
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Legal Confirmation */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              By submitting this form, you confirm that all information provided is accurate and that you are the rightful owner of the shoes being donated. You understand that these shoes will be distributed to those in need at no cost to the recipients.
            </p>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Donation'}
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  );
} 