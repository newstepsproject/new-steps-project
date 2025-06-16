import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Gift, ShoppingBag, Heart, Star, Users, School, Calendar, CreditCard, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/constants/config';

export const metadata = {
  title: 'New Steps | Give Your Shoes a New Purpose',
  description: 'Donate your gently used sports shoes to athletes in need, or request shoes to take your next steps forward.',
};

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="hero">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-12 mb-12 lg:mb-0 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-6">
              Give Your Shoes a <span className="text-brand">New Purpose</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-xl">
              Donate your gently used sports shoes to athletes in need, or request shoes
              to take your next steps forward. Together, we can make sports accessible for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="btn-primary shadow-soft">
                  <Link href="/donate/shoes">
                    Donate Shoes <Footprints className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white border-energy text-energy hover:bg-energy-50">
                  <Link href="/get-involved#money-donation">
                    Donate Money <CreditCard className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <Button asChild variant="outline" size="lg" className="btn-outline">
                <Link href="/shoes">
                  Request Shoes <ShoppingBag className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="lg:w-1/2 relative animate-fade-in animate-delay-200">
            <div className="relative h-[350px] md:h-[450px] lg:h-[550px] w-full rounded-xl overflow-hidden shadow-card">
              <Image 
                src="/images/unsplash-colorful-sports-shoes.jpg" 
                alt="Collection of colorful sports shoes arranged in flat lay style" 
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-lg shadow-card animate-slide-up animate-delay-300 hidden md:block">
              <p className="text-sm font-medium text-gray-900">Over 500+ shoes donated</p>
              <div className="flex -space-x-2 mt-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-r from-brand-300 to-brand-400 border-2 border-white flex items-center justify-center text-xs font-bold text-white">
                    {i + 1}
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 border-2 border-white flex items-center justify-center text-xs font-bold text-white">
                  +
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="content-section bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our mission is simple: connect donated sports shoes with those who need them.
              Here's how you can be part of the journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Step 1 - Shoes */}
            <div className="bg-gray-50 rounded-xl p-8 text-center card-highlight animate-slide-up animate-delay-100">
              <div className="w-16 h-16 rounded-full bg-brand-100 text-brand flex items-center justify-center mx-auto mb-4">
                <Footprints className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Donate Your Shoes</h3>
              <p className="text-gray-600">
                Fill out our simple form to donate your gently used sports shoes.
                Schedule a pickup or drop them off at our location.
              </p>
              <Link href="/donate/shoes" className="text-brand font-medium inline-flex items-center mt-4 hover:text-brand-700 transition-colors">
                Donate shoes <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Step 1B - Money */}
            <div className="bg-gray-50 rounded-xl p-8 text-center card-highlight animate-slide-up animate-delay-150">
              <div className="w-16 h-16 rounded-full bg-energy-100 text-energy flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Donate Money</h3>
              <p className="text-gray-600">
                Support our mission with a financial contribution. Your donation helps
                cover operational costs and shipping for families in need.
              </p>
              <Link href="/get-involved#money-donation" className="text-energy font-medium inline-flex items-center mt-4 hover:text-energy-700 transition-colors">
                Donate money <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-50 rounded-xl p-8 text-center card-highlight animate-slide-up animate-delay-200">
              <div className="w-16 h-16 rounded-full bg-brand-100 text-brand flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Request Shoes</h3>
              <p className="text-gray-600">
                Browse available shoes, select the ones you need, and
                request them with free or low-cost shipping options.
              </p>
              <Link href="/shoes" className="text-brand font-medium inline-flex items-center mt-4 hover:text-brand-700 transition-colors">
                Browse shoes <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Community Image */}
          <div className="rounded-xl overflow-hidden shadow-lg mb-12 animate-fade-in">
            <div className="relative h-[300px] md:h-[400px] w-full">
              <Image 
                src="/images/unsplash-friends-running-workout.jpg" 
                alt="Friends running together during workout in park - diverse community staying active" 
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 bg-gradient-to-r from-brand-600 to-brand-500 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in animate-delay-100">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8" />
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-bold mb-2">500+</p>
              <p className="text-lg">Shoes Donated</p>
            </div>
            <div className="animate-fade-in animate-delay-200">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="h-8 w-8" />
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-bold mb-2">350+</p>
              <p className="text-lg">Athletes Helped</p>
            </div>
            <div className="animate-fade-in animate-delay-300">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <School className="h-8 w-8" />
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-bold mb-2">20+</p>
              <p className="text-lg">Schools Served</p>
            </div>
            <div className="animate-fade-in animate-delay-400">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Calendar className="h-8 w-8" />
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-bold mb-2">40+</p>
              <p className="text-lg">Volunteers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Shoes */}
      <section className="content-section bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Featured Shoes</h2>
            <Link 
              href="/shoes" 
              className="text-brand font-medium inline-flex items-center hover:text-brand-700 transition-colors"
            >
              View all shoes <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Shoe 1 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-soft card-highlight">
              <div className="relative h-56 bg-gray-200">
                <Image 
                  src="/images/red-nike-shoes.jpg"
                  alt="Red Nike running shoes"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 right-3 bg-brand text-white text-xs font-bold px-2 py-1 rounded-md">
                  Running
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-energy fill-energy" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Like New</span>
                </div>
                <h3 className="font-bold text-lg">Nike Zoom Pegasus</h3>
                <p className="text-gray-600 text-sm mb-2">Size: 9.5, Men's</p>
                <p className="text-gray-600 text-sm mb-4">Brand: Nike</p>
                <Button asChild size="sm" className="w-full btn-primary">
                  <Link href={`/shoes/1`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>

            {/* Shoe 2 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-soft card-highlight">
              <div className="relative h-56 bg-gray-200">
                <Image 
                  src="/images/basketball-shoes.jpg"
                  alt="Basketball shoes on court"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 right-3 bg-energy text-white text-xs font-bold px-2 py-1 rounded-md">
                  Basketball
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-energy fill-energy" />
                    ))}
                    <Star className="h-4 w-4 text-gray-300" />
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Good</span>
                </div>
                <h3 className="font-bold text-lg">Adidas Harden Vol.5</h3>
                <p className="text-gray-600 text-sm mb-2">Size: A10, Men's</p>
                <p className="text-gray-600 text-sm mb-4">Brand: Adidas</p>
                <Button asChild size="sm" className="w-full btn-primary">
                  <Link href={`/shoes/2`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>

            {/* Shoe 3 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-soft card-highlight">
              <div className="relative h-56 bg-gray-200">
                <Image 
                  src="/images/nike-running-shoes.jpg"
                  alt="Nike running shoes"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 right-3 bg-success text-white text-xs font-bold px-2 py-1 rounded-md">
                  Soccer
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-energy fill-energy" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Like New</span>
                </div>
                <h3 className="font-bold text-lg">Nike Mercurial</h3>
                <p className="text-gray-600 text-sm mb-2">Size: 8, Women's</p>
                <p className="text-gray-600 text-sm mb-4">Brand: Nike</p>
                <Button asChild size="sm" className="w-full btn-primary">
                  <Link href={`/shoes/3`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>

            {/* Shoe 4 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-soft card-highlight">
              <div className="relative h-56 bg-gray-200">
                <Image 
                  src="/images/tennis-shoes.jpg"
                  alt="Tennis shoes on court"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 right-3 bg-brand text-white text-xs font-bold px-2 py-1 rounded-md">
                  Tennis
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-energy fill-energy" />
                    ))}
                    <Star className="h-4 w-4 text-gray-300" />
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Very Good</span>
                </div>
                <h3 className="font-bold text-lg">Asics Gel Resolution</h3>
                <p className="text-gray-600 text-sm mb-2">Size: 7.5, Women's</p>
                <p className="text-gray-600 text-sm mb-4">Brand: Asics</p>
                <Button asChild size="sm" className="w-full btn-primary">
                  <Link href={`/shoes/4`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50 bg-texture-dots">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Join our community of donors and recipients to help make sports accessible for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="btn-primary shadow-soft">
              <Link href="/donate/shoes">
                Donate Shoes <Footprints className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-energy text-white hover:bg-energy-600 shadow-soft">
              <Link href="/get-involved#money-donation">
                Donate Money <CreditCard className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="btn-energy bg-white text-energy hover:bg-energy hover:text-white border-energy">
              <Link href="/get-involved">
                Get Involved
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
} 