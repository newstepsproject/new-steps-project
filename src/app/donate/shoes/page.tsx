import React from 'react';
import DonationForm from '@/components/forms/donation/DonationForm';
import { GiftIcon, TruckIcon, ShirtIcon, UsersIcon } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SITE_CONFIG } from '@/constants/config';

export const metadata: Metadata = {
  title: `Donate Sports Shoes | ${SITE_CONFIG.name}`,
  description: 'Donate your gently used sports shoes to athletes in need. We make it easy to give your shoes a second life.',
};

export default function DonateShoeePage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-offwhite to-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Donate Your Shoes</h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            Your gently used sports shoes can help someone take their next steps. Fill out the form below 
            to start the donation process.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 bg-white" id="donate-form">
        <div className="container mx-auto px-4">
          <DonationForm />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">What condition should the shoes be in?</h3>
              <p className="text-gray-600">
                We accept shoes in good, very good, or like new condition. The shoes should be clean and free from major 
                damage. Some signs of use are acceptable, but they should still be functional and have good support.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">How do I know if I'm in the Bay Area for pickup services?</h3>
              <p className="text-gray-600">
                Our pickup service is available throughout the San Francisco Bay Area, including San Francisco, Oakland, 
                San Jose, and surrounding cities. The form will automatically detect if your ZIP code is eligible for pickup.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Do I get a receipt for tax purposes?</h3>
              <p className="text-gray-600">
                Yes, we'll send you an email receipt that you can use for tax deduction purposes. New Steps Project 
                is a registered 501(c)(3) non-profit organization.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">What types of shoes do you accept?</h3>
              <p className="text-gray-600">
                We accept all types of athletic shoes including running, basketball, tennis, soccer, volleyball, 
                cross-training, and other sports-specific footwear. We don't accept dress shoes, high heels, sandals, or boots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Would you like to make a monetary donation as well?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Financial contributions help us cover shipping costs and operational expenses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="bg-white hover:bg-gray-100 text-blue-600" asChild>
              <Link href="/get-involved#money-donation">Donate Money</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700" asChild>
              <Link href="/get-involved">Get Involved</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
} 