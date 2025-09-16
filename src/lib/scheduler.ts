

// // src/lib/scheduler.ts
// import { storeTenders } from './supabase';
// import { sendNewTenderNotifications } from './email';
// import { Tender } from './types';
// import {
//   scrapeRGUKTMainTenders,
//   scrapeRKValleyTenders,
//   scrapeOngoleTenders,
//   scrapeBasarTenders,
//   scrapeSrikakulamTenders
// } from './direct-scrapers';

// // Define campus sources with scraping functions
// const CAMPUSES = [
//   {
//     id: 'rgukt',
//     name: 'RGUKT Main',
//     scraper: scrapeRGUKTMainTenders
//   },
//   {
//     id: 'rkvalley',
//     name: 'RK Valley',
//     scraper: scrapeRKValleyTenders
//   },
//   {
//     id: 'ongole',
//     name: 'Ongole',
//     scraper: scrapeOngoleTenders
//   },
//   {
//     id: 'basar',
//     name: 'Basar',
//     scraper: scrapeBasarTenders
//   },
//   {
//     id: 'sklm',
//     name: 'Srikakulam',
//     scraper: scrapeSrikakulamTenders
//   },
// ];

// // Main function to scrape and update tenders from all sources
// export async function scrapeAndUpdateTenders(): Promise<void> {
//   console.log('Starting scheduled tender scraping and update job...');

//   try {
//     const results = await Promise.allSettled(
//       CAMPUSES.map(async campus => {
//         try {
//           console.log(`Scraping tenders from ${campus.name} (${campus.id})...`);

//           // Directly scrape the website instead of using API routes
//           const tenders = await campus.scraper();

//           if (!tenders || !Array.isArray(tenders)) {
//             console.error(`Failed to fetch tenders from ${campus.name}`);
//             return { campus, success: false, error: 'Invalid response format' };
//           }

//           console.log(`Retrieved ${tenders.length} tenders from ${campus.name}`);

//           // Store tenders in Supabase and get new ones
//           let newTenders: Tender[] = [];
//           try {
//             newTenders = await storeTenders(tenders, campus.name);
//           } catch (storageError) {
//             // Log the storage error but continue with the flow
//             console.error(`Error storing tenders in Supabase:`, storageError);
//             return {
//               campus,
//               success: false,
//               tendersCount: tenders.length,
//               newTendersCount: 0,
//               error: storageError instanceof Error ? storageError.message : 'Unknown storage error'
//             };
//           }

//           // Only try to send notifications if we were able to determine new tenders
//           if (newTenders && newTenders.length > 0) {
//             try {
//               await sendNewTenderNotifications(newTenders, campus.name);
//               console.log(`Sent notifications for ${newTenders.length} new tenders from ${campus.name}`);
//             } catch (notificationError) {
//               // Log notification error but don't fail the entire process
//               console.error(`Failed to send notifications for ${campus.name}:`, notificationError);
//             }
//           }

//           return {
//             campus,
//             success: true,
//             tendersCount: tenders.length,
//             newTendersCount: newTenders?.length || 0
//           };
//         } catch (error) {
//           console.error(`Error processing ${campus.name} tenders:`, error);
//           return { campus, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
//         }
//       })
//     );

//     // Log summary
//     console.log('Tender update job completed');
//     console.log('Results summary:');
//     results.forEach(result => {
//       if (result.status === 'fulfilled') {
//         const data = result.value;
//         if (data.success) {
//           console.log(`✅ ${data.campus.name}: ${data.tendersCount} tenders (${data.newTendersCount} new)`);
//         } else {
//           console.log(`⚠️ ${data.campus.name}: ${data.tendersCount || 0} tenders retrieved, but error occurred: ${data.error || 'Unknown error'}`);
//         }
//       } else {
//         console.log(`❌ Unknown campus: Failed - ${result.reason}`);
//       }
//     });
//   } catch (error) {
//     console.error('Error in scheduled job:', error);
//   }
// }


// src/lib/scheduler.ts
import { storeTenders } from './supabase';
import { sendNewTenderNotifications } from './email';
import { Tender } from './types';
import { logCronExecution } from './cronLogger';
import {
  scrapeRGUKTMainTenders,
  scrapeRKValleyTenders,
  scrapeOngoleTenders,
  scrapeBasarTenders,
  scrapeSrikakulamTenders,
  scrapeRGUKTNuzviduTenders
} from './direct-scrapers';

