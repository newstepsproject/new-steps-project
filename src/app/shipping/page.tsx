import { Metadata } from 'next';
import { SITE_CONFIG } from '@/constants/config';
import { Truck, MapPin, Clock, Package } from 'lucide-react';

export const metadata: Metadata = {
  title: `Shipping Information | ${SITE_CONFIG.name}`,
  description: 'Learn about our shipping and delivery options for donated sports shoes, including Bay Area pickup and nationwide shipping.',
};

export const dynamic = 'force-dynamic';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Shipping & Delivery Information</h1>
          
          <p className="text-gray-600 mb-8">
            Learn about our shipping options, delivery times, and pickup services for both shoe donations and requests.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* For Shoe Requesters */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <Package className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">For Shoe Requesters</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Bay Area Residents (Free)</h3>
                  <p className="text-gray-600 text-sm">
                    Free pickup or drop-off available throughout the San Francisco Bay Area. 
                    We'll coordinate convenient pickup locations or arrange delivery.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Outside Bay Area ($5 Shipping)</h3>
                  <p className="text-gray-600 text-sm">
                    $5 shipping fee to help cover packaging and delivery costs. 
                    Payment processed securely through PayPal or Venmo.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Delivery Time</h3>
                  <p className="text-gray-600 text-sm">
                    1-2 weeks processing time, plus 3-5 business days for shipping. 
                    You'll receive tracking information once your package is sent.
                  </p>
                </div>
              </div>
            </div>

            {/* For Donors */}
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <Truck className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">For Donors</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Bay Area Pickup (Free)</h3>
                  <p className="text-gray-600 text-sm">
                    We'll arrange convenient pickup of your donated shoes at no cost. 
                    Flexible scheduling to work with your availability.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Ship to Us</h3>
                  <p className="text-gray-600 text-sm">
                    We'll provide a prepaid shipping label and address for you to send your donations. 
                    Just pack securely and drop off at any post office.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Drop-off Locations</h3>
                  <p className="text-gray-600 text-sm">
                    Select community drop-off points available in the Bay Area. 
                    Contact us for current locations and hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="space-y-8">
            <section>
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Bay Area Coverage</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Our free pickup and delivery service covers the entire San Francisco Bay Area, including:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">San Francisco County</h3>
                  <p className="text-sm text-gray-600">San Francisco and surrounding areas</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Alameda County</h3>
                  <p className="text-sm text-gray-600">Oakland, Berkeley, Fremont, and more</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Santa Clara County</h3>
                  <p className="text-sm text-gray-600">San Jose, Palo Alto, Mountain View, and more</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">San Mateo County</h3>
                  <p className="text-sm text-gray-600">Daly City, San Mateo, Redwood City, and more</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Contra Costa County</h3>
                  <p className="text-sm text-gray-600">Concord, Richmond, Walnut Creek, and more</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Marin County</h3>
                  <p className="text-sm text-gray-600">San Rafael, Novato, Mill Valley, and more</p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Processing & Delivery Times</h2>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Shoe Requests</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Request review: 1-2 business days</li>
                      <li>• Shoe matching: 3-5 business days</li>
                      <li>• Bay Area delivery: 1-2 business days</li>
                      <li>• Nationwide shipping: 3-5 business days</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Donations</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Pickup scheduling: 1-2 business days</li>
                      <li>• Bay Area pickup: Within 1 week</li>
                      <li>• Shipping label: Sent within 24 hours</li>
                      <li>• Processing after receipt: 2-3 business days</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Packaging Guidelines</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">For Donors</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Clean shoes before packing</li>
                    <li>• Use sturdy boxes or bags</li>
                    <li>• Include any original boxes if available</li>
                    <li>• Separate different sizes/types</li>
                    <li>• Include donation form if shipping</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Our Shipping to You</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Shoes cleaned and inspected</li>
                    <li>• Secure packaging with protective materials</li>
                    <li>• Tracking information provided</li>
                    <li>• Eco-friendly packaging when possible</li>
                    <li>• Care instructions included</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact for Shipping Questions</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-gray-600 mb-4">
                  Have questions about shipping, pickup, or delivery? We're here to help!
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700"><strong>Email:</strong> newstepsfit@gmail.com</p>
                    <p className="text-gray-700"><strong>Subject Line:</strong> "Shipping Question"</p>
                  </div>
                  <div>
                    <p className="text-gray-700"><strong>Contact Form:</strong> <a href="/contact" className="text-brand hover:underline">Send us a message</a></p>
                    <p className="text-gray-700"><strong>Response Time:</strong> Within 24 hours</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}