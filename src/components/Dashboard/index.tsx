

// src/components/Dashboard/index.tsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Loader2,
  Building2,
  Globe,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
  RefreshCw,
  Database,
  AlertTriangle,
  Search,
  Download,
  Bell,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { fetchTenderData } from "@/lib/api";
import { getAllTendersFromSupabase, storeTenders } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";



interface DownloadLink {
  url: string;
  text: string;
}

interface Tender {
  name: string;
  postedDate: string;
  closingDate: string;
  downloadLinks: DownloadLink[];
  source?: string;
}

interface Campus {
  id: string;
  name: string;
  icon: LucideIcon;
  mainSiteUrl: string;
}

interface TenderData {
  data: Tender[];
  totalPages?: number;
  totalTenders?: number;
}

interface TenderDataMap {
  [key: string]: TenderData;
}

const ITEMS_PER_PAGE = 10;




const TenderDashboard: React.FC = () => {
  const [tenderData, setTenderData] = useState<TenderDataMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [dataSource, setDataSource] = useState<"live" | "database">("database");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("rgukt");
  const [subscriptionEmail, setSubscriptionEmail] = useState<string>("");
  const [subscribing, setSubscribing] = useState<boolean>(false);
  const [subscribeMessage, setSubscribeMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"posted" | "closing" | "name">("posted");
  const [filterClosingSoon, setFilterClosingSoon] = useState<boolean>(false);

  const campuses: Campus[] = [
    {
      id: "rgukt",
      name: "RGUKT Main",
      icon: Building2,
      mainSiteUrl: "https://www.rgukt.in",
    },
    {
      id: "rkvalley",
      name: "RK Valley",
      icon: Building2,
      mainSiteUrl: "https://www.rguktrkv.ac.in/Institute.php?view=Tenders",
    },
    {
      id: "ongole",
      name: "Ongole",
      icon: Building2,
      mainSiteUrl: "https://www.rguktong.ac.in/instituteinfo.php?data=tenders",
    },
    {
      id: "basar",
      name: "Basar",
      icon: Building2,
      mainSiteUrl: "https://www.rgukt.ac.in/tenders.html",
    },
    {
      id: "sklm",
      name: "Srikakulam",
      icon: Building2,
      mainSiteUrl: "https://rguktsklm.ac.in/tenders",
    },
  ];

  // Function to load data from database first
  const loadDatabaseData = async () => {
    try {
      const tenders = await getAllTendersFromSupabase();
      const groupedTenders: TenderDataMap = {};

      campuses.forEach((campus) => {
        const campusTenders = tenders.filter(
          (tender) =>
            tender.source?.toLowerCase() === campus.name.toLowerCase()
        );
        groupedTenders[campus.id] = {
          data: campusTenders,
          totalTenders: campusTenders.length,
          totalPages: Math.ceil(campusTenders.length / ITEMS_PER_PAGE),
        };
      });

      setTenderData(groupedTenders);
      setLastUpdated(new Date().toLocaleString());
      return groupedTenders;
    } catch (err) {
      console.error('Error loading database data:', err);
      return {};
    }
  };

  // Function to fetch fresh data and update database
  const fetchAndStoreData = async () => {
    try {
      const results = await Promise.all(
        campuses.map(async (campus) => {
          try {
            const data = await fetchTenderData(campus.id);
            
            if (data?.data) {
              data.data = data.data.map((tender: Tender) => ({
                ...tender,
                source: campus.name,
              }));
            }

            return [campus.id, data] as [string, TenderData];
          } catch (err) {
            console.error(`Error fetching data for ${campus.id}:`, err);
            return [campus.id, { data: [] }] as [string, TenderData];
          }
        })
      );

      const freshData = Object.fromEntries(results);
      
      // Store fresh data in database (background operation)
      Object.entries(freshData).forEach(async ([campusId, data]) => {
        if (data.data && data.data.length > 0) {
          try {
            // You can uncomment this when you want to store data
            await storeTenders(data.data, campuses.find(c => c.id === campusId)?.name || campusId);
          } catch (err) {
            console.error(`Error storing data for ${campusId}:`, err);
          }
        }
      });

      return freshData;
    } catch (err) {
      console.error('Error fetching fresh data:', err);
      return {};
    }
  };

  // Main data fetching function
  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      if (dataSource === "database" && !forceRefresh) {
        // Load from database first
        await loadDatabaseData();
        
        // Fetch fresh data in background
        setTimeout(() => {
          fetchAndStoreData().then((freshData) => {
            if (Object.keys(freshData).length > 0 && dataSource === "database") {
              // Update UI with fresh data if still on database mode
              // setTenderData(freshData);
            }
          });
        }, 1000);
      } else {
        // Fetch live data
        const freshData = await fetchAndStoreData();
        setTenderData(freshData);
      }

      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };



  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subscriptionEmail) {
      setSubscribeMessage({
        type: "error",
        message: "Please enter a valid email address",
      });
      return;
    }

    setSubscribing(true);
    setSubscribeMessage(null);

    try {
      // Call the actual subscription API endpoint
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: subscriptionEmail,
          campus: selectedCampus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubscribeMessage({
          type: "success",
          message:
            data.message ||
            `Successfully subscribed to ${campuses.find((c) => c.id === selectedCampus)?.name || "all campuses"} notifications!`,
        });

        setSubscriptionEmail("");
      } else {
        setSubscribeMessage({
          type: "error",
          message: data.error || "Failed to subscribe. Please try again later.",
        });
      }
    } catch (err) {
      setSubscribeMessage({
        type: "error",
        message: "Failed to subscribe. Please try again later.",
      });
      console.error("Subscription error:", err);
    } finally {
      setSubscribing(false);
    }
  };

  useEffect(() => {
    fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource]);

  // Load database data on component mount
  useEffect(() => {
    loadDatabaseData().then(() => {
      setLoading(false);
    });
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Not Specified";
    return dateString.replace(" at ", ", ");
  };

  const getPaginatedTenders = (tenders: Tender[]): Tender[] => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return tenders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (tenders: Tender[]): number => {
    return Math.ceil(tenders.length / ITEMS_PER_PAGE);
  };

  const formatClosingDate = (
    closingDate: string
  ): { short: string; full: string } => {
    if (!closingDate) {
      return { short: "Not specified", full: "Not specified" };
    }

    if (
      closingDate.toLowerCase().includes("days") ||
      closingDate.toLowerCase().includes("till")
    ) {
      const words = closingDate.split(" ");
      const short =
        words.length > 4 ? words.slice(0, 3).join(" ") + "..." : closingDate;
      return { short, full: closingDate };
    }
    return { short: formatDate(closingDate), full: formatDate(closingDate) };
  };

  const getFilteredAndSortedTenders = (tenders: Tender[]): Tender[] => {
    let filtered = tenders;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(tender =>
        tender.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply closing soon filter
    if (filterClosingSoon) {
      filtered = filtered.filter(tender => isClosingSoon(tender.closingDate));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "closing":
          return new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime();
        case "posted":
        default:
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      }
    });

    return filtered;
  };

  const getTotalStats = () => {
    const allTenders = Object.values(tenderData).flatMap(data => data.data || []);
    const closingSoon = allTenders.filter(tender => isClosingSoon(tender.closingDate));
    return {
      total: allTenders.length,
      closingSoon: closingSoon.length,
      activeToday: allTenders.filter(tender => {
        const today = new Date().toDateString();
        return new Date(tender.postedDate).toDateString() === today;
      }).length
    };
  };

  const isClosingSoon = (closingDate: string): boolean => {
    if (!closingDate) return false;

    try {
      // Extract date
      const dateMatch = closingDate.match(/(\d{2})[-.\/](\d{2})[-.\/](\d{4})/);
      if (!dateMatch) return false;

      const [, day, month, year] = dateMatch;
      const closingDateTime = new Date(`${year}-${month}-${day}`);
      const now = new Date();

      // Calculate difference in days
      const diffTime = closingDateTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Return true if closing within 3 days
      return diffDays >= 0 && diffDays <= 3;
    } catch {
      return false;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">
              Error loading tenders
            </CardTitle>
            <p className="mt-2 text-gray-600">{error}</p>
            <Button
              onClick={handleRefresh}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-16">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-10 mb-10 border border-white/30">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 inline-block text-transparent bg-clip-text">
                    RGUKT Tenders Hub
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Professional Dashboard</p>
                </div>
              </div>
              <p className="text-lg text-gray-700 font-medium leading-relaxed">
                Comprehensive tender management and analytics across all RGUKT campuses
              </p>
              {lastUpdated && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Last updated:</span>
                  <span>{lastUpdated}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={dataSource}
                  onValueChange={(value) =>
                    setDataSource(value as "live" | "database")
                  }
                >
                  <SelectTrigger className="w-[180px] bg-white/70 border-gray-200 shadow-sm">
                    <SelectValue placeholder="Data Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="database">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-600" />
                        <span>Database (Cached)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="live">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        <span>Live Data</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 bg-white/70 hover:bg-white border-gray-200 shadow-sm px-4 py-2"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Refresh Data</span>
                  <span className="sm:hidden">Refresh</span>
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {dataSource === "database" && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 text-sm font-medium"
              >
                <Database className="w-4 h-4 mr-2" />
                Cached Data Mode - Faster Loading
              </Badge>
            )}
            {dataSource === "live" && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 px-4 py-2 text-sm font-medium animate-pulse"
              >
                <Globe className="w-4 h-4 mr-2" />
                Live Data Mode - Real-time Updates
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border-0 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider">Total Tenders</p>
                  <p className="text-4xl font-black mt-2">{stats.total}</p>
                  <p className="text-blue-200 text-xs mt-1">Across all campuses</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white border-0 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-semibold uppercase tracking-wider">Closing Soon</p>
                  <p className="text-4xl font-black mt-2">{stats.closingSoon}</p>
                  <p className="text-orange-200 text-xs mt-1">Next 3 days</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 text-white border-0 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-semibold uppercase tracking-wider">New Today</p>
                  <p className="text-4xl font-black mt-2">{stats.activeToday}</p>
                  <p className="text-green-200 text-xs mt-1">Posted today</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 mb-10 border border-white/30">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-800">Search & Filter Tenders</h2>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tenders by name or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 h-12 w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm text-sm font-medium placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  />
                </div>
                <Select value={sortBy} onValueChange={(value: "posted" | "closing" | "name") => setSortBy(value)}>
                  <SelectTrigger className="w-[200px] h-12 bg-white border-2 border-gray-200 shadow-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="posted">📅 Latest Posted</SelectItem>
                    <SelectItem value="closing">⏰ Closing Date</SelectItem>
                    <SelectItem value="name">🔤 Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={filterClosingSoon ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterClosingSoon(!filterClosingSoon)}
                  className={`flex items-center gap-2 h-12 px-6 rounded-xl font-medium shadow-sm transition-all duration-200 ${
                    filterClosingSoon 
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200" 
                      : "bg-white border-2 border-gray-200 hover:border-amber-300 text-gray-700"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Closing Soon
                  {filterClosingSoon && <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">ON</span>}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Form */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 mb-10 border border-white/30">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Bell className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Email Notifications</h2>
              <p className="text-gray-600 text-sm">Stay updated with new tenders from your preferred campuses</p>
            </div>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col lg:flex-row gap-4"
          >
            <Select value={selectedCampus} onValueChange={setSelectedCampus}>
              <SelectTrigger className="w-full lg:w-[220px] h-12 bg-white border-2 border-gray-200 shadow-sm">
                <SelectValue placeholder="Select Campus" />
              </SelectTrigger>
              <SelectContent>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      {campus.name}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-500" />
                    All Campuses
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <input
              type="email"
              placeholder="Enter your email address for notifications"
              value={subscriptionEmail}
              onChange={(e) => setSubscriptionEmail(e.target.value)}
              className="flex-1 h-12 px-4 rounded-xl border-2 border-gray-200 bg-white shadow-sm text-sm font-medium placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
            />

            <Button
              type="submit"
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={subscribing}
            >
              {subscribing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-5 w-5" />
                  Subscribe
                </>
              )}
            </Button>
          </form>

          {subscribeMessage && (
            <Alert
              className={`mt-3 ${subscribeMessage.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}
            >
              <AlertTitle className="flex items-center gap-2">
                {subscribeMessage.type === "success" ? "Success" : "Error"}
              </AlertTitle>
              <AlertDescription>{subscribeMessage.message}</AlertDescription>
            </Alert>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading tenders...</p>
            </div>
          </div>
        ) : (
          <Tabs
            defaultValue="rgukt"
            className="space-y-6"
            onValueChange={(value) => {
              setSelectedCampus(value);
              setCurrentPage(1);
            }}
          >
            <TabsList className="flex flex-wrap h-auto gap-3 bg-white/90 backdrop-blur-md p-3 rounded-3xl shadow-2xl border border-white/30">
              {campuses.map((campus) => {
                const Icon = campus.icon;
                return (
                  <TabsTrigger
                    key={campus.id}
                    value={campus.id}
                    className="flex items-center gap-3 px-6 py-4 text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:bg-gray-50 font-medium"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{campus.name}</span>
                    <span className="sm:hidden">
                      {campus.name.split(" ")[0]}
                    </span>
                    {tenderData[campus.id]?.data?.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-white/80 text-gray-700 data-[state=active]:bg-white/20 data-[state=active]:text-white"
                      >
                        {tenderData[campus.id].data.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {campuses.map((campus) => (
              <TabsContent
                key={campus.id}
                value={campus.id}
                className="space-y-6 animate-in fade-in-50 duration-500"
              >
                {/* Campus Header */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <campus.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{campus.name} Campus</h3>
                      <p className="text-sm text-gray-600">Active Tenders: {getFilteredAndSortedTenders(tenderData[campus.id]?.data || []).length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => window.open(campus.mainSiteUrl, "_blank")}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Campus Site
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {tenderData[campus.id]?.data?.length > 0 ? (
                    getPaginatedTenders(getFilteredAndSortedTenders(tenderData[campus.id].data)).map(
                      (tender: Tender, index: number) => (
                        <Card
                          key={index}
                          className={`overflow-hidden bg-white/70 backdrop-blur-sm hover:bg-white/90 border-gray-200 hover:border-blue-300 transition-all duration-300 rounded-2xl hover:shadow-xl transform hover:-translate-y-1 ${
                            isClosingSoon(tender.closingDate)
                              ? "border-l-4 border-l-amber-500 shadow-amber-100"
                              : ""
                          }`}
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-xl font-semibold leading-relaxed text-gray-800 group-hover:text-blue-600 transition-colors">
                                {tender.name}
                              </CardTitle>
                              {isClosingSoon(tender.closingDate) && (
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 flex items-center gap-1 shadow-lg animate-pulse">
                                  <AlertTriangle className="w-3 h-3" />
                                  Closing Soon
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-3">
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 py-1.5 px-3 bg-green-50 text-green-700 border-green-200"
                              >
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">Posted:</span>
                                <span className="truncate">
                                  {formatDate(tender.postedDate)}
                                </span>
                              </Badge>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className={`flex items-center gap-1 py-1.5 px-3 ${
                                        isClosingSoon(tender.closingDate)
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : "bg-blue-50 text-blue-700 border-blue-200"
                                      } cursor-help`}
                                    >
                                      <Clock className="w-4 h-4 flex-shrink-0" />
                                      <span className="font-medium">
                                        Closes:
                                      </span>
                                      <span className="truncate">
                                        {
                                          formatClosingDate(tender.closingDate)
                                            .short
                                        }
                                      </span>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {
                                        formatClosingDate(tender.closingDate)
                                          .full
                                      }
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-3">
                              {tender.downloadLinks.map(
                                (link: DownloadLink, linkIndex: number) => (
                                  <Button
                                    key={linkIndex}
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      window.open(link.url, "_blank")
                                    }
                                    className="flex items-center gap-2 text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 border-blue-200 hover:border-blue-300 transition-all duration-300 shadow-md hover:shadow-lg"
                                  >
                                    <Download className="w-4 h-4" />
                                    {link.text}
                                  </Button>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )
                  ) : (
                    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl">
                      <CardHeader className="text-center py-12">
                        <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 text-lg font-medium">
                          No active tenders found for {campus.name}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          {searchQuery && "Try adjusting your search criteria"}
                          {filterClosingSoon && "No tenders closing soon"}
                        </p>
                      </CardHeader>
                    </Card>
                  )}
                </div>

                {/* Pagination */}
                {getFilteredAndSortedTenders(tenderData[campus.id]?.data || []).length > ITEMS_PER_PAGE && (
                  <div className="flex justify-center items-center mt-8 space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 bg-white/70 hover:bg-white border-gray-200 hover:border-blue-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 bg-white/70 px-3 py-2 rounded-lg border">
                        Page {currentPage} of{" "}
                        {getTotalPages(getFilteredAndSortedTenders(tenderData[campus.id].data))}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            prev + 1,
                            getTotalPages(getFilteredAndSortedTenders(tenderData[campus.id].data))
                          )
                        )
                      }
                      disabled={
                        currentPage ===
                        getTotalPages(getFilteredAndSortedTenders(tenderData[campus.id].data))
                      }
                      className="flex items-center gap-2 bg-white/70 hover:bg-white border-gray-200 hover:border-blue-300"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-gray-700 font-medium">© {new Date().getFullYear()} RGUKT Tenders Hub</p>
            <p className="mt-2 text-gray-600 text-sm">Data is automatically updated every hour • Built with ❤️ for RGUKT Community</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderDashboard;
