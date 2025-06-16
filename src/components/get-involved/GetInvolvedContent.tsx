"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Heart, 
  Building2, 
  ArrowRight, 
  X,
  Clock,
  Target,
  Award
} from 'lucide-react';
import VolunteerForm from '@/components/forms/volunteer/VolunteerForm';
import MoneyDonationFormWrapper from '@/components/forms/donation/MoneyDonationFormWrapper';
import PartnershipForm from './PartnershipForm';

type ActiveForm = 'volunteer' | 'donate' | 'partner' | null;

const cards = [
  {
    id: 'volunteer',
    icon: Users,
    title: 'Become a Volunteer',
    description: 'Help us collect, sort, and distribute shoes to athletes in need',
    color: 'brand',
    gradient: 'from-brand to-brand-600',
    features: [
      { icon: Clock, text: 'Flexible scheduling' },
      { icon: Target, text: 'Direct community impact' },
      { icon: Award, text: 'Skill development opportunities' }
    ],
    details: [
      'Shoe collection and sorting events',
      'Community outreach coordination',
      'Digital platform support',
      'Athletic program partnerships'
    ]
  },
  {
    id: 'donate',
    icon: Heart,
    title: 'Financial Support',
    description: 'Help cover operational costs and expand our reach',
    color: 'energy',
    gradient: 'from-energy to-energy-600',
    features: [
      { icon: Heart, text: '100% tax-deductible' },
      { icon: Target, text: 'Direct family support' },
      { icon: Award, text: 'Transparent impact reporting' }
    ],
    details: [
      'Cover shipping costs for families',
      'Purchase cleaning supplies',
      'Support volunteer training',
      'Platform maintenance and growth'
    ]
  },
  {
    id: 'partner',
    icon: Building2,
    title: 'Become a Partner',
    description: 'Partner with us as an organization, school, or business',
    color: 'success',
    gradient: 'from-success to-success-600',
    features: [
      { icon: Building2, text: 'Organizational impact' },
      { icon: Users, text: 'Employee engagement' },
      { icon: Award, text: 'Community recognition' }
    ],
    details: [
      'Host shoe collection drives',
      'Connect athletes with resources',
      'Provide venue or logistics support',
      'Amplify our mission reach'
    ]
  }
];

export default function GetInvolvedContent() {
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);

  const openForm = (formType: ActiveForm) => {
    setActiveForm(formType);
  };

  const closeForm = () => {
    setActiveForm(null);
  };

  if (activeForm) {
    const activeCard = cards.find(card => card.id === activeForm);
    return (
      <div className="min-h-screen bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {activeCard && (
              <>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${activeCard.gradient} text-white`}>
                  <activeCard.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{activeCard.title}</h2>
                  <p className="text-gray-600">{activeCard.description}</p>
                </div>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeForm}
            className="hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeForm === 'volunteer' && <VolunteerForm />}
            {activeForm === 'donate' && <MoneyDonationFormWrapper />}
            {activeForm === 'partner' && <PartnershipForm />}
          </div>
          
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">How This Helps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  {activeCard?.details.map((detail, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className={`w-1.5 h-1.5 bg-${activeCard.color} rounded-full mt-2 flex-shrink-0`}></span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Key Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeCard?.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <feature.icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {cards.map((card) => (
        <Card 
          key={card.id}
          className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 bg-white/80 backdrop-blur-sm"
        >
          <CardHeader className="pb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className="w-8 h-8 text-white" />
            </div>
            <CardTitle className={`text-xl font-bold text-gray-900 group-hover:text-${card.color} transition-colors`}>
              {card.title}
            </CardTitle>
            <CardDescription className="text-gray-600 leading-relaxed">
              {card.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-4 mb-6">
              {card.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <feature.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{feature.text}</span>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={() => openForm(card.id as ActiveForm)}
              className={`w-full bg-gradient-to-r ${card.gradient} hover:opacity-90 transition-all duration-200 group-hover:shadow-lg`}
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 