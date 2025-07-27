


// src/components/Dashboard/SubscriptionIntegration.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Filter, Building2, Mail, Zap } from "lucide-react";

// Import the hook with curly braces since it's a named export
import { useRazorpayPayment } from "@/hooks/useRazorpayPayment";

import { useState as reactUseState } from "react";

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
}) => {
  const { canAccess } = useRazorpayPayment();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-6 text-center">
        <Lock className="h-12 w-12 text-amber-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
        <p className="text-gray-600 mb-4">
          Upgrade to {getRequiredPlan(feature)} to access this feature
        </p>
        <Button
          onClick={() => (window.location.href = "/subscription")}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
};

function getRequiredPlan(feature: string): string {
  switch (feature) {
    case "all_colleges":
      return "All Colleges plan";
    case "keyword_filter":
      return "All Colleges plan";
    case "advanced_filters":
      return "Pro plan";
    case "api_access":
      return "Pro plan";
    default:
      return "a premium plan";
  }
}

// Updated Dashboard component with subscription gates
export const EnhancedTenderDashboard: React.FC = () => {
  const { currentSubscription, canAccess } = useRazorpayPayment();
  const [selectedColleges, setSelectedColleges] = reactUseState<string[]>([
    "all",
  ]);
  const [keywordFilter, setKeywordFilter] = reactUseState("");
  const [advancedFilters, setAdvancedFilters] = reactUseState({
    minAmount: "",
    maxAmount: "",
    category: "",
    department: "",
  });

  // Determine which colleges user can access
  const getAccessibleColleges = () => {
    if (!currentSubscription) {
      // Free tier - only one college
      return ["basar"];
    }

    if (canAccess("all_colleges")) {
      return ["all", "basar", "rkvalley", "ongole", "rgukt", "sklm"];
    }

    // Basic plan - one college
    return ["basar"];
  };

  const accessibleColleges = getAccessibleColleges();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Subscription Status Bar */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="h-5 w-5 text-blue-600" />
            <span className="font-medium">
              Current Plan: {currentSubscription?.plan.name || "Free"}
            </span>
            {currentSubscription && (
              <Badge className="bg-green-100 text-green-800">
                {currentSubscription.status}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/subscription")}
          >
            Manage Subscription
          </Button>
        </div>
      </div>

      {/* College Selection */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Select Colleges
          </h3>

          {canAccess("all_colleges") ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {["all", "basar", "rkvalley", "ongole", "rgukt", "sklm"].map(
                (college) => (
                  <label key={college} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedColleges.includes(college)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColleges([...selectedColleges, college]);
                        } else {
                          setSelectedColleges(
                            selectedColleges.filter((c) => c !== college)
                          );
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">
                      {college === "all" ? "All Colleges" : college}
                    </span>
                  </label>
                )
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={selectedColleges[0]}
                onChange={(e) => setSelectedColleges([e.target.value])}
                className="w-full p-2 border rounded-lg"
              >
                {accessibleColleges.map((college) => (
                  <option key={college} value={college}>
                    {college === "all" ? "All Colleges" : college.toUpperCase()}
                  </option>
                ))}
              </select>
              <FeatureGate feature="all_colleges">
                <></>
              </FeatureGate>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Tender Filters
          </h3>

          {/* Keyword Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Keyword Filter
              {!canAccess("keyword_filter") && (
                <Badge className="ml-2 bg-amber-100 text-amber-800">
                  All Colleges Plan
                </Badge>
              )}
            </label>
            <FeatureGate
              feature="keyword_filter"
              fallback={
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    placeholder="Upgrade to use keyword filtering"
                    className="w-full p-2 border rounded-lg bg-gray-50 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              }
            >
              <input
                type="text"
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                placeholder="Enter keywords to filter tenders..."
                className="w-full p-2 border rounded-lg"
              />
            </FeatureGate>
          </div>

          {/* Advanced Filters */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Advanced Filters
              {!canAccess("advanced_filters") && (
                <Badge className="ml-2 bg-amber-100 text-amber-800">
                  Pro Plan
                </Badge>
              )}
            </label>
            <FeatureGate
              feature="advanced_filters"
              fallback={
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    Advanced filters available in Pro plan
                  </p>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="number"
                  placeholder="Min Amount"
                  value={advancedFilters.minAmount}
                  onChange={(e) =>
                    setAdvancedFilters({
                      ...advancedFilters,
                      minAmount: e.target.value,
                    })
                  }
                  className="p-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Max Amount"
                  value={advancedFilters.maxAmount}
                  onChange={(e) =>
                    setAdvancedFilters({
                      ...advancedFilters,
                      maxAmount: e.target.value,
                    })
                  }
                  className="p-2 border rounded-lg"
                />
                <select
                  value={advancedFilters.category}
                  onChange={(e) =>
                    setAdvancedFilters({
                      ...advancedFilters,
                      category: e.target.value,
                    })
                  }
                  className="p-2 border rounded-lg"
                >
                  <option value="">All Categories</option>
                  <option value="construction">Construction</option>
                  <option value="supplies">Supplies</option>
                  <option value="services">Services</option>
                  <option value="equipment">Equipment</option>
                </select>
                <select
                  value={advancedFilters.department}
                  onChange={(e) =>
                    setAdvancedFilters({
                      ...advancedFilters,
                      department: e.target.value,
                    })
                  }
                  className="p-2 border rounded-lg"
                >
                  <option value="">All Departments</option>
                  <option value="engineering">Engineering</option>
                  <option value="administration">Administration</option>
                  <option value="academic">Academic</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </FeatureGate>
          </div>
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Email Alerts
          </h3>

          <div className="space-y-3">
            {currentSubscription && canAccess("realtime_alerts") ? (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Real-time Alerts Active</p>
                    <p className="text-sm text-gray-600">
                      Get instant notifications when new tenders are posted
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Weekly Summary Only</p>
                    <p className="text-sm text-gray-600">
                      Upgrade to get real-time email alerts
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => (window.location.href = "/subscription")}
                >
                  Upgrade
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tender List will go here with applied filters */}
      {/* ... rest of your tender display logic ... */}
    </div>
  );
};