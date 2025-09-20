import Link from 'next/link';
import { Mail, MapPin, Phone, Instagram, Twitter, Facebook, Heart, Youtube, Linkedin, Globe } from 'lucide-react';
import { SITE_CONFIG } from '@/constants/config';
import { getActiveSocialPlatforms, getAppSettings } from '@/lib/settings';

const Footer = async () => {
  const currentYear = new Date().getFullYear();
  const activeSocialPlatforms = await getActiveSocialPlatforms();
  const settings = await getAppSettings();
  
  // Helper function to get the appropriate icon for each platform
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return Instagram;
      case 'twitter':
        return Twitter;
      case 'facebook':
        return Facebook;
      case 'youtube':
        return Youtube;
      case 'linkedin':
        return Linkedin;
      case 'tiktok':
        return Globe; // TikTok icon not available in Lucide, using Globe
      default:
        return Globe;
    }
  };
  
  // Helper function to get platform display name
  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'Instagram';
      case 'twitter':
        return 'X (Twitter)';
      case 'facebook':
        return 'Facebook';
      case 'youtube':
        return 'YouTube';
      case 'linkedin':
        return 'LinkedIn';
      case 'tiktok':
        return 'TikTok';
      default:
        return platform.charAt(0).toUpperCase() + platform.slice(1);
    }
  };
  
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
            {activeSocialPlatforms.length > 0 && (
              <div className="flex space-x-5 mt-6">
                {activeSocialPlatforms.map(({ platform, url }) => {
                  const IconComponent = getSocialIcon(platform);
                  const platformName = getPlatformName(platform);
                  
                  return (
                    <a 
                      key={platform}
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-brand-500 text-gray-200 hover:text-white p-2.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                      aria-label={platformName}
                      title={platformName}
                    >
                      <IconComponent size={18} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 font-display text-white">Quick Links</h3>
            <nav className="flex flex-col space-y-2.5">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Home</Link>
              <Link href="/about" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">About Us</Link>
              <Link href="/donate" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Donate Shoes</Link>
              <Link href="/shoes" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Get Free Shoes</Link>
              <Link href="/get-involved" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Get Involved</Link>
              <Link href="/contact" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Contact</Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 font-display text-white">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-start group">
                <MapPin className="w-5 h-5 mr-3 text-brand-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 group-hover:text-white transition-colors">
                  {settings.officeAddress.street}<br />
                  {settings.officeAddress.city}, {settings.officeAddress.state} {settings.officeAddress.zipCode}
                </span>
              </div>
              <div className="flex items-center group">
                <Phone className="w-5 h-5 mr-3 text-brand-400 flex-shrink-0" />
                <a href={`tel:${settings.projectPhone}`} className="text-gray-300 group-hover:text-white transition-colors">{settings.projectPhone}</a>
              </div>
              <div className="flex items-center group">
                <Mail className="w-5 h-5 mr-3 text-brand-400 flex-shrink-0" />
                <a href={`mailto:${settings.projectEmail}`} className="text-gray-300 group-hover:text-white transition-colors">{settings.projectEmail}</a>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700">
              <p className="text-white font-medium">Founder & Director</p>
              <p className="text-gray-400">{settings.founderName}</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">&copy; {currentYear} {SITE_CONFIG.name}. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex items-center">
            <p className="text-gray-400 text-sm flex items-center">
                              Made with <Heart className="h-3 w-3 text-brand-400 mx-1 fill-brand-500" /> by young athletes
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