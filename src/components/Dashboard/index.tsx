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
} from "lucide-react";
import { fetchTenderData } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DownloadLink {
  url: string;
  text: string;
}

interface Tender {
  name: string;
  postedDate: string;
  closingDate: string;
  downloadLinks: DownloadLink[];
}

interface Campus {
  id: string;
  name: string;
  icon: LucideIcon;
  mainSiteUrl: string;
}

interface TenderData {
  data: Tender[];
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
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          campuses.map(async (campus) => {
            const data = await fetchTenderData(campus.id);
            return [campus.id, data] as [string, TenderData];
          })
        );
        setTenderData(Object.fromEntries(results));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">
              Error loading tenders
            </CardTitle>
            <p className="mt-2 text-gray-600">{error}</p>
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
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 inline-block text-transparent bg-clip-text">
            RGUKT Tenders Portal
          </h1>
          <p className="mt-2 text-gray-600">
            Browse and download latest tenders from all RGUKT campuses
          </p>
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
            onValueChange={() => setCurrentPage(1)}
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
                {/* Main Site Button */}
                <div className="mb-4 ">
                  <Button
                    onClick={() => window.open(campus.mainSiteUrl, "_blank")}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Globe className="w-4 h-4" />
                    Visit {campus.name}
                  </Button>
                </div>

                <div className="space-y-4">
                  {tenderData[campus.id]?.data?.length > 0 ? (
                    getPaginatedTenders(tenderData[campus.id].data).map(
                      (tender: Tender, index: number) => (
                        <Card
                          key={index}
                          className="overflow-hidden bg-white hover:bg-blue-50/30 border-gray-100 hover:border-blue-200 transition-all duration-300 rounded-xl hover:shadow-md"
                        >
                          <CardHeader>
                            <CardTitle className="text-lg font-medium leading-relaxed text-gray-800 group-hover:text-blue-600 transition-colors">
                              {tender.name}
                            </CardTitle>
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
                                      className="flex items-center gap-1 py-1.5 px-3 bg-amber-50 text-amber-700 border-amber-200 cursor-help"
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
      </div>
    </div>
  );
};

export default TenderDashboard;
