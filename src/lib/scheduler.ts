


// // src/lib/scheduler.ts
// import { storeTenders } from './supabase';
// import { sendNewTenderNotifications } from './email';
// // import { Tender } from './types';
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
//           const newTenders = await storeTenders(tenders, campus.name);

//           // Send email notifications for new tenders
//           if (newTenders && newTenders.length > 0) {
//             await sendNewTenderNotifications(newTenders, campus.name);
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
//           console.log(`❌ ${data.campus.name}: Failed - ${data.error || 'Unknown error'}`);
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
import {
  scrapeRGUKTMainTenders,
  scrapeRKValleyTenders,
  scrapeOngoleTenders,
  scrapeBasarTenders,
  scrapeSrikakulamTenders
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
];

// Main function to scrape and update tenders from all sources
export async function scrapeAndUpdateTenders(): Promise<void> {
  console.log('Starting scheduled tender scraping and update job...');

  try {
    const results = await Promise.allSettled(
      CAMPUSES.map(async campus => {
        try {
          console.log(`Scraping tenders from ${campus.name} (${campus.id})...`);

          // Directly scrape the website instead of using API routes
          const tenders = await campus.scraper();

          if (!tenders || !Array.isArray(tenders)) {
            console.error(`Failed to fetch tenders from ${campus.name}`);
            return { campus, success: false, error: 'Invalid response format' };
          }

          console.log(`Retrieved ${tenders.length} tenders from ${campus.name}`);

          // Store tenders in Supabase and get new ones
          let newTenders: Tender[] = [];
          try {
            newTenders = await storeTenders(tenders, campus.name);
          } catch (storageError) {
            // Log the storage error but continue with the flow
            console.error(`Error storing tenders in Supabase:`, storageError);
            return {
              campus,
              success: false,
              tendersCount: tenders.length,
              newTendersCount: 0,
              error: storageError instanceof Error ? storageError.message : 'Unknown storage error'
            };
          }

          // Only try to send notifications if we were able to determine new tenders
          if (newTenders && newTenders.length > 0) {
            try {
              await sendNewTenderNotifications(newTenders, campus.name);
              console.log(`Sent notifications for ${newTenders.length} new tenders from ${campus.name}`);
            } catch (notificationError) {
              // Log notification error but don't fail the entire process
              console.error(`Failed to send notifications for ${campus.name}:`, notificationError);
            }
          }

          return {
            campus,
            success: true,
            tendersCount: tenders.length,
            newTendersCount: newTenders?.length || 0
          };
        } catch (error) {
          console.error(`Error processing ${campus.name} tenders:`, error);
          return { campus, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    // Log summary
    console.log('Tender update job completed');
    console.log('Results summary:');
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        if (data.success) {
          console.log(`✅ ${data.campus.name}: ${data.tendersCount} tenders (${data.newTendersCount} new)`);
        } else {
          console.log(`⚠️ ${data.campus.name}: ${data.tendersCount || 0} tenders retrieved, but error occurred: ${data.error || 'Unknown error'}`);
        }
      } else {
        console.log(`❌ Unknown campus: Failed - ${result.reason}`);
      }
    });
  } catch (error) {
    console.error('Error in scheduled job:', error);
  }
}