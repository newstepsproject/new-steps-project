import { Metadata } from 'next';
import { SITE_CONFIG } from '@/constants/config';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: `Contact Us | ${SITE_CONFIG.name}`,
  description: 'Get in touch with the New Steps Project team. We\'re here to answer your questions about donating or requesting sports shoes.',
};

export default function ContactPage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="hero pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 animate-fade-in">Contact Us</h1>
            <p className="text-xl text-gray-700 animate-fade-in animate-delay-100">
              Have questions about donating shoes or getting involved? 
              We're here to help. Send us a message and we'll get back to you soon.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="animate-slide-up animate-delay-100">
              <h2 className="text-2xl font-bold mb-8 text-center font-display">Send Us a Message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
