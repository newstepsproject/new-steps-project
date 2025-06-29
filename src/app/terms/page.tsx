import { Metadata } from 'next';
import { SITE_CONFIG } from '@/constants/config';

export const metadata: Metadata = {
  title: `Terms of Service | ${SITE_CONFIG.name}`,
  description: 'Terms of Service for New Steps Project - Learn about the terms and conditions for using our sports shoe donation platform.',
};

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            <p><strong>Effective Date:</strong> January 28, 2025</p>
            <p><strong>Last Updated:</strong> January 28, 2025</p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using the New Steps Project website and services, you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. About New Steps Project</h2>
              <p className="text-gray-700 mb-4">
                New Steps Project is a nonprofit organization dedicated to connecting young athletes with quality sports shoes through donations. 
                We facilitate the donation and distribution of athletic footwear to support youth sports participation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Eligibility and Age Requirements</h2>
              <p className="text-gray-700 mb-4">
                <strong>For Shoe Requesters:</strong> Our services are primarily designed for young athletes and their families. 
                Users under 18 must have parental or guardian consent to use our services.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>For Donors and Volunteers:</strong> You must be at least 13 years old to use our platform. 
                Users under 18 should have parental guidance when participating in donation or volunteer activities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Responsibilities</h2>
              <p className="text-gray-700 mb-4">
                Users agree to provide accurate information, use donated shoes for their intended athletic purpose, 
                limit requests to reasonable quantities, and respect the donation process and volunteer time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Prohibited Activities</h2>
              <p className="text-gray-700 mb-2">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Provide false or misleading information</li>
                <li>Use our services for commercial resale of donated items</li>
                <li>Make excessive or unreasonable requests for shoes</li>
                <li>Harass, abuse, or discriminate against other users or volunteers</li>
                <li>Use our platform for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Donations and Requests</h2>
              <p className="text-gray-700 mb-4">
                <strong>No Guarantee:</strong> While we strive to match requests with available donations, 
                we cannot guarantee that all shoe requests will be fulfilled.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Shipping and Handling:</strong> Shipping fees may apply for shoe requests outside our local area. 
                These fees help cover the cost of packaging and delivery.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a> 
                to understand how we collect, use, and protect your personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>New Steps Project</strong></p>
                <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:newsteps.project@gmail.com" className="text-brand hover:underline">newsteps.project@gmail.com</a></p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              By using New Steps Project services, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}