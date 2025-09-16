import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { getAppSettings, getActiveProjectOfficers, getOurStoryTimeline } from '@/lib/settings';
import { ResponsiveImage } from '@/components/ui/responsive-image';

export const metadata = {
  title: 'About Us | Our Mission to Connect Athletes with Sports Shoes',
  description: 'Discover how New Steps Project started and our mission to make sports accessible for everyone by connecting donated athletic footwear with young athletes in need. Meet our team and learn our story.',
  keywords: 'about new steps project, sports shoe donation mission, youth athletics support, community sports program, athletic equipment sharing',
  openGraph: {
    title: 'About New Steps Project | Making Sports Accessible',
    description: 'Learn about our mission to connect donated sports shoes with young athletes in need.',
    images: ['/images/aboutus.png'],
  },
};

export default async function AboutPage() {
  // Fetch dynamic settings from database
  const settings = await getAppSettings();
  const activeOfficers = await getActiveProjectOfficers();
  const ourStoryTimeline = await getOurStoryTimeline();
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">About New Steps</h1>
          <p className="text-xl max-w-3xl mx-auto text-gray-700 animate-fade-in animate-delay-100">
            We're on a mission to make sports accessible for everyone by connecting 
            gently used sports shoes with athletes who need them.
          </p>
        </div>
      </section>

      {/* Our Mission */}
      <section className="content-section bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 animate-fade-in">
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden shadow-card" style={{ position: 'relative' }}>
                <ResponsiveImage 
                  src="/images/aboutus.png" 
                  alt="About New Steps Project - Our mission to connect athletes with quality sports shoes" 
                  fill
                  className="object-cover hover:scale-[1.02] transition-transform duration-500 ease-out"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className="md:w-1/2 animate-slide-up animate-delay-100">
              <h2 className="text-3xl font-bold mb-6 font-display">Our Mission</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mt-1 bg-brand-100 rounded-full p-1 mr-3 text-brand">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-gray-700">
                    <strong className="text-gray-900">Returning Dreams to Action:</strong> We want your beloved shoes to return to the fields and tracks where they can continue to fuel new dreams and aspirations, giving them purpose beyond their original journey.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 bg-brand-100 rounded-full p-1 mr-3 text-brand">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-gray-700">
                    <strong className="text-gray-900">Empowering Athletes:</strong> We believe that every athlete deserves the right equipment to pursue their passion, regardless of financial circumstances.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 bg-brand-100 rounded-full p-1 mr-3 text-brand">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-gray-700">
                    <strong className="text-gray-900">Promoting Sustainability:</strong> By giving gently used sports shoes a second life, we're reducing waste and environmental impact.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 bg-brand-100 rounded-full p-1 mr-3 text-brand">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-gray-700">
                    <strong className="text-gray-900">Building Community:</strong> We're creating connections between donors and recipients, fostering a community of support and shared values.
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <Button asChild className="btn-primary shadow-soft">
                  <Link href="/get-involved">Join Our Mission</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-gray-50 bg-texture-dots">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center font-display">Our Story</h2>
          <div className="max-w-3xl mx-auto">
            {ourStoryTimeline.map((item, index) => (
              <div 
                key={item.id} 
                className={`relative pl-10 ${index < ourStoryTimeline.length - 1 ? 'pb-12' : ''} animate-fade-in animate-delay-${100 + (index * 100)}`}
              >
                {/* Timeline line - only show if not the last item */}
                {index < ourStoryTimeline.length - 1 && (
                  <div className="absolute top-0 bottom-0 left-3 w-1 bg-gradient-to-b from-brand-400 to-brand-600"></div>
                )}
                
                <div className="absolute w-7 h-7 bg-white rounded-full border-2 border-brand shadow-soft left-0 flex items-center justify-center">
                  <span className="text-brand font-bold text-sm">{index + 1}</span>
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-700 mb-6">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="content-section bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center font-display">Meet Our Team</h2>
          {activeOfficers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeOfficers.map((officer, index) => (
                <div 
                  key={officer.id} 
                  className={`bg-white rounded-xl shadow-soft p-6 text-center card-highlight animate-fade-in ${
                    index === 0 ? 'animate-delay-100' : 
                    index === 1 ? 'animate-delay-200' : 
                    'animate-delay-300'
                  } ${
                    activeOfficers.length === 3 && index === 2 ? 
                    'lg:col-span-1 md:col-span-2 md:max-w-md md:mx-auto' : ''
                  }`}
                >
                  <div className="relative w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white shadow-soft">
                    {officer.photo ? (
                      <Image 
                        src={`/images/team/${officer.photo}`}
                        alt={officer.name} 
                        width={160}
                        height={160}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-4xl font-bold">
                          {officer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold">{officer.name}</h3>
                  <p className="text-brand mb-3">{officer.role}</p>
                  <p className="text-gray-600 text-sm mb-3 font-medium">{officer.duty}</p>
                  <p className="text-gray-600 max-w-xs mx-auto text-sm">{officer.bio}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Our team information will be available soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-brand-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display">Join Our Mission</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Whether you're donating shoes, requesting them, or volunteering your time, 
            you're making a difference in your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white hover:bg-gray-100 text-brand hover:text-brand-600 border-white shadow-soft">
              <Link href="/donate">Send Your Shoes Back to Action</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white hover:bg-white/10 shadow-soft">
              <Link href="/get-involved">Get Involved</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
