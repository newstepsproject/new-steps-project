import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Request Free Sports Shoes | Browse Athletic Footwear`,
  description: 'Browse our collection of donated sports shoes and request what you need at no cost. Quality athletic footwear for young athletes - basketball, running, soccer, tennis shoes and more.',
  keywords: 'free sports shoes, request athletic footwear, donated shoes, youth athletics, basketball shoes, running shoes, soccer cleats, tennis shoes',
  openGraph: {
    title: 'Request Free Sports Shoes | New Steps Project',
    description: 'Browse quality donated sports shoes and request what you need at no cost.',
    images: ['/images/shoe-collection.jpg'],
  },
};

export default function ShoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 