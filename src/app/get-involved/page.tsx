import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SITE_CONFIG } from '@/constants/config';
import GetInvolvedContent from '@/components/get-involved/GetInvolvedContent';

export const metadata: Metadata = {
  title: 'Get Involved | New Steps',
  description: 'Join our mission to connect donated sports shoes with athletes in need. Volunteer, donate, or partner with us.',
};

export default function GetInvolvedPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-energy-50">
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 lg:py-20 bg-gradient-to-br from-offwhite-300 to-white overflow-hidden">
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              Get Involved
            </h1>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Join our mission to connect donated sports shoes with athletes in need. 
              Every contribution makes a difference in a young athlete's journey.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-brand rounded-full"></span>
                <span>Community Impact</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-energy rounded-full"></span>
                <span>Youth Empowerment</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-success rounded-full"></span>
                <span>Sustainable Giving</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Three Ways to Make an Impact
              </h2>
              <p className="text-base text-gray-600 max-w-2xl mx-auto">
                Whether you have time, resources, or connections, there's a perfect way 
                for you to contribute to our community.
              </p>
            </div>

            <GetInvolvedContent />
          </div>
        </div>
      </section>

      {/* Impact Stats Section */}
      <section className="py-16 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
              Our Growing Impact
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-brand mb-2">500+</div>
                <div className="text-gray-600">Shoes Donated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-energy mb-2">50+</div>
                <div className="text-gray-600">Volunteers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-2">25+</div>
                <div className="text-gray-600">Partner Organizations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-brand-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display">Ready to Get Involved?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Every contribution makes a difference. Choose how you'd like to support young athletes 
            in your community and help make sports accessible for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-energy-600 hover:bg-energy-700 text-white focus-visible:ring-energy-300 shadow-soft">
              <Link href="/donate">Donate Shoes</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white hover:bg-white/10 shadow-soft">
              <Link href="/volunteer">Volunteer With Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
