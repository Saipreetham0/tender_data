// src/app/admin/cron/page.tsx
"use client";
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CronLog {
  timestamp: string;
  job_name: string;
  status: string;
  message: string;
  level: string;
  details?: string;
}

interface CronStatus {
  isWorking: boolean;
  lastExecutionTime: string | null;
  nextScheduledRun: string | null;
  currentServerTime: string;
}

function CronStatusPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<CronStatus | null>(null);
  const [logs, setLogs] = useState<CronLog[]>([]);
  const [apiKey, setApiKey] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const fetchCronStatus = useCallback(async () => {
    if (!apiKey) return;

    setRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/cron-status?key=${apiKey}&limit=20`);

      if (!response.ok) {
        throw new Error(`Failed to fetch cron status: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setStatus(data.status);
        setLogs(data.recentLogs);
      } else {
        setError(data.error || "Unknown error occurred");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch cron status"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiKey]);

  const triggerCronJob = async () => {
    if (!apiKey) return;

    setRefreshing(true);

    try {
      const response = await fetch(`/api/cron?key=${apiKey}`);

      if (!response.ok) {
        throw new Error(`Failed to trigger cron job: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        alert(
          "Cron job triggered successfully! Refresh the status in a moment to see results."
        );
      } else {
        setError(data.error || data.message || "Unknown error occurred");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to trigger cron job"
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCronStatus();
  }, [fetchCronStatus]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "started":
      case "running":
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
      case "skipped":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const toggleDetails = (timestamp: string) => {
    if (showDetails === timestamp) {
      setShowDetails(null);
    } else {
      setShowDetails(timestamp);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            Cron Job Status
            <Button
              variant="outline"
              onClick={fetchCronStatus}
              disabled={refreshing || !apiKey}
              className="ml-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* API Key Input */}
          <div className="mb-6">
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              API Key (Required)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your CRON_API_SECRET_KEY"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button onClick={fetchCronStatus} disabled={!apiKey}>
                Load Status
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This is the same key that you have set as CRON_API_SECRET_KEY in
              your environment variables.
            </p>
          </div>

          {error && (
            <div className="p-4 mb-4 text-red-800 border border-red-300 rounded-lg bg-red-50">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {loading && apiKey ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading cron status...</span>
            </div>
          ) : status ? (
            <div className="space-y-6">
              {/* Status Summary */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">Status Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Current Status</div>
                    <div className="flex items-center mt-1">
                      {status.isWorking ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <span className="font-medium text-green-800">
                            Working Correctly
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                          <span className="font-medium text-amber-800">
                            Not Working
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Last Execution</div>
                    <div className="font-medium mt-1">
                      {status.lastExecutionTime
                        ? formatDate(status.lastExecutionTime)
                        : "Never"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">
                      Next Scheduled Run
                    </div>
                    <div className="font-medium mt-1">
                      {status.nextScheduledRun
                        ? formatDate(status.nextScheduledRun)
                        : "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Server Time</div>
                    <div className="font-medium mt-1">
                      {formatDate(status.currentServerTime)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    onClick={triggerCronJob}
                    disabled={refreshing || !apiKey}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {refreshing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Trigger Cron Job Manually
                  </Button>
                </div>
              </div>

              {/* Recent Logs */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Recent Logs ({logs.length})
                </h3>
                {logs.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                          >
                            Time
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                          >
                            Message
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                          <React.Fragment key={log.timestamp}>
                            <tr
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => toggleDetails(log.timestamp)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(log.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={getStatusColor(log.status)}>
                                  {log.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {log.message}
                              </td>
                            </tr>
                            {showDetails === log.timestamp && log.details && (
                              <tr className="bg-gray-50">
                                <td colSpan={3} className="px-6 py-4">
                                  <div className="text-xs font-mono whitespace-pre-wrap bg-black text-white p-3 rounded">
                                    {log.details}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">No logs found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-gray-500">
                Enter your API key to view cron job status
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>
          Note: This page shows the status of your cron jobs and recent logs.
        </p>
        <p className="mt-1">
          If the cron job is not working, make sure the Vercel cron
          configuration is correct.
        </p>
      </div>
    </div>
  );
}

// Export as dynamic to prevent pre-rendering issues
export default dynamic(() => Promise.resolve(CronStatusPage), {
  ssr: false,
});
