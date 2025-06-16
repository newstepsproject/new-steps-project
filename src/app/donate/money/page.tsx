import { Suspense } from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Dynamically import the client component
const MoneyDonationFormWrapper = dynamic(
  () => import('@/components/forms/donation/MoneyDonationFormWrapper'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Donate Money | New Steps Project',
  description: 'Support our mission with a financial contribution. Make a difference by donating to the New Steps Project.',
};

export default function MoneyDonationPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Monetary Donations</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your financial support helps us continue our mission of providing quality
          sports footwear to those in need. Every dollar makes a difference!
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Why Donate Money Box */}
        <div className="bg-brand/5 p-6 rounded-lg border border-brand/10">
          <h2 className="text-xl font-semibold text-brand mb-3">Why Donate Money?</h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-brand mr-2">•</span>
              <span>Cover shipping costs for families who cannot afford it</span>
            </li>
            <li className="flex items-start">
              <span className="text-brand mr-2">•</span>
              <span>Help us purchase cleaning supplies for donated shoes</span>
            </li>
            <li className="flex items-start">
              <span className="text-brand mr-2">•</span>
              <span>Support our operational expenses and volunteer programs</span>
            </li>
            <li className="flex items-start">
              <span className="text-brand mr-2">•</span>
              <span>Expand our reach to more communities in need</span>
            </li>
          </ul>
        </div>
        
        {/* How It Works Box */}
        <div className="bg-energy/5 p-6 rounded-lg border border-energy/10">
          <h2 className="text-xl font-semibold text-energy mb-3">How It Works</h2>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="pl-2">Fill out the donation form with your information</li>
            <li className="pl-2">Receive a confirmation email with mailing instructions</li>
            <li className="pl-2">Mail your check to our project address</li>
            <li className="pl-2">We'll send you a tax receipt upon receiving your donation</li>
          </ol>
          <p className="mt-4 text-sm text-gray-600">
            All donations to the New Steps Project are tax-deductible. You will receive 
            a receipt for your tax records after we process your donation.
          </p>
        </div>
      
        {/* Donation Form Box */}
        <div>
          <Suspense fallback={<div className="text-center py-8">Loading form...</div>}>
            <MoneyDonationFormWrapper />
          </Suspense>
        </div>
      </div>
    </main>
  );
} 
