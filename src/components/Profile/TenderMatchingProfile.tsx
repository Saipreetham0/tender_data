// src/components/Profile/TenderMatchingProfile.tsx - Intelligent profile management
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Building2,
  MapPin,
  DollarSign,
  Star,
  Award,
  Target,
  Brain,
  Zap,
  Plus,
  X,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Settings,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Globe,
  FileText
} from 'lucide-react';
import { TenderMatchingProfile } from '@/lib/intelligent-matching';

interface TenderMatchingProfileProps {
  initialProfile?: Partial<TenderMatchingProfile>;
  onSave?: (profile: TenderMatchingProfile) => void;
  className?: string;
}

const TenderMatchingProfileComponent: React.FC<TenderMatchingProfileProps> = ({
  initialProfile,
  onSave,
  className = ""
}) => {
  const [profile, setProfile] = useState<Partial<TenderMatchingProfile>>({
    companyName: '',
    businessCategories: [],
    capabilities: [],
    geographicalAreas: [],
    budgetRange: { min: 0, max: 0 },
    experienceYears: 0,
    pastProjects: [],
    successRate: 0,
    preferredTenderTypes: [],
    blacklistedKeywords: [],
    minimumTenderValue: 0,
    maximumTenderValue: 0,
    ...initialProfile
  });

  const [completionScore, setCompletionScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [newCapability, setNewCapability] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Predefined options
  const categoryOptions = [
    'Information Technology',
    'Software Development',
    'Hardware & Networking',
    'Construction & Infrastructure',
    'Civil Engineering',
    'Electrical Works',
    'Supply & Procurement',
    'Equipment Supply',
    'Materials Supply',
    'Professional Services',
    'Consulting',
    'Maintenance Services',
    'Training & Education',
    'Healthcare Services',
    'Transportation',
    'Security Services',
    'Catering & Hospitality',
    'Printing & Publishing',
    'Environmental Services',
    'Research & Development'
  ];

  const locationOptions = [
    'Telangana',
    'Andhra Pradesh',
    'Hyderabad',
    'Nizamabad',
    'Basar',
    'Ongole',
    'Srikakulam',
    'RK Valley',
    'Nuzvidu',
    'Pan India',
    'South India',
    'National'
  ];

  const tenderTypeOptions = [
    'Open Tender',
    'Limited Tender',
    'Single Source',
    'Rate Contract',
    'Global Tender',
    'Emergency Procurement',
    'Framework Agreement',
    'Two Stage Bidding',
    'E-Reverse Auction'
  ];

  useEffect(() => {
    calculateCompletionScore();
    generateRecommendations();
  }, [profile]);

  const calculateCompletionScore = () => {
    let score = 0;
    const maxScore = 10;

    if (profile.companyName) score += 1;
    if (profile.businessCategories && profile.businessCategories.length > 0) score += 1.5;
    if (profile.capabilities && profile.capabilities.length > 0) score += 1.5;
    if (profile.geographicalAreas && profile.geographicalAreas.length > 0) score += 1;
    if (profile.budgetRange && profile.budgetRange.max > 0) score += 1;
    if (profile.experienceYears && profile.experienceYears > 0) score += 1;
    if (profile.pastProjects && profile.pastProjects.length > 0) score += 1;
    if (profile.successRate && profile.successRate > 0) score += 0.5;
    if (profile.preferredTenderTypes && profile.preferredTenderTypes.length > 0) score += 0.5;
    if (profile.minimumTenderValue && profile.minimumTenderValue > 0) score += 1;

    setCompletionScore((score / maxScore) * 100);
  };

  const generateRecommendations = () => {
    const recs: string[] = [];

    if (!profile.businessCategories || profile.businessCategories.length === 0) {
      recs.push('Add business categories to get better tender matches');
    }

    if (!profile.capabilities || profile.capabilities.length < 3) {
      recs.push('List at least 3 key capabilities to improve matching accuracy');
    }

    if (!profile.pastProjects || profile.pastProjects.length === 0) {
      recs.push('Add past projects to showcase your experience');
    }

    if (profile.budgetRange && profile.budgetRange.max === 0) {
      recs.push('Set your budget range to filter relevant opportunities');
    }

    if (!profile.geographicalAreas || profile.geographicalAreas.length === 0) {
      recs.push('Specify geographical coverage areas');
    }

    setRecommendations(recs);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const completeProfile: TenderMatchingProfile = {
        id: profile.id || `profile_${Date.now()}`,
        userId: profile.userId || 'current_user',
        companyName: profile.companyName || '',
        businessCategories: profile.businessCategories || [],
        capabilities: profile.capabilities || [],
        geographicalAreas: profile.geographicalAreas || [],
        budgetRange: profile.budgetRange || { min: 0, max: 0 },
        experienceYears: profile.experienceYears || 0,
        pastProjects: profile.pastProjects || [],
        successRate: profile.successRate || 0,
        preferredTenderTypes: profile.preferredTenderTypes || [],
        blacklistedKeywords: profile.blacklistedKeywords || [],
        minimumTenderValue: profile.minimumTenderValue || 0,
        maximumTenderValue: profile.maximumTenderValue,
        created_at: profile.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onSave?.(completeProfile);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const addItem = (field: keyof TenderMatchingProfile, value: string) => {
    if (!value.trim()) return;

    const currentArray = (profile[field] as string[]) || [];
    if (!currentArray.includes(value)) {
      setProfile({
        ...profile,
        [field]: [...currentArray, value]
      });
    }
  };

  const removeItem = (field: keyof TenderMatchingProfile, value: string) => {
    const currentArray = (profile[field] as string[]) || [];
    setProfile({
      ...profile,
      [field]: currentArray.filter(item => item !== value)
    });
  };

  const TabButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
    </button>
  );

  const SelectableChips = ({ 
    options, 
    selectedOptions, 
    onToggle, 
    label 
  }: { 
    options: string[]; 
    selectedOptions: string[]; 
    onToggle: (option: string) => void;
    label: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedOptions.includes(option)
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tender Matching Profile</h2>
            <p className="text-gray-600">Optimize your profile for AI-powered tender matching</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Profile Completion</p>
              <p className="text-2xl font-bold text-blue-600">{Math.round(completionScore)}%</p>
            </div>
            <div className="w-24">
              <Progress value={completionScore} className="h-3" />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white/60 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-900">Recommendations</span>
            </div>
            <div className="space-y-1">
              {recommendations.slice(0, 2).map((rec, index) => (
                <p key={index} className="text-sm text-gray-700">• {rec}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
        <TabButton id="basic" label="Basic Info" icon={User} />
        <TabButton id="business" label="Business Details" icon={Building2} />
        <TabButton id="experience" label="Experience" icon={Award} />
        <TabButton id="preferences" label="Preferences" icon={Settings} />
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <Input
                    type="text"
                    value={profile.companyName || ''}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    placeholder="Enter your company name"
                    className="w-full"
                  />
                </div>

                <SelectableChips
                  options={categoryOptions}
                  selectedOptions={profile.businessCategories || []}
                  onToggle={(option) => {
                    const current = profile.businessCategories || [];
                    if (current.includes(option)) {
                      setProfile({
                        ...profile,
                        businessCategories: current.filter(cat => cat !== option)
                      });
                    } else {
                      setProfile({
                        ...profile,
                        businessCategories: [...current, option]
                      });
                    }
                  }}
                  label="Business Categories *"
                />

                <SelectableChips
                  options={locationOptions}
                  selectedOptions={profile.geographicalAreas || []}
                  onToggle={(option) => {
                    const current = profile.geographicalAreas || [];
                    if (current.includes(option)) {
                      setProfile({
                        ...profile,
                        geographicalAreas: current.filter(area => area !== option)
                      });
                    } else {
                      setProfile({
                        ...profile,
                        geographicalAreas: [...current, option]
                      });
                    }
                  }}
                  label="Geographical Coverage"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Business Details Tab */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Capabilities & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Capabilities</label>
                  <div className="flex space-x-2 mb-3">
                    <Input
                      type="text"
                      value={newCapability}
                      onChange={(e) => setNewCapability(e.target.value)}
                      placeholder="Add a capability (e.g., Web Development)"
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addItem('capabilities', newCapability);
                          setNewCapability('');
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        addItem('capabilities', newCapability);
                        setNewCapability('');
                      }}
                      disabled={!newCapability.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(profile.capabilities || []).map((capability, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{capability}</span>
                        <button
                          onClick={() => removeItem('capabilities', capability)}
                          className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                    <Input
                      type="number"
                      value={profile.experienceYears || 0}
                      onChange={(e) => setProfile({ ...profile, experienceYears: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="50"
                      placeholder="Years"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Success Rate (%)</label>
                    <Input
                      type="number"
                      value={profile.successRate || 0}
                      onChange={(e) => setProfile({ ...profile, successRate: parseFloat(e.target.value) || 0 })}
                      min="0"
                      max="100"
                      placeholder="Win percentage"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Budget (₹)</label>
                    <Input
                      type="number"
                      value={profile.budgetRange?.min || 0}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        budgetRange: { 
                          ...profile.budgetRange || { min: 0, max: 0 }, 
                          min: parseInt(e.target.value) || 0 
                        }
                      })}
                      placeholder="Minimum tender value"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget (₹)</label>
                    <Input
                      type="number"
                      value={profile.budgetRange?.max || 0}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        budgetRange: { 
                          ...profile.budgetRange || { min: 0, max: 0 }, 
                          max: parseInt(e.target.value) || 0 
                        }
                      })}
                      placeholder="Maximum tender value"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Past Projects & Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notable Projects</label>
                  <div className="flex space-x-2 mb-3">
                    <Input
                      type="text"
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      placeholder="Describe a key project or achievement"
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addItem('pastProjects', newProject);
                          setNewProject('');
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        addItem('pastProjects', newProject);
                        setNewProject('');
                      }}
                      disabled={!newProject.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(profile.pastProjects || []).map((project, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                        <FileText className="h-4 w-4 text-gray-500 mt-1" />
                        <span className="flex-1 text-sm">{project}</span>
                        <button
                          onClick={() => removeItem('pastProjects', project)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <SelectableChips
                  options={tenderTypeOptions}
                  selectedOptions={profile.preferredTenderTypes || []}
                  onToggle={(option) => {
                    const current = profile.preferredTenderTypes || [];
                    if (current.includes(option)) {
                      setProfile({
                        ...profile,
                        preferredTenderTypes: current.filter(type => type !== option)
                      });
                    } else {
                      setProfile({
                        ...profile,
                        preferredTenderTypes: [...current, option]
                      });
                    }
                  }}
                  label="Preferred Tender Types"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Matching Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Tender Value (₹)</label>
                    <Input
                      type="number"
                      value={profile.minimumTenderValue || 0}
                      onChange={(e) => setProfile({ ...profile, minimumTenderValue: parseInt(e.target.value) || 0 })}
                      placeholder="Skip tenders below this value"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Tender Value (₹)</label>
                    <Input
                      type="number"
                      value={profile.maximumTenderValue || ''}
                      onChange={(e) => setProfile({ ...profile, maximumTenderValue: parseInt(e.target.value) || undefined })}
                      placeholder="Optional upper limit"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blacklisted Keywords</label>
                  <p className="text-sm text-gray-500 mb-3">Tenders containing these words will be automatically filtered out</p>
                  <div className="flex space-x-2 mb-3">
                    <Input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add keyword to blacklist (e.g., military, weapons)"
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addItem('blacklistedKeywords', newKeyword);
                          setNewKeyword('');
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        addItem('blacklistedKeywords', newKeyword);
                        setNewKeyword('');
                      }}
                      disabled={!newKeyword.trim()}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(profile.blacklistedKeywords || []).map((keyword, index) => (
                      <Badge key={index} variant="destructive" className="flex items-center space-x-1">
                        <span>{keyword}</span>
                        <button
                          onClick={() => removeItem('blacklistedKeywords', keyword)}
                          className="ml-1 hover:bg-red-600 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">AI Profile Analysis</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{Math.round(completionScore)}%</div>
                      <div className="text-gray-600">Completion</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(profile.businessCategories?.length || 0) + (profile.capabilities?.length || 0)}
                      </div>
                      <div className="text-gray-600">Skills & Categories</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {profile.budgetRange?.max ? Math.ceil((profile.budgetRange.max - (profile.budgetRange.min || 0)) / 1000000) : 0}Cr
                      </div>
                      <div className="text-gray-600">Budget Range</div>
                    </div>
                  </div>

                  {completionScore < 80 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          Complete your profile to get better AI recommendations!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button 
          onClick={handleSave}
          disabled={saving || !profile.companyName}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Profile
        </Button>
      </div>
    </div>
  );
};

export default TenderMatchingProfileComponent;