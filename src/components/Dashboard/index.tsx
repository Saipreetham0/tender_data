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
  // Database,
  AlertTriangle,
  Search,
  Download,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { fetchTenderData } from "@/lib/api";
import { getAllTendersFromSupabase, storeTenders } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { Alert, AlertDescription } from "@/components/ui/alert";

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
          (tender) => tender.source?.toLowerCase() === campus.name.toLowerCase()
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
      console.error("Error loading database data:", err);
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
            await storeTenders(
              data.data,
              campuses.find((c) => c.id === campusId)?.name || campusId
            );
          } catch (err) {
            console.error(`Error storing data for ${campusId}:`, err);
          }
        }
      });

      return freshData;
    } catch (err) {
      console.error("Error fetching fresh data:", err);
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
            if (
              Object.keys(freshData).length > 0 &&
              dataSource === "database"
            ) {
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
      filtered = filtered.filter((tender) =>
        tender.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply closing soon filter
    if (filterClosingSoon) {
      filtered = filtered.filter((tender) => isClosingSoon(tender.closingDate));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "closing":
          return (
            new Date(a.closingDate).getTime() -
            new Date(b.closingDate).getTime()
          );
        case "posted":
        default:
          return (
            new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
          );
      }
    });

    return filtered;
  };

  const getTotalStats = () => {
    const allTenders = Object.values(tenderData).flatMap(
      (data) => data.data || []
    );
    const closingSoon = allTenders.filter((tender) =>
      isClosingSoon(tender.closingDate)
    );
    return {
      total: allTenders.length,
      closingSoon: closingSoon.length,
      activeToday: allTenders.filter((tender) => {
        const today = new Date().toDateString();
        return new Date(tender.postedDate).toDateString() === today;
      }).length,
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Tenders</h1>
            <p className="text-sm text-gray-600">Browse tenders across RGUKT campuses</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={dataSource}
              onValueChange={(value) =>
                setDataSource(value as "live" | "database")
              }
            >
              <SelectTrigger className="w-[140px] h-9 bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="database">Cached</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 px-3"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">{stats.total} Total</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">{stats.closingSoon} Closing Soon</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">{stats.activeToday} New Today</span>
          </div>
        </div>

        {/* Compact Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 w-full rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <Select
            value={sortBy}
            onValueChange={(value: "posted" | "closing" | "name") =>
              setSortBy(value)
            }
          >
            <SelectTrigger className="w-[140px] h-10 bg-white border-gray-200">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="posted">Latest</SelectItem>
              <SelectItem value="closing">Closing</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={filterClosingSoon ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterClosingSoon(!filterClosingSoon)}
            className={`h-10 px-4 ${
              filterClosingSoon
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Closing Soon
            {filterClosingSoon && (
              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                ON
              </span>
            )}
          </Button>
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
              setCurrentPage(1);
            }}
          >
            <TabsList className="flex flex-wrap h-auto gap-2 bg-white p-2 rounded-lg shadow-lg border border-gray-200">
              {campuses.map((campus) => {
                const Icon = campus.icon;
                return (
                  <TabsTrigger
                    key={campus.id}
                    value={campus.id}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200 hover:bg-gray-50 font-medium"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{campus.name}</span>
                    <span className="sm:hidden">
                      {campus.name.split(" ")[0]}
                    </span>
                    {tenderData[campus.id]?.data?.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-white/20 data-[state=active]:text-white"
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
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <campus.icon className="w-4 h-4 text-blue-600" />
                    <h3 className="font-medium text-gray-900">{campus.name}</h3>
                    <span className="text-sm text-gray-500">
                      ({getFilteredAndSortedTenders(tenderData[campus.id]?.data || []).length} tenders)
                    </span>
                  </div>
                  <Button
                    onClick={() => window.open(campus.mainSiteUrl, "_blank")}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Visit Site
                  </Button>
                </div>

                <div className="space-y-4">
                  {tenderData[campus.id]?.data?.length > 0 ? (
                    getPaginatedTenders(
                      getFilteredAndSortedTenders(tenderData[campus.id].data)
                    ).map((tender: Tender, index: number) => (
                      <Card
                        key={index}
                        className={`border-gray-200 hover:shadow-lg transition-shadow ${
                          isClosingSoon(tender.closingDate)
                            ? "border-l-4 border-l-orange-500"
                            : ""
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 leading-tight flex-1 pr-4">
                              {tender.name}
                            </h3>
                            {isClosingSoon(tender.closingDate) && (
                              <Badge className="bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Closing Soon
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Posted: {formatDate(tender.postedDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Closes: {formatClosingDate(tender.closingDate).short}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {tender.downloadLinks.map(
                              (link: DownloadLink, linkIndex: number) => (
                                <Button
                                  key={linkIndex}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(link.url, "_blank")}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {link.text}
                                </Button>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="border-dashed border-2 border-gray-300">
                      <CardContent className="text-center py-12">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">
                          No tenders found for {campus.name}
                        </p>
                        {(searchQuery || filterClosingSoon) && (
                          <p className="text-gray-500 text-sm mt-2">
                            Try adjusting your search or filters
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Pagination */}
                {getFilteredAndSortedTenders(tenderData[campus.id]?.data || [])
                  .length > ITEMS_PER_PAGE && (
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
                        {getTotalPages(
                          getFilteredAndSortedTenders(
                            tenderData[campus.id].data
                          )
                        )}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            prev + 1,
                            getTotalPages(
                              getFilteredAndSortedTenders(
                                tenderData[campus.id].data
                              )
                            )
                          )
                        )
                      }
                      disabled={
                        currentPage ===
                        getTotalPages(
                          getFilteredAndSortedTenders(
                            tenderData[campus.id].data
                          )
                        )
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

        {/* Simple Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Data updated hourly • © {new Date().getFullYear()} RGUKT Tenders Hub</p>
        </div>
      </div>
    </div>
  );
};

export default TenderDashboard;
