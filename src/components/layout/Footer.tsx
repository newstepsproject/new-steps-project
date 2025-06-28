import Link from 'next/link';
import { Mail, MapPin, Phone, Instagram, Twitter, Facebook, Heart } from 'lucide-react';
import { SITE_CONFIG, CONTACT_INFO } from '@/constants/config';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gpt-text text-white">
      <div className="container mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About Section */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-4 font-display text-white">About New Steps</h3>
            <p className="mb-6 text-gray-300 max-w-md">
              {SITE_CONFIG.description}. We connect donated sports shoes with athletes in need, 
              helping everyone step forward into their best future.
            </p>
            <div className="flex space-x-5 mt-6">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gpt-primary text-gray-300 hover:text-white p-2.5 rounded-full transition-all duration-200"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gpt-primary text-gray-300 hover:text-white p-2.5 rounded-full transition-all duration-200"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gpt-primary text-gray-300 hover:text-white p-2.5 rounded-full transition-all duration-200"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 font-display text-white">Quick Links</h3>
            <nav className="flex flex-col space-y-2.5">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Home</Link>
              <Link href="/about" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">About Us</Link>
              <Link href="/donate" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Donate Shoes</Link>
              <Link href="/shoes" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Request Shoes</Link>
              <Link href="/get-involved" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Get Involved</Link>
              <Link href="/contact" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Contact</Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 font-display text-white">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-start group">
                <MapPin className="w-5 h-5 mr-3 text-gpt-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 group-hover:text-white transition-colors">{CONTACT_INFO.address}</span>
              </div>
              <div className="flex items-center group">
                <Phone className="w-5 h-5 mr-3 text-gpt-primary flex-shrink-0" />
                <a href={`tel:${CONTACT_INFO.phone}`} className="text-gray-300 group-hover:text-white transition-colors">{CONTACT_INFO.phone}</a>
              </div>
              <div className="flex items-center group">
                <Mail className="w-5 h-5 mr-3 text-gpt-primary flex-shrink-0" />
                <a href={`mailto:${CONTACT_INFO.email}`} className="text-gray-300 group-hover:text-white transition-colors">{CONTACT_INFO.email}</a>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700">
              <p className="text-white font-medium">Manager</p>
              <p className="text-gray-400">{CONTACT_INFO.managerName}</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">&copy; {currentYear} {SITE_CONFIG.name}. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex items-center">
            <p className="text-gray-400 text-sm flex items-center">
                              Made with <Heart className="h-3 w-3 text-gpt-primary mx-1 fill-gpt-primary" /> by young athletes
            </p>
          </div>
        </div>
        
        {/* Legal Links */}
        <div className="flex justify-center mt-6 space-x-6 text-xs text-gray-500">
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
          <Link href="/faq" className="hover:text-gray-300 transition-colors">FAQ</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 