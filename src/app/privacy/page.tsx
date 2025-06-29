import { Metadata } from 'next';
import { SITE_CONFIG } from '@/constants/config';

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_CONFIG.name}`,
  description: 'Privacy Policy for New Steps Project - Learn how we protect your personal information when you donate or request sports shoes.',
};

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            <p><strong>Last Updated:</strong> January 28, 2025</p>
            <p><strong>Effective Date:</strong> January 28, 2025</p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                New Steps Project ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services to donate or request sports shoes. This policy applies to all users, including student athletes, donors, volunteers, and partners.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-3">Personal Information</h3>
              <p className="text-gray-700 mb-3">We may collect the following personal information:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                <li>Name, email address, and phone number</li>
                <li>Mailing address for shoe donations and requests</li>
                <li>School name, grade level, and sports interests (for student athletes)</li>
                <li>Payment information for monetary donations</li>
                <li>Volunteer interests and availability</li>
                <li>Partnership organization details</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-3">Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Device information (browser type, operating system)</li>
                <li>Usage data (pages visited, time spent on site)</li>
                <li>IP address and location information</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">We use your information to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Process shoe donation and request applications</li>
                <li>Coordinate pickup and delivery of donated shoes</li>
                <li>Send confirmation emails and status updates</li>
                <li>Manage volunteer applications and activities</li>
                <li>Process monetary donations and send receipts</li>
                <li>Communicate about partnership opportunities</li>
                <li>Improve our website and services</li>
                <li>Comply with legal requirements</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-3">We do not sell, trade, or rent your personal information. We may share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Service Providers:</strong> Third-party services that help us operate our platform (email delivery, payment processing)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                <li><strong>Consent:</strong> When you explicitly consent to sharing your information</li>
              </ul>
            </section>

            {/* Special Protections for Minors */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Special Protections for Minors</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 font-medium mb-2">Important Notice for Young Athletes</p>
                <p className="text-blue-700 text-sm">
                  If you are under 18 years old, please have a parent or guardian review this privacy policy with you before using our services.
                </p>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>We do not knowingly collect personal information from children under 13 without parental consent</li>
                <li>Student athletes under 18 should have parental/guardian approval before requesting shoes</li>
                <li>We take extra care to protect information from minor users</li>
                <li>Parents/guardians can contact us to review, update, or delete their child's information</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              <p className="text-gray-700 mb-3">We implement appropriate security measures to protect your information:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Encrypted data transmission (SSL/TLS)</li>
                <li>Secure database storage</li>
                <li>Limited access to personal information</li>
                <li>Regular security assessments</li>
                <li>Secure payment processing through trusted providers</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and personal information</li>
                <li>Opt-out of marketing communications</li>
                <li>Request information about how we use your data</li>
              </ul>
              <p className="text-gray-700 mt-3">
                To exercise these rights, please contact us at <a href="mailto:newsteps.project@gmail.com" className="text-brand hover:underline">newsteps.project@gmail.com</a>.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-3">We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Remember your preferences and login status</li>
                <li>Analyze website usage and performance</li>
                <li>Provide personalized content</li>
                <li>Enable social media features</li>
              </ul>
              <p className="text-gray-700 mt-3">
                You can control cookies through your browser settings, but some features may not work properly if cookies are disabled.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Third-Party Services</h2>
              <p className="text-gray-700 mb-3">Our website may use third-party services including:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>PayPal:</strong> For processing monetary donations</li>
                <li><strong>Google:</strong> For authentication and maps</li>
                <li><strong>Email Services:</strong> For sending confirmations and updates</li>
              </ul>
              <p className="text-gray-700 mt-3">
                These services have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Data Retention</h2>
              <p className="text-gray-700">
                We retain your personal information only as long as necessary to fulfill the purposes outlined in this privacy policy, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your account and personal information at any time.
              </p>
            </section>

            {/* Policy Updates */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Policy Updates</h2>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically. Continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-3">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700"><strong>New Steps Project</strong></p>
                <p className="text-gray-700">Email: <a href="mailto:newsteps.project@gmail.com" className="text-brand hover:underline">newsteps.project@gmail.com</a></p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              This privacy policy is designed to be clear and accessible to all users, including young athletes and their families. 
              We are committed to protecting your privacy while helping connect athletes with the sports shoes they need.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
