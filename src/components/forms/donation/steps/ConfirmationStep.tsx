import React from 'react';
import { 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { CheckCircle2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ConfirmationStepProps {
  donationId: string;
  resetForm: () => void;
}

export default function ConfirmationStep({ donationId, resetForm }: ConfirmationStepProps) {
  return (
    <>
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle2Icon className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-center">Thank You for Your Donation!</CardTitle>
        <CardDescription className="text-center">
          Your donation has been successfully submitted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-2">Donation Reference</h3>
            <p className="text-sm mb-4">
              Your donation reference number is: <span className="font-mono font-medium">{donationId}</span>
            </p>
            <p className="text-sm text-gray-500">
              Please save this reference number for your records. You can use it to track the status of your donation.
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Next Steps</h3>
            <ul className="text-sm space-y-3">
              <li className="flex">
                <div className="mr-2 mt-0.5 flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-medium">1</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Email Confirmation</span>
                  <p className="text-gray-500">
                    We've sent a confirmation email to your registered email address with all the details of your donation.
                  </p>
                </div>
              </li>
              <li className="flex">
                <div className="mr-2 mt-0.5 flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-medium">2</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Prepare Your Shoes</span>
                  <p className="text-gray-500">
                    Please clean your shoes and tie them together to prepare them for donation.
                  </p>
                </div>
              </li>
              <li className="flex">
                <div className="mr-2 mt-0.5 flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-medium">3</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Complete Your Donation</span>
                  <p className="text-gray-500">
                    Follow the instructions for your chosen donation method (drop-off, pickup, or shipping).
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Your Impact</h3>
            <p className="text-sm text-blue-700">
              Thank you for helping us provide quality sports shoes to those in need. Your donation will help someone 
              participate in sports and physical activities they might not otherwise be able to afford.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button 
              variant="outline" 
              className="sm:flex-1"
              onClick={resetForm}
            >
              Make Another Donation
            </Button>
            <Button 
              variant="default" 
              className="sm:flex-1"
              asChild
            >
              <Link href="/account/donations">
                View My Donations
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  );
} 