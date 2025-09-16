// src/app/intelligent-dashboard/page.tsx - Demo of the world-class tender SaaS
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Search,
  User,
  BarChart3,
  Lightbulb,
  Zap,
  Settings,
  Crown,
  Star
} from 'lucide-react';

import AdvancedDashboard from '@/components/Dashboard/AdvancedDashboard';
import IntelligentSearch from '@/components/Search/IntelligentSearch';
import TenderMatchingProfileComponent from '@/components/Profile/TenderMatchingProfile';
import { TenderMatchingProfile } from '@/lib/intelligent-matching';

const IntelligentDashboardPage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<TenderMatchingProfile | null>(null);
  const [activeDemo, setActiveDemo] = useState('dashboard');

  // Mock user profile for demo
  const mockUserProfile: TenderMatchingProfile = {
    id: 'demo_profile',
    userId: 'demo_user',
    companyName: 'TechCorp Solutions Pvt Ltd',
    businessCategories: ['Information Technology', 'Software Development'],
    capabilities: ['Web Development', 'Mobile Apps', 'Cloud Solutions', 'AI/ML', 'Database Design'],
    geographicalAreas: ['Telangana', 'Andhra Pradesh', 'Pan India'],
    budgetRange: { min: 500000, max: 50000000 },
    experienceYears: 8,
    pastProjects: [
      'Campus Management System for Engineering College',
      'E-commerce Platform for Retail Chain',
      'Mobile Banking App for Regional Bank',
      'AI-powered Analytics Dashboard for Healthcare'
    ],
    successRate: 75,
    preferredTenderTypes: ['Open Tender', 'Limited Tender', 'E-Reverse Auction'],
    blacklistedKeywords: ['military', 'weapons', 'tobacco'],
    minimumTenderValue: 100000,
    maximumTenderValue: 100000000,
    created_at: '2024-01-01',
    updated_at: '2024-01-15'
  };

  const handleProfileSave = (profile: TenderMatchingProfile) => {
    setUserProfile(profile);
    console.log('Profile saved:', profile);
    // In real app, save to database
  };

  const DemoCard = ({ 
    title, 
    description, 
    icon: Icon, 
    isActive, 
    onClick, 
    badge 
  }: {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    isActive: boolean;
    onClick: () => void;
    badge?: string;
  }) => (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
        isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg ${
            isActive 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className={`text-lg font-semibold ${
                isActive ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {title}
              </h3>
              {badge && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                  {badge}
                </Badge>
              )}
            </div>
            <p className={`text-sm ${
              isActive ? 'text-blue-700' : 'text-gray-600'
            }`}>
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Crown className="h-8 w-8" />
              <h1 className="text-4xl md:text-5xl font-bold">World-Class Tender SaaS</h1>
            </div>
            <p className="text-xl text-blue-100 mb-6">
              Experience the future of tender discovery with AI-powered intelligence
            </p>
            <div className="flex items-center justify-center space-x-8 text-blue-100">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI-Powered Matching</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Intelligent Analytics</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Predictive Insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        {/* Demo Navigation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Interactive Demo</h2>
            <p className="text-gray-600">Explore the advanced features that set us apart from competitors</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DemoCard
              title="Intelligence Dashboard"
              description="Real-time analytics with AI-powered insights, market intelligence, and predictive forecasting"
              icon={BarChart3}
              isActive={activeDemo === 'dashboard'}
              onClick={() => setActiveDemo('dashboard')}
              badge="AI Analytics"
            />
            
            <DemoCard
              title="Smart Search"
              description="Natural language processing search with intelligent filtering and personalized recommendations"
              icon={Search}
              isActive={activeDemo === 'search'}
              onClick={() => setActiveDemo('search')}
              badge="NLP Powered"
            />
            
            <DemoCard
              title="Profile Optimization"
              description="AI-optimized profile management for maximum tender matching accuracy and success rate"
              icon={User}
              isActive={activeDemo === 'profile'}
              onClick={() => setActiveDemo('profile')}
              badge="Smart Matching"
            />
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {activeDemo === 'dashboard' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Advanced Analytics Dashboard</h3>
                  <p className="text-gray-600">Enterprise-grade business intelligence for tender professionals</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Zap className="h-3 w-3 mr-1" />
                    Real-time Data
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Brain className="h-3 w-3 mr-1" />
                    AI Insights
                  </Badge>
                </div>
              </div>
              
              <AdvancedDashboard 
                userId="demo_user"
                userProfile={userProfile || mockUserProfile}
              />
            </div>
          )}

          {activeDemo === 'search' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Intelligent Search System</h3>
                  <p className="text-gray-600">AI-powered natural language search with advanced filtering</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Natural Language
                  </Badge>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <Target className="h-3 w-3 mr-1" />
                    Smart Matching
                  </Badge>
                </div>
              </div>
              
              <IntelligentSearch 
                userProfile={userProfile || mockUserProfile}
                onResults={(results) => console.log('Search results:', results)}
              />
            </div>
          )}

          {activeDemo === 'profile' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">AI-Optimized Profile Management</h3>
                  <p className="text-gray-600">Maximize your tender matching success with intelligent profile optimization</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Smart Recommendations
                  </Badge>
                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                    <Settings className="h-3 w-3 mr-1" />
                    Auto-Optimization
                  </Badge>
                </div>
              </div>
              
              <TenderMatchingProfileComponent 
                initialProfile={mockUserProfile}
                onSave={handleProfileSave}
              />
            </div>
          )}
        </div>

        {/* Features Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Brain className="h-6 w-6 mr-2" />
                AI-Powered Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800">
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-blue-600" />
                  Machine learning-based tender matching
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-blue-600" />
                  Natural language processing for search
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-blue-600" />
                  Predictive analytics for win probability
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-blue-600" />
                  Automated competitor analysis
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-900">
                <TrendingUp className="h-6 w-6 mr-2" />
                Advanced Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="text-purple-800">
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-purple-600" />
                  Real-time market intelligence
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-purple-600" />
                  Comprehensive performance tracking
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-purple-600" />
                  Seasonal trend analysis
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-purple-600" />
                  Custom KPI dashboards
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-center text-white mb-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Tender Process?</h2>
          <p className="text-xl text-green-100 mb-6">
            Join the future of intelligent tender discovery and win more opportunities
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-green-600">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentDashboardPage;