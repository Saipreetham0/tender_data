// // src/app/api/cron/route.ts
// import { NextResponse } from 'next/server';
// import { scrapeAndUpdateTenders } from '@/lib/scheduler';

// // Secret key for securing the cron endpoint
// const API_SECRET_KEY = process.env.CRON_API_SECRET_KEY;

// // Store last run time to prevent excessive executions
// let lastRunTime = 0;
// const MIN_INTERVAL = 5 * 60 * 1000; // 5 minutes minimum between runs

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const secretKey = searchParams.get('key');

//     // Validate the request has proper authentication
//     if (!secretKey || secretKey !== API_SECRET_KEY) {
//       return NextResponse.json(
//         { success: false, error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     // Prevent multiple executions in quick succession
//     const now = Date.now();
//     if (now - lastRunTime < MIN_INTERVAL) {
//       return NextResponse.json({
//         success: false,
//         message: 'Job executed too recently. Please wait before running again.',
//         lastRunTime: new Date(lastRunTime).toISOString(),
//         nextAvailableRun: new Date(lastRunTime + MIN_INTERVAL).toISOString()
//       });
//     }

//     // Update the last run time
//     lastRunTime = now;

//     // Run the scrape and update job
//     await scrapeAndUpdateTenders();

//     return NextResponse.json({
//       success: true,
//       message: 'Tenders scraping and update job completed successfully',
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error('Error in cron job API route:', error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : 'An unknown error occurred',
//         timestamp: new Date().toISOString(),
//       },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/cron/route.ts
import { NextResponse } from "next/server";
import { scrapeAndUpdateTenders } from "@/lib/scheduler";
import { logCronExecution } from "@/lib/cronLogger";

// Secret key for securing the cron endpoint
const API_SECRET_KEY = process.env.CRON_API_SECRET_KEY;

// Store last run time to prevent excessive executions
let lastRunTime = 0;
const MIN_INTERVAL = 5 * 60 * 1000; // 5 minutes minimum between runs

export async function GET(request: Request) {
  const jobName = "tender-scraping";

  try {
    // Start logging this execution attempt
    await logCronExecution(jobName, "started", "Cron job initiated");

    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get("key");

    // Validate the request has proper authentication
    if (!secretKey || secretKey !== API_SECRET_KEY) {
      await logCronExecution(
        jobName,
        "failed",
        "Unauthorized access attempt",
        "error",
        { ip: request.headers.get("x-forwarded-for") || "unknown" }
      );

      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Prevent multiple executions in quick succession
    const now = Date.now();
    if (now - lastRunTime < MIN_INTERVAL) {
      await logCronExecution(
        jobName,
        "skipped",
        "Job executed too recently",
        "warn",
        {
          lastRunTime: new Date(lastRunTime).toISOString(),
          nextAvailableRun: new Date(lastRunTime + MIN_INTERVAL).toISOString(),
        }
      );

      return NextResponse.json({
        success: false,
        message: "Job executed too recently. Please wait before running again.",
        lastRunTime: new Date(lastRunTime).toISOString(),
        nextAvailableRun: new Date(lastRunTime + MIN_INTERVAL).toISOString(),
      });
    }

    // Update the last run time
    lastRunTime = now;

    // Log that we're about to run the job
    await logCronExecution(
      jobName,
      "running",
      "Starting tender scraping process"
    );

    // Run the scrape and update job
    const results = await scrapeAndUpdateTenders();

    // Log successful completion
    await logCronExecution(
      jobName,
      "completed",
      "Tenders scraping and update job completed successfully",
      "success",
      { results }
    );

    return NextResponse.json({
      success: true,
      message: "Tenders scraping and update job completed successfully",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    // Log error
    await logCronExecution(
      jobName,
      "failed",
      error instanceof Error ? error.message : "An unknown error occurred",
      "error",
      { errorDetails: error }
    );

    console.error("Error in cron job API route:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
