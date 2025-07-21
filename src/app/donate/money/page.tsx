import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Dynamically import the client component (SSR enabled by default in Next.js 15)
const MoneyDonationFormWrapper = dynamic(
  () => import('@/components/forms/donation/MoneyDonationFormWrapper')
);

export const metadata: Metadata = {
  title: 'Donate Money | New Steps Project',
  description: 'Make a financial donation to support the New Steps Project and help us provide sports shoes to young athletes in need.',
  openGraph: {
    title: 'Donate Money | New Steps Project',
    description: 'Support young athletes by making a financial donation to help us provide quality sports shoes.',
    images: ['/images/gpt-hero-image.png'],
  },
};

export default function MoneyDonationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Support Through Financial Donations
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your financial support helps us purchase quality sports shoes, 
              cover operational costs, and expand our reach to more young athletes.
            </p>
          </div>
          
          <MoneyDonationFormWrapper />
        </div>
      </div>
    </div>
  );
} 
