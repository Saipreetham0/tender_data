

// src/components/Dashboard/index.tsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
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
  Mail,
  AlertTriangle,
} from "lucide-react";
import { fetchTenderData } from "@/lib/api";
import { getAllTendersFromSupabase } from "@/lib/supabase";
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
  const [dataSource, setDataSource] = useState<"live" | "database">("live");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("rgukt");
  const [subscriptionEmail, setSubscriptionEmail] = useState<string>("");
  const [subscribing, setSubscribing] = useState<boolean>(false);
  const [subscribeMessage, setSubscribeMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

  // Function to fetch data from the selected source
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (dataSource === "database") {
        // Fetch from Supabase
        const tenders = await getAllTendersFromSupabase();

        // Group tenders by source
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
      } else {
        // Fetch live data from APIs
        const results = await Promise.all(
          campuses.map(async (campus) => {
            try {
              const data = await fetchTenderData(campus.id);

              // Add source information to each tender
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

        setTenderData(Object.fromEntries(results));
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 inline-block text-transparent bg-clip-text">
                RGUKT Tenders Portal
              </h1>
              <p className="mt-2 text-gray-600">
                Browse and download latest tenders from all RGUKT campuses
              </p>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdated}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Select
                value={dataSource}
                onValueChange={(value) =>
                  setDataSource(value as "live" | "database")
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Data Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Live Data</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="database">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span>Database</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
          {dataSource === "database" && (
            <Badge
              variant="outline"
              className="mt-2 bg-blue-50 text-blue-600 border-blue-200"
            >
              Viewing stored data from database
            </Badge>
          )}
        </div>

        {/* Subscription Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Subscribe to Tender Notifications
          </h2>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Select value={selectedCampus} onValueChange={setSelectedCampus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Campus" />
              </SelectTrigger>
              <SelectContent>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name}
                  </SelectItem>
                ))}
                <SelectItem value="all">All Campuses</SelectItem>
              </SelectContent>
            </Select>

            <input
              type="email"
              placeholder="Your Email Address"
              value={subscriptionEmail}
              onChange={(e) => setSubscriptionEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={subscribing}
            >
              {subscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>Subscribe</>
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
            <TabsList className="flex flex-wrap h-auto gap-2 bg-white p-2 rounded-xl shadow-lg border border-gray-100">
              {campuses.map((campus) => {
                const Icon = campus.icon;
                return (
                  <TabsTrigger
                    key={campus.id}
                    value={campus.id}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{campus.name}</span>
                    <span className="sm:hidden">
                      {campus.name.split(" ")[0]}
                    </span>
                    {tenderData[campus.id]?.data?.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700"
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
                className="space-y-4 animate-in fade-in-50 duration-500"
              >
                {/* Campus Header */}
                <div className="mb-4 flex items-center justify-between">
                  <Button
                    onClick={() => window.open(campus.mainSiteUrl, "_blank")}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Globe className="w-4 h-4" />
                    Visit {campus.name}
                  </Button>

                  {dataSource === "database" && (
                    <span className="text-sm text-gray-500">
                      Showing stored tenders from database
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {tenderData[campus.id]?.data?.length > 0 ? (
                    getPaginatedTenders(tenderData[campus.id].data).map(
                      (tender: Tender, index: number) => (
                        <Card
                          key={index}
                          className={`overflow-hidden bg-white hover:bg-blue-50/30 border-gray-100 hover:border-blue-200 transition-all duration-300 rounded-xl hover:shadow-md ${
                            isClosingSoon(tender.closingDate)
                              ? "border-l-4 border-l-amber-500"
                              : ""
                          }`}
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg font-medium leading-relaxed text-gray-800 group-hover:text-blue-600 transition-colors">
                                {tender.name}
                              </CardTitle>
                              {isClosingSoon(tender.closingDate) && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
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
                            <div className="flex flex-wrap gap-2">
                              {tender.downloadLinks.map(
                                (link: DownloadLink, linkIndex: number) => (
                                  <Button
                                    key={linkIndex}
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      window.open(link.url, "_blank")
                                    }
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-all"
                                  >
                                    <ExternalLink className="w-4 h-4" />
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
                    <Card className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                      <CardHeader>
                        <p className="text-center text-gray-500 py-8">
                          No active tenders found for {campus.name}
                        </p>
                      </CardHeader>
                    </Card>
                  )}
                </div>

                {/* Pagination */}
                {tenderData[campus.id]?.data?.length > ITEMS_PER_PAGE && (
                  <div className="flex justify-center items-center mt-6 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of{" "}
                      {getTotalPages(tenderData[campus.id].data)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            prev + 1,
                            getTotalPages(tenderData[campus.id].data)
                          )
                        )
                      }
                      disabled={
                        currentPage ===
                        getTotalPages(tenderData[campus.id].data)
                      }
                      className="flex items-center gap-1"
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
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} RGUKT Tenders Portal</p>
          <p className="mt-1">Data is automatically updated every hour</p>
        </div>
      </div>
    </div>
  );
};

export default TenderDashboard;
