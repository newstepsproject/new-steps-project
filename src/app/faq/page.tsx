import { Metadata } from 'next';
import { SITE_CONFIG } from '@/constants/config';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const metadata: Metadata = {
  title: `FAQ | ${SITE_CONFIG.name}`,
  description: 'Frequently Asked Questions about New Steps Project - Learn about our sports shoe donation process, eligibility, and more.',
};

export const dynamic = 'force-dynamic';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h1>
          
          <p className="text-gray-600 mb-8">
            Find answers to common questions about New Steps Project, our donation process, and how we help young athletes.
          </p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Who can request shoes from New Steps Project?</AccordionTrigger>
              <AccordionContent>
                Our services are primarily designed for young athletes and their families who need quality sports shoes. 
                We focus on helping youth participate in sports regardless of their financial situation. 
                Users under 18 should have parental or guardian consent when requesting shoes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>What types of shoes do you accept as donations?</AccordionTrigger>
              <AccordionContent>
                We accept all types of athletic shoes including running, basketball, tennis, soccer, volleyball, 
                cross-training, and other sports-specific footwear. Shoes should be in fair to like new condition - 
                shoes that are useful are good enough. We do not accept dress shoes, high heels, sandals, or boots.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>How many pairs of shoes can I request?</AccordionTrigger>
              <AccordionContent>
                To ensure fair distribution and help as many athletes as possible, we typically limit requests to 1-2 pairs per person. 
                This helps us serve more members of our community and ensures everyone gets the shoes they need.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Is there a cost for requesting shoes?</AccordionTrigger>
              <AccordionContent>
                The shoes themselves are completely free! However, if you live outside the Bay Area, 
                there may be a small shipping fee (typically $5) to help cover packaging and delivery costs. 
                Bay Area residents can often arrange for free pickup or drop-off.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>How long does it take to receive shoes after requesting?</AccordionTrigger>
              <AccordionContent>
                Processing times vary depending on availability and your location. Typically, requests are processed within 1-2 weeks. 
                We'll email you updates on your request status, and you'll receive tracking information once your shoes are shipped.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>What condition should donated shoes be in?</AccordionTrigger>
              <AccordionContent>
                Donated shoes should be in fair to like new condition. Shoes that are useful are good enough - they should be clean, functional, 
                and have reasonable support remaining. Some signs of use are acceptable, but they should still be suitable for athletic activities. 
                We reserve the right to decline donations that don't meet our quality standards.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>How do I donate shoes?</AccordionTrigger>
              <AccordionContent>
                You can donate shoes by filling out our donation form on the website. If you're in the Bay Area, 
                we can arrange pickup or you can drop them off at designated locations. For donors outside the Bay Area, 
                we'll provide shipping instructions. All donations are tax-deductible.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>Can I volunteer with New Steps Project?</AccordionTrigger>
              <AccordionContent>
                Absolutely! We welcome volunteers of all ages (with parental consent for those under 18). 
                Volunteer opportunities include sorting donations, helping with pickup and delivery, 
                community outreach, and administrative support. Visit our volunteer page to apply.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger>Are you a registered nonprofit organization?</AccordionTrigger>
              <AccordionContent>
                Yes, New Steps Project is a registered 501(c)(3) nonprofit organization. 
                All donations are tax-deductible, and we can provide receipts for your records.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10">
              <AccordionTrigger>What if the shoes I receive don't fit?</AccordionTrigger>
              <AccordionContent>
                We do our best to match shoes to your size requirements, but if there are fit issues, 
                please contact us. While we can't guarantee exchanges due to limited inventory, 
                we'll work with you to find a solution when possible.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11">
              <AccordionTrigger>How can I support New Steps Project besides donating shoes?</AccordionTrigger>
              <AccordionContent>
                There are many ways to support our mission! You can make monetary donations to help with operational costs, 
                volunteer your time, spread awareness on social media, partner with us if you represent an organization, 
                or help us connect with schools and sports programs that could benefit from our services.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12">
              <AccordionTrigger>How do you ensure shoes go to those who need them most?</AccordionTrigger>
              <AccordionContent>
                We review all requests to ensure they align with our mission of helping young athletes. 
                We prioritize requests from families with demonstrated need and focus on youth sports participation. 
                Our goal is to remove financial barriers that prevent young people from participating in athletics.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Still have questions?</h2>
            <p className="text-gray-600 mb-4">
              If you can't find the answer you're looking for, please don't hesitate to contact us.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> newsteps.project@gmail.com</p>
              <p className="text-gray-700"><strong>Contact Form:</strong> <a href="/contact" className="text-brand hover:underline">Send us a message</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}