"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Dynamically import the money donation form
const MoneyDonationFormWrapper = dynamic(
  () => import('@/components/forms/donation/MoneyDonationFormWrapper'),
  { ssr: false }
);

export default function MoneyDonationSection() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {!showForm ? (
        <Button 
          className="w-full" 
          onClick={() => setShowForm(true)}
        >
          Donate Money
        </Button>
      ) : (
        <div className="mt-6">
          <div className="mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowForm(false)}
              className="mb-4"
            >
              ← Back
            </Button>
          </div>
          
          <MoneyDonationFormWrapper />
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-3">How Your Support Helps:</h4>
            <div className="grid gap-4">
              <div>
                <h5 className="font-medium text-gray-800">Direct Impact</h5>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  <li>Cover shipping costs for families in need</li>
                  <li>Purchase cleaning and packaging supplies</li>
                  <li>Support volunteer training programs</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-800">Program Growth</h5>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  <li>Expand to new communities</li>
                  <li>Improve digital platform</li>
                  <li>Enhance outreach initiatives</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 