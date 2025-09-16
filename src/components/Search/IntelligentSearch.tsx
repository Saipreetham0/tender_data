// src/components/Search/IntelligentSearch.tsx - AI-powered intelligent search
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Brain,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
  Building2,
  AlertCircle,
  Star,
  Zap,
  ArrowRight,
  History,
  Bookmark,
  Download,
  ExternalLink,
  ChevronDown,
  X,
  Lightbulb
} from 'lucide-react';
import { intelligentTenderMatcher, TenderData, TenderScore } from '@/lib/intelligent-matching';

interface IntelligentSearchProps {
  onResults?: (results: SearchResult[]) => void;
  userProfile?: any;
  className?: string;
}

interface SearchResult {
  tender: TenderData;
  score?: TenderScore;
  relevanceScore: number;
  matchingReasons: string[];
  urgency: 'high' | 'medium' | 'low';
  competitionLevel: 'high' | 'medium' | 'low';
}

interface SearchFilters {
  category?: string[];
  budgetMin?: number;
  budgetMax?: number;
  location?: string[];
  closingDateRange?: {
    min: Date;
    max: Date;
  };
  source?: string[];
  urgency?: 'high' | 'medium' | 'low';
}

interface SearchSuggestion {
  query: string;
  type: 'recent' | 'popular' | 'smart';
  count?: number;
  icon?: React.ComponentType<any>;
}

const IntelligentSearch: React.FC<IntelligentSearchProps> = ({
  onResults,
  userProfile,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [smartRecommendations, setSmartRecommendations] = useState<string[]>([]);

  // Mock data - in real app, this would come from your API
  const mockTenders: TenderData[] = [
    {
      id: '1',
      name: 'Development of Campus Management System with AI Integration',
      description: 'Comprehensive software development project for modern campus management including student portal, faculty management, and AI-powered analytics dashboard.',
      source: 'RGUKT Basar',
      postedDate: '2024-01-15',
      closingDate: '2024-02-15',
      tenderValue: 5000000,
      category: 'IT',
      location: 'Telangana',
      requirements: ['Software Development', 'Database Design', 'UI/UX', 'AI/ML', 'Cloud Deployment'],
      keywords: ['software', 'development', 'AI', 'management', 'portal', 'analytics']
    },
    {
      id: '2',
      name: 'Construction of Modern Laboratory Building with Smart Infrastructure',
      description: 'Construction and setup of state-of-the-art laboratory facilities with IoT sensors, smart lighting, and automated climate control systems.',
      source: 'RGUKT Ongole',
      postedDate: '2024-01-20',
      closingDate: '2024-03-01',
      tenderValue: 15000000,
      category: 'Construction',
      location: 'Andhra Pradesh',
      requirements: ['Civil Construction', 'Electrical Work', 'Smart Systems', 'IoT Implementation'],
      keywords: ['construction', 'building', 'laboratory', 'smart', 'IoT', 'infrastructure']
    },
    {
      id: '3',
      name: 'Supply of Advanced Computing Equipment and Networking Hardware',
      description: 'Procurement of high-performance computers, servers, networking equipment, and peripheral devices for computer science department.',
      source: 'RGUKT RK Valley',
      postedDate: '2024-01-25',
      closingDate: '2024-02-28',
      tenderValue: 8000000,
      category: 'Supply',
      location: 'Andhra Pradesh',
      requirements: ['Hardware Supply', 'Installation', 'Warranty', 'Technical Support'],
      keywords: ['computers', 'servers', 'networking', 'hardware', 'equipment', 'technology']
    },
    {
      id: '4',
      name: 'Digital Library Management System Implementation',
      description: 'Implementation of comprehensive digital library management system with e-book integration, online catalog, and mobile app development.',
      source: 'RGUKT Srikakulam',
      postedDate: '2024-01-30',
      closingDate: '2024-03-15',
      tenderValue: 3500000,
      category: 'IT',
      location: 'Andhra Pradesh',
      requirements: ['Software Development', 'Database Management', 'Mobile App', 'Integration'],
      keywords: ['digital', 'library', 'management', 'software', 'mobile', 'app', 'books']
    },
    {
      id: '5',
      name: 'Renewable Energy Solutions for Campus Sustainability',
      description: 'Installation of solar power systems, wind turbines, and energy management solutions to achieve carbon neutrality for the campus.',
      source: 'RGUKT Nuzvidu',
      postedDate: '2024-02-01',
      closingDate: '2024-04-01',
      tenderValue: 25000000,
      category: 'Infrastructure',
      location: 'Andhra Pradesh',
      requirements: ['Solar Installation', 'Wind Energy', 'Energy Management', 'Grid Integration'],
      keywords: ['renewable', 'solar', 'energy', 'sustainability', 'green', 'environment']
    }
  ];

  const searchSuggestionsData: SearchSuggestion[] = [
    { query: 'software development', type: 'popular', count: 12, icon: Search },
    { query: 'construction projects', type: 'popular', count: 8, icon: Building2 },
    { query: 'IT infrastructure', type: 'recent', icon: History },
    { query: 'laboratory equipment', type: 'recent', icon: History },
    { query: 'AI and machine learning', type: 'smart', icon: Brain },
    { query: 'renewable energy solutions', type: 'smart', icon: Sparkles },
    { query: 'high-value opportunities (>₹1Cr)', type: 'smart', icon: DollarSign },
    { query: 'closing soon (next 7 days)', type: 'smart', icon: Clock }
  ];

  useEffect(() => {
    // Generate smart recommendations based on user profile
    if (userProfile) {
      const recommendations = generateSmartRecommendations(userProfile);
      setSmartRecommendations(recommendations);
    }
    
    setSearchSuggestions(searchSuggestionsData);
  }, [userProfile]);

  const generateSmartRecommendations = (profile: any): string[] => {
    const recommendations = [];
    
    if (profile?.businessCategories?.includes('IT')) {
      recommendations.push('software development projects under ₹50L');
      recommendations.push('AI and analytics opportunities');
    }
    
    if (profile?.budgetRange?.max > 10000000) {
      recommendations.push('high-value infrastructure projects');
    }
    
    recommendations.push('tenders closing in next 14 days');
    recommendations.push('opportunities with low competition');
    
    return recommendations.slice(0, 4);
  };

  // Natural Language Processing-like search
  const processNaturalLanguageQuery = (searchQuery: string): SearchFilters => {
    const query = searchQuery.toLowerCase();
    const extractedFilters: SearchFilters = {};

    // Extract budget information
    const budgetRegex = /(?:under|below|less than|<)\s*(?:rs\.?|₹)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:cr|crore|l|lakh|k|thousand)?/gi;
    const budgetMatches = query.match(budgetRegex);
    if (budgetMatches) {
      // Extract numeric value and convert to actual amount
      const budgetStr = budgetMatches[0];
      const numMatch = budgetStr.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/);
      if (numMatch) {
        let amount = parseFloat(numMatch[1].replace(/,/g, ''));
        if (budgetStr.includes('cr') || budgetStr.includes('crore')) {
          amount *= 10000000; // Convert crores to rupees
        } else if (budgetStr.includes('l') || budgetStr.includes('lakh')) {
          amount *= 100000; // Convert lakhs to rupees
        } else if (budgetStr.includes('k') || budgetStr.includes('thousand')) {
          amount *= 1000; // Convert thousands to rupees
        }
        extractedFilters.budgetMax = amount;
      }
    }

    // Extract category information
    const categoryKeywords = {
      'IT': ['software', 'development', 'technology', 'computer', 'digital', 'ai', 'ml', 'system'],
      'Construction': ['construction', 'building', 'infrastructure', 'civil', 'architecture'],
      'Supply': ['supply', 'procurement', 'equipment', 'hardware', 'materials'],
      'Services': ['services', 'maintenance', 'support', 'consulting', 'management']
    };

    const detectedCategories: string[] = [];
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => query.includes(keyword))) {
        detectedCategories.push(category);
      }
    });

    if (detectedCategories.length > 0) {
      extractedFilters.category = detectedCategories;
    }

    // Extract urgency
    if (query.includes('urgent') || query.includes('closing soon') || query.includes('immediate')) {
      extractedFilters.urgency = 'high';
    } else if (query.includes('next week') || query.includes('7 days')) {
      // Set closing date filter for next 7 days
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      extractedFilters.closingDateRange = { min: now, max: nextWeek };
    }

    // Extract location
    const locations = ['telangana', 'andhra pradesh', 'basar', 'ongole', 'nuzvidu', 'srikakulam', 'rk valley'];
    const detectedLocations = locations.filter(location => query.includes(location));
    if (detectedLocations.length > 0) {
      extractedFilters.location = detectedLocations.map(loc => 
        loc.charAt(0).toUpperCase() + loc.slice(1)
      );
    }

    return extractedFilters;
  };

  // Advanced search algorithm with relevance scoring
  const performIntelligentSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters = {}) => {
    setLoading(true);
    
    try {
      // Process natural language query
      const nlpFilters = processNaturalLanguageQuery(searchQuery);
      const combinedFilters = { ...searchFilters, ...nlpFilters };

      // Filter tenders based on query and filters
      let filteredTenders = mockTenders.filter(tender => {
        // Text matching
        const searchText = `${tender.name} ${tender.description} ${tender.keywords?.join(' ')} ${tender.requirements?.join(' ')}`.toLowerCase();
        const queryWords = searchQuery.toLowerCase().split(' ').filter(word => word.length > 2);
        const textMatch = queryWords.length === 0 || queryWords.some(word => searchText.includes(word));

        // Category filter
        const categoryMatch = !combinedFilters.category || combinedFilters.category.includes(tender.category || '');

        // Budget filter
        const budgetMatch = (!combinedFilters.budgetMin || (tender.tenderValue && tender.tenderValue >= combinedFilters.budgetMin)) &&
                           (!combinedFilters.budgetMax || (tender.tenderValue && tender.tenderValue <= combinedFilters.budgetMax));

        // Location filter
        const locationMatch = !combinedFilters.location || combinedFilters.location.some(loc => 
          tender.location?.toLowerCase().includes(loc.toLowerCase())
        );

        // Date filter
        const dateMatch = !combinedFilters.closingDateRange || (
          new Date(tender.closingDate) >= combinedFilters.closingDateRange.min &&
          new Date(tender.closingDate) <= combinedFilters.closingDateRange.max
        );

        return textMatch && categoryMatch && budgetMatch && locationMatch && dateMatch;
      });

      // Calculate relevance scores and create search results
      const searchResults: SearchResult[] = filteredTenders.map(tender => {
        const relevanceScore = calculateRelevanceScore(tender, searchQuery);
        const matchingReasons = generateMatchingReasons(tender, searchQuery, combinedFilters);
        const urgency = calculateUrgency(tender);
        const competitionLevel = estimateCompetition(tender);

        let score: TenderScore | undefined;
        if (userProfile) {
          score = intelligentTenderMatcher.scoreTenderMatch(userProfile, tender);
        }

        return {
          tender,
          score,
          relevanceScore,
          matchingReasons,
          urgency,
          competitionLevel
        };
      });

      // Sort by relevance score (and AI score if available)
      const sortedResults = searchResults.sort((a, b) => {
        const aScore = (a.score?.overallScore || 0) * 0.6 + a.relevanceScore * 0.4;
        const bScore = (b.score?.overallScore || 0) * 0.6 + b.relevanceScore * 0.4;
        return bScore - aScore;
      });

      setResults(sortedResults);
      onResults?.(sortedResults);

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile, onResults]);

  const calculateRelevanceScore = (tender: TenderData, query: string): number => {
    if (!query) return 50;

    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const tenderText = `${tender.name} ${tender.description} ${tender.keywords?.join(' ')}`.toLowerCase();
    
    let score = 0;
    let totalWords = queryWords.length;

    queryWords.forEach(word => {
      if (tender.name.toLowerCase().includes(word)) {
        score += 30; // Title matches are most important
      } else if (tender.description?.toLowerCase().includes(word)) {
        score += 20; // Description matches
      } else if (tender.keywords?.some(keyword => keyword.toLowerCase().includes(word))) {
        score += 15; // Keyword matches
      } else if (tenderText.includes(word)) {
        score += 10; // General text matches
      }
    });

    // Normalize score
    return Math.min(score / totalWords, 100);
  };

  const generateMatchingReasons = (tender: TenderData, query: string, filters: SearchFilters): string[] => {
    const reasons: string[] = [];

    if (query && tender.name.toLowerCase().includes(query.toLowerCase())) {
      reasons.push('Title matches your search');
    }

    if (filters.category?.includes(tender.category || '')) {
      reasons.push(`Matches ${tender.category} category`);
    }

    if (tender.tenderValue && filters.budgetMax && tender.tenderValue <= filters.budgetMax) {
      reasons.push('Within your budget range');
    }

    const urgency = calculateUrgency(tender);
    if (urgency === 'high') {
      reasons.push('Closing soon - immediate attention needed');
    }

    const competition = estimateCompetition(tender);
    if (competition === 'low') {
      reasons.push('Lower competition expected');
    }

    return reasons;
  };

  const calculateUrgency = (tender: TenderData): 'high' | 'medium' | 'low' => {
    const now = new Date();
    const closingDate = new Date(tender.closingDate);
    const daysLeft = Math.ceil((closingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 3) return 'high';
    if (daysLeft <= 14) return 'medium';
    return 'low';
  };

  const estimateCompetition = (tender: TenderData): 'high' | 'medium' | 'low' => {
    const value = tender.tenderValue || 0;
    const keywords = tender.keywords || [];

    if (value > 10000000 || keywords.includes('software') || keywords.includes('IT')) {
      return 'high';
    } else if (value > 1000000) {
      return 'medium';
    }
    return 'low';
  };

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    await performIntelligentSearch(finalQuery, filters);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    setShowSuggestions(false);
    handleSearch(suggestion.query);
  };

  const clearFilters = () => {
    setFilters({});
    setQuery('');
    setResults([]);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Intelligent Search</h2>
            <p className="text-sm text-gray-600">AI-powered tender discovery with natural language processing</p>
          </div>
        </div>

        {/* Main Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Try: 'software development under 50 lakhs closing next week'"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-32 py-3 text-lg border-2 border-blue-200 focus:border-blue-500 rounded-xl"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-500 hover:text-gray-700"
              >
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                Filters
              </Button>
              <Button 
                onClick={() => handleSearch()}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Search Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-2 border-blue-100">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Search Suggestions</p>
                  {searchSuggestions.filter(s => 
                    !query || s.query.toLowerCase().includes(query.toLowerCase())
                  ).slice(0, 6).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        {suggestion.icon && <suggestion.icon className="h-4 w-4 text-gray-400" />}
                        <span className="text-sm">{suggestion.query}</span>
                        {suggestion.type === 'smart' && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Smart
                          </Badge>
                        )}
                      </div>
                      {suggestion.count && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Smart Recommendations */}
        {smartRecommendations.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-600 mb-2 flex items-center">
              <Lightbulb className="h-4 w-4 mr-1" />
              Recommended for you
            </p>
            <div className="flex flex-wrap gap-2">
              {smartRecommendations.map((rec, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick({ query: rec, type: 'smart' })}
                  className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Advanced Filters
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  onChange={(e) => setFilters({...filters, category: e.target.value ? [e.target.value] : undefined})}
                >
                  <option value="">All Categories</option>
                  <option value="IT">IT & Software</option>
                  <option value="Construction">Construction</option>
                  <option value="Supply">Supply & Procurement</option>
                  <option value="Services">Services</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>

              {/* Budget Range */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Max Budget (₹)</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  onChange={(e) => setFilters({...filters, budgetMax: e.target.value ? parseInt(e.target.value) : undefined})}
                >
                  <option value="">Any Budget</option>
                  <option value="1000000">Under ₹10L</option>
                  <option value="5000000">Under ₹50L</option>
                  <option value="10000000">Under ₹1Cr</option>
                  <option value="50000000">Under ₹5Cr</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  onChange={(e) => setFilters({...filters, location: e.target.value ? [e.target.value] : undefined})}
                >
                  <option value="">All Locations</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowFilters(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleSearch()}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {results.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Found <span className="font-semibold">{results.length}</span> relevant opportunities
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Save Search
              </Button>
            </div>
          </div>
        )}

        {results.map((result, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.tender.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{result.tender.description}</p>
                  
                  {/* Matching Reasons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {result.matchingReasons.slice(0, 3).map((reason, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <Zap className="h-3 w-3 mr-1" />
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  {result.score && (
                    <Badge 
                      variant={result.score.confidenceLevel === 'high' ? 'default' : 'secondary'}
                      className="font-semibold"
                    >
                      {result.score.overallScore}% Match
                    </Badge>
                  )}
                  <Badge variant="outline" className={`${
                    result.urgency === 'high' ? 'border-red-200 text-red-700 bg-red-50' :
                    result.urgency === 'medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                    'border-gray-200 text-gray-700 bg-gray-50'
                  }`}>
                    <Clock className="h-3 w-3 mr-1" />
                    {result.urgency} urgency
                  </Badge>
                </div>
              </div>

              {/* Tender Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">Value:</span>
                  <span className="font-medium">₹{((result.tender.tenderValue || 0) / 100000).toFixed(1)}L</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Source:</span>
                  <span className="font-medium">{result.tender.source}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{result.tender.location}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-gray-600">Closes:</span>
                  <span className="font-medium">{new Date(result.tender.closingDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* AI Insights */}
              {result.score && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900 flex items-center">
                      <Brain className="h-4 w-4 mr-1" />
                      AI Analysis
                    </span>
                    <span className="text-sm text-purple-700">Win Probability: {result.score.riskAssessment.winProbability}%</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-purple-600">Category:</span>
                      <div className="font-medium">{result.score.matchingFactors.categoryMatch.toFixed(0)}%</div>
                    </div>
                    <div>
                      <span className="text-purple-600">Budget Fit:</span>
                      <div className="font-medium">{result.score.matchingFactors.budgetFit.toFixed(0)}%</div>
                    </div>
                    <div>
                      <span className="text-purple-600">Experience:</span>
                      <div className="font-medium">{result.score.matchingFactors.experienceRelevance.toFixed(0)}%</div>
                    </div>
                    <div>
                      <span className="text-purple-600">Competition:</span>
                      <div className="font-medium capitalize">{result.score.riskAssessment.competitionLevel}</div>
                    </div>
                  </div>
                  
                  {result.score.recommendations.length > 0 && (
                    <div className="mt-2 p-2 bg-white/60 rounded">
                      <p className="text-xs text-purple-800">
                        💡 {result.score.recommendations[0]}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {result.tender.requirements?.slice(0, 3).map((req, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                  {(result.tender.requirements?.length || 0) > 3 && (
                    <span className="text-xs text-gray-500">+{(result.tender.requirements?.length || 0) - 3} more</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm">
                    View Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {query && results.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search query or filters to find more opportunities.
              </p>
              <div className="flex justify-center space-x-2">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button onClick={() => {
                  setQuery('');
                  setShowSuggestions(true);
                }}>
                  Try Different Search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default IntelligentSearch;