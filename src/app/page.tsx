import Image from 'next/image';
import { ResponsiveImage } from '@/components/ui/responsive-image';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, CreditCard, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/constants/config';
import { getAppSettings, getActiveSocialPlatforms } from '@/lib/settings';
import { Instagram, Twitter, Facebook, Youtube, Linkedin, Globe } from 'lucide-react';

export const metadata = {
  title: 'Give New Life to Old Kicks | Donate & Request Sports Shoes',
  description: 'Connect donated sports shoes with young athletes in need. Donate your gently used athletic footwear or request quality sports shoes at no cost. Join our mission to make sports accessible for everyone.',
  keywords: 'donate sports shoes, free athletic shoes, youth athletes, sports equipment donation, community sports support',
  openGraph: {
    title: 'New Steps Project | Give New Life to Old Kicks',
    description: 'Making sports accessible for everyone by connecting donated shoes with athletes in need.',
    images: ['/images/gpt-hero-image.png'],
  },
};

export default async function Home() {
  const settings = await getAppSettings();
  const activeSocialPlatforms = await getActiveSocialPlatforms();
  
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
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "New Steps Project",
            "description": "Connecting donated sports shoes with young athletes in need",
            "url": "https://newsteps.fit",
            "logo": "https://newsteps.fit/images/logo.png",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": settings.projectPhone,
              "contactType": "Customer Service",
              "email": settings.contactEmail
            },
            "address": {
              "@type": "PostalAddress",
              "streetAddress": settings.officeAddress.street,
              "addressLocality": settings.officeAddress.city,
              "addressRegion": settings.officeAddress.state,
              "postalCode": settings.officeAddress.zipCode,
              "addressCountry": settings.officeAddress.country === 'USA' ? 'US' : settings.officeAddress.country
            },
            "sameAs": activeSocialPlatforms.map(({ url }) => url),
            "foundingDate": "2023",
            "mission": "Making sports accessible for everyone by connecting donated sports shoes with athletes in need"
          })
        }}
      />
      <main className="flex-1 bg-gpt-bg font-sans">
      {/* Hero Section */}
      <section className="hero bg-gpt-bg py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            <div className="lg:w-1/2 text-center lg:text-left animate-fade-in">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gpt-text mb-4 font-display">
                Give New Life<br />
                to Old Kicks
              </h1>
              <p className="text-base md:text-lg text-gpt-text/80 mb-6 max-w-lg mx-auto lg:mx-0 font-body">
                Your cherished sports shoes can continue their journey 
                with young athletes who need them, returning to the courts, fields, and tracks where they belong.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button asChild size="lg" className="bg-gpt-primary hover:bg-gpt-primary/90 text-white rounded-full px-6 py-3 font-semibold transition-all duration-300 transform hover:scale-105">
                  <Link href="/donate/shoes">
                    Send Shoes Back to Action <Footprints className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-gpt-highlight text-gpt-highlight hover:bg-gpt-highlight hover:text-white rounded-full px-6 py-3 font-semibold transition-all duration-300">
                  <Link href="/shoes">
                    Find Your Perfect Pair <ShoppingBag className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2 relative animate-fade-in animate-delay-200 flex justify-center">
              <div className="relative h-[300px] md:h-[350px] lg:h-[400px] w-[70%] md:w-[65%] lg:w-[80%]">
                <ResponsiveImage 
                  src="/images/home_photo.png" 
                  alt="Athletes with sports shoes ready to step into their possibilities" 
                  fill
                  priority
                  sizes="(max-width: 768px) 70vw, 40vw"
                  className="object-contain hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gpt-text font-display">How It Works</h2>
            <p className="text-gpt-text/70 max-w-2xl mx-auto font-body">
              Your beloved sports shoes deserve to keep playing! Connect your cherished kicks with young athletes
              who will give them new life on the fields, courts, and tracks. Every pair has more games to play.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Step 1 - Shoes */}
            <div className="bg-white rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-gpt-primary/10 text-gpt-primary flex items-center justify-center mx-auto mb-4">
                <Footprints className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gpt-text font-display">Send Shoes Back to Action</h3>
              <p className="text-gpt-text/70 font-body">
                Your lovely sports shoes can return to the fields where they belong! Let your cherished kicks
                continue their athletic journey with young athletes who need quality footwear to pursue their dreams.
              </p>
              <Link href="/donate/shoes" className="text-gpt-primary font-semibold inline-flex items-center mt-4 hover:text-gpt-primary/80 transition-colors">
                Send shoes back to action <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Step 2 - Request */}
            <div className="bg-white rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-gpt-highlight/10 text-gpt-highlight flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gpt-text font-display">Request Shoes</h3>
              <p className="text-gpt-text/70 font-body">
                Find quality sports shoes that fit your needs. Browse our collection of donated athletic footwear 
                and request what you need - completely free with affordable shipping options.
              </p>
              <Link href="/shoes" className="text-gpt-highlight font-semibold inline-flex items-center mt-4 hover:text-gpt-highlight/80 transition-colors">
                Browse shoes <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Step 3 - Get Involved */}
            <div className="bg-white rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-gpt-secondary/10 text-gpt-secondary flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gpt-text font-display">Get Involved</h3>
              <p className="text-gpt-text/70 font-body">
                Join our community of supporters making sports accessible. Volunteer your time, 
                contribute financially, or help spread awareness about our mission to connect athletes with equipment.
              </p>
              <Link href="/get-involved" className="text-gpt-secondary font-semibold inline-flex items-center mt-4 hover:text-gpt-secondary/80 transition-colors">
                Get involved <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section - only show if there are active platforms */}
      {activeSocialPlatforms.length > 0 && (
        <section className="py-20 bg-gradient-to-r from-brand-600 to-brand-500 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-display">Follow Our Journey</h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8 font-body">
              Stay connected with us on social media to see the impact of your donations and 
              follow the stories of young athletes getting back in the game.
            </p>
            <div className="flex justify-center space-x-6 mb-8">
              {activeSocialPlatforms.map(({ platform, url }) => {
                const IconComponent = getSocialIcon(platform);
                const platformName = getPlatformName(platform);
                
                return (
                  <a 
                    key={platform}
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                    aria-label={platformName}
                    title={platformName}
                  >
                    <IconComponent size={24} />
                  </a>
                );
              })}
            </div>
            <p className="text-white/80 text-sm">
              Join thousands of supporters making sports accessible for everyone
            </p>
          </div>
        </section>
      )}
    </main>
    </>
  );
} 