import React from 'react';
import DonationForm from '@/components/forms/donation/DonationForm';

export const metadata = {
  title: 'Donation Test | New Steps Project',
  description: 'Test page for the donation form',
};

export default function DonationTestPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Donate Your Shoes</h1>
          <p className="text-gray-600">
            Your gently used athletic shoes can make a difference. Fill out the form below to start your donation.
          </p>
        </div>
        
        <DonationForm />
      </div>
    </div>
  );
} 