// Define campus sources with scraping functions
const CAMPUSES = [
  {
    id: 'rgukt',
    name: 'RGUKT Main',
    scraper: scrapeRGUKTMainTenders
  },
  {
    id: 'rkvalley',
    name: 'RK Valley',
    scraper: scrapeRKValleyTenders
  },
  {
    id: 'ongole',
    name: 'Ongole',
    scraper: scrapeOngoleTenders
  },
  {
    id: 'basar',
    name: 'Basar',
    scraper: scrapeBasarTenders
  },
  {
    id: 'sklm',
    name: 'Srikakulam',
    scraper: scrapeSrikakulamTenders
  },
  {
    id: 'nuzvidu',
    name: 'RGUKT Nuzvidu',
    scraper: scrapeRGUKTNuzviduTenders
  },
];

// Result type for scraping operation
export interface ScrapingResult {
  campus: {
    id: string;
    name: string;
  };
  success: boolean;
  tendersCount?: number;
  newTendersCount?: number;
  error?: string;
  duration?: number;
}

// Main function to scrape and update tenders from all sources
export async function scrapeAndUpdateTenders(): Promise<ScrapingResult[]> {
  const startTime = Date.now();
  console.log('Starting scheduled tender scraping and update job...');

  const results: ScrapingResult[] = [];

  try {
    const promiseResults = await Promise.allSettled(
      CAMPUSES.map(async campus => {
        const campusStartTime = Date.now();
        try {
          await logCronExecution(
            'tender-scraping',
            'in-progress',
            `Scraping tenders from ${campus.name} (${campus.id})...`
          );

          // Directly scrape the website instead of using API routes
          const tenders = await campus.scraper();

          if (!tenders || !Array.isArray(tenders)) {
            const errorMsg = `Failed to fetch tenders from ${campus.name}`;
            await logCronExecution(
              'tender-scraping',
              'warning',
              errorMsg,
              'warn',
              { campus: campus.id }
            );

            return {
              campus,
              success: false,
              error: 'Invalid response format',
              duration: Date.now() - campusStartTime
            };
          }

          await logCronExecution(
            'tender-scraping',
            'info',
            `Retrieved ${tenders.length} tenders from ${campus.name}`
          );

          // Store tenders in Supabase and get new ones
          let newTenders: Tender[] = [];
          try {
            newTenders = await storeTenders(tenders, campus.name);

            await logCronExecution(
              'tender-scraping',
              'info',
              `Stored ${newTenders.length} new tenders from ${campus.name}`
            );
          } catch (storageError) {
            // Log the storage error but continue with the flow
            await logCronExecution(
              'tender-scraping',
              'error',
              `Error storing tenders in Supabase for ${campus.name}`,
              'error',
              { error: storageError }
            );

            return {
              campus,
              success: false,
              tendersCount: tenders.length,
              newTendersCount: 0,
              error: storageError instanceof Error ? storageError.message : 'Unknown storage error',
              duration: Date.now() - campusStartTime
            };
          }

          // Only try to send notifications if we were able to determine new tenders
          if (newTenders && newTenders.length > 0) {
            try {
              await sendNewTenderNotifications(newTenders, campus.name);

              await logCronExecution(
                'tender-scraping',
                'success',
                `Sent notifications for ${newTenders.length} new tenders from ${campus.name}`,
                'success'
              );
            } catch (notificationError) {
              // Log notification error but don't fail the entire process
              await logCronExecution(
                'tender-scraping',
                'warning',
                `Failed to send notifications for ${campus.name}`,
                'warn',
                { error: notificationError }
              );
            }
          }

          return {
            campus,
            success: true,
            tendersCount: tenders.length,
            newTendersCount: newTenders?.length || 0,
            duration: Date.now() - campusStartTime
          };
        } catch (error) {
          await logCronExecution(
            'tender-scraping',
            'error',
            `Error processing ${campus.name} tenders`,
            'error',
            { error }
          );

          return {
            campus,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - campusStartTime
          };
        }
      })
    );

    // Process results
    promiseResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // This should rarely happen, but just in case a promise is rejected
        results.push({
          campus: { id: 'unknown', name: 'Unknown Campus' },
          success: false,
          error: `Promise rejected: ${result.reason}`
        });
      }
    });

    // Log summary
    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    await logCronExecution(
      'tender-scraping',
      'summary',
      `Job completed in ${totalDuration}ms. Success: ${successCount}, Failures: ${failureCount}`,
      'info',
      { results }
    );

    return results;
  } catch (error) {
    await logCronExecution(
      'tender-scraping',
      'fatal-error',
      'Critical error in scheduled job',
      'error',
      { error }
    );

    console.error('Error in scheduled job:', error);
    return [{
      campus: { id: 'global', name: 'Global Error' },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown global error'
    }];
  }
}