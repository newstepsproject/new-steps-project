import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SITE_CONFIG } from '@/constants/config';
import { Footprints, ArrowRight, Heart, Recycle, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: `Donate Shoes | ${SITE_CONFIG.name}`,
  description: 'Donate your gently used sports shoes to help young athletes. Give your shoes a second life and support those in need.',
  keywords: 'donate shoes, sports shoes donation, athletic footwear, youth athletes, shoe donation',
};

export default function DonateShoesPage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-offwhite to-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Give Your Shoes a Second Life</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Transform unused sports shoes into opportunities for young athletes. 
            Your donation can help someone take their next steps toward their athletic dreams.
          </p>
          <Button size="lg" className="btn-brand shadow-lg" asChild>
            <Link href="/donate/shoes">
              Start Donating <Footprints className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Why Donate Shoes */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Donate Your Sports Shoes?</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-brand-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-brand" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Help Young Athletes</h3>
              <p className="text-gray-600">
                Give growing athletes access to proper sports footwear they might not otherwise afford, 
                helping them participate safely in sports and activities.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-energy-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Recycle className="h-8 w-8 text-energy" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Protect the Environment</h3>
              <p className="text-gray-600">
                Keep shoes out of landfills by giving them new purpose. Your donation promotes 
                sustainability and reduces environmental waste.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Build Community</h3>
              <p className="text-gray-600">
                Connect with your local community and support youth sports programs that 
                need quality equipment to help young athletes succeed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Shoe Donation Works</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-brand text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Fill Out Form</h3>
                <p className="text-sm text-gray-600">
                  Tell us about the shoes you want to donate and provide your contact information.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-brand text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">Get Confirmation</h3>
                <p className="text-sm text-gray-600">
                  Receive an email with pickup or shipping instructions based on your location.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-brand text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">Send or Schedule</h3>
                <p className="text-sm text-gray-600">
                  Bay Area: Schedule pickup. Other areas: Ship to our address with provided label.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-brand text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  4
                </div>
                <h3 className="font-semibold mb-2">Make Impact</h3>
                <p className="text-sm text-gray-600">
                  Your shoes find new homes with athletes who need them, completing the cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Accept */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Shoes Do We Accept?</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-xl font-semibold text-green-800 mb-4">✅ We Accept</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Running and jogging shoes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Basketball and tennis shoes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Soccer cleats and football cleats</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Baseball and softball cleats</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Cross-training and gym shoes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Track and field spikes</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="text-xl font-semibold text-red-800 mb-4">❌ We Don't Accept</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Dress shoes or formal footwear</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>High heels or fashion shoes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Sandals, flip-flops, or slides</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Boots (work, hiking, or casual)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Severely damaged or worn shoes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Shoes with missing soles or holes</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Condition Guidelines</h3>
              <p className="text-blue-700">
                We accept shoes in "Good" to "Like New" condition. Shoes should be clean, 
                have functional soles, and show minimal wear. If you're unsure about your 
                shoes' condition, feel free to submit the donation form and we'll help assess.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Your donated shoes can help young athletes achieve their dreams. 
            Start the donation process today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="bg-white hover:bg-gray-100 text-brand border-white" asChild>
              <Link href="/donate/shoes">Donate Shoes Now</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-brand-700" asChild>
              <Link href="/get-involved">Other Ways to Help</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
