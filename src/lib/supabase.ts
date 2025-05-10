

// // src/lib/supabase.ts
// import { createClient } from '@supabase/supabase-js'
// import { Tender } from './types'

// // Initialize Supabase client with service role for server-side operations
// // This bypasses RLS policies and should only be used in server-side code
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

// // Create two clients: one for client-side (anon) and one for server-side (service role)
// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// // Service role client bypasses RLS policies - only use on the server!
// const supabaseAdmin = supabaseServiceKey
//   ? createClient(supabaseUrl, supabaseServiceKey, {
//       auth: {
//         autoRefreshToken: false,
//         persistSession: false
//       }
//     })
//   : null

// // Function to store tenders in Supabase (server-side)
// export async function storeTenders(tenders: Tender[], source: string): Promise<Tender[]> {
//   try {
//     // Check if service role client is available
//     if (!supabaseAdmin) {
//       console.warn('SUPABASE_SERVICE_ROLE_KEY is not defined. Using anonymous client which may not have sufficient permissions.');
//     }

//     // Use the appropriate client (prefer admin)
//     const client = supabaseAdmin || supabase;

//     // First, get existing tenders from this source to compare
//     const { data: existingTenders, error: queryError } = await client
//       .from('tenders')
//       .select('*')
//       .eq('source', source)

//     if (queryError) {
//       throw new Error(`Supabase query error: ${queryError.message}`)
//     }

//     // Create a unique signature for each existing tender to help with comparison
//     const existingTenderSignatures = new Set(
//       existingTenders?.map(tender =>
//         `${tender.name}|${tender.postedDate}|${source}`
//       ) || []
//     )

//     // Filter out tenders that already exist in the database
//     const newTenders = tenders.filter(tender =>
//       !existingTenderSignatures.has(`${tender.name}|${tender.postedDate}|${source}`)
//     )

//     console.log(`Found ${newTenders.length} new tenders from ${source}`)

//     // If we have new tenders, insert them
//     if (newTenders.length > 0) {
//       // Prepare data for Supabase insert
//       const tendersToInsert = newTenders.map(tender => ({
//         name: tender.name,
//         posted_date: tender.postedDate,
//         closing_date: tender.closingDate,
//         download_links: tender.downloadLinks,
//         source: source,
//         created_at: new Date().toISOString()
//       }))

//       // Insert new tenders into the database
//       const { error } = await client
//         .from('tenders')
//         .insert(tendersToInsert)

//       if (error) {
//         throw new Error(`Supabase insert error: ${error.message}`)
//       }

//       // Return the new tenders for notification
//       return newTenders
//     }

//     return []
//   } catch (error) {
//     console.error('Error storing tenders in Supabase:', error)
//     throw error
//   }
// }

// // Function to get all tenders from Supabase (client-side)
// export async function getAllTendersFromSupabase(): Promise<Tender[]> {
//   try {
//     const { data, error } = await supabase
//       .from('tenders')
//       .select('*')
//       .order('created_at', { ascending: false })

//     if (error) {
//       throw new Error(`Supabase query error: ${error.message}`)
//     }

//     // Transform the data structure to match our Tender interface
//     return data.map(item => ({
//       name: item.name,
//       postedDate: item.posted_date,
//       closingDate: item.closing_date,
//       downloadLinks: item.download_links,
//       source: item.source
//     }))
//   } catch (error) {
//     console.error('Error fetching tenders from Supabase:', error)
//     throw error
//   }
// }


// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Tender } from './types'

// Initialize Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

// Create two clients: one for client-side (anon) and one for server-side (service role)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client bypasses RLS policies - only use on the server!
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Function to store tenders in Supabase (server-side)
export async function storeTenders(tenders: Tender[], source: string): Promise<Tender[]> {
  try {
    // Check if service role client is available
    if (!supabaseAdmin) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is not defined. Using anonymous client which may not have sufficient permissions.');
    }

    // Use the appropriate client (prefer admin)
    const client = supabaseAdmin || supabase;

    // Get existing tenders from this source
    const { data: existingTenders, error: queryError } = await client
      .from('tenders')
      .select('name, posted_date')
      .eq('source', source)

    if (queryError) {
      console.error(`Error querying existing tenders: ${queryError.message}`);
      // Continue anyway - we'll use upsert which should handle duplicates
    }

    // Create a unique signature for each existing tender to help with comparison
    const existingTenderSignatures = new Set(
      existingTenders?.map(tender =>
        `${tender.name}|${tender.posted_date}|${source}`
      ) || []
    )

    // Filter out tenders that already exist in the database
    const newTenders = tenders.filter(tender =>
      !existingTenderSignatures.has(`${tender.name}|${tender.postedDate}|${source}`)
    )

    console.log(`Found ${newTenders.length} new tenders from ${source}`)

    // If we have new tenders, insert them
    if (newTenders.length > 0) {
      // Process in batches to avoid hitting any limits
      const BATCH_SIZE = 50;
      const batches = [];

      for (let i = 0; i < newTenders.length; i += BATCH_SIZE) {
        batches.push(newTenders.slice(i, i + BATCH_SIZE));
      }

      console.log(`Processing ${batches.length} batches of tenders for ${source}`);

      let successCount = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} tenders)`);

        // Prepare data for Supabase insert
        const tendersToInsert = batch.map(tender => ({
          name: tender.name,
          posted_date: tender.postedDate,
          closing_date: tender.closingDate,
          download_links: tender.downloadLinks,
          source: source,
          created_at: new Date().toISOString()
        }))

        try {
          // Use upsert instead of insert to handle duplicates gracefully
          const { error } = await client
            .from('tenders')
            .upsert(tendersToInsert, {
              onConflict: 'name,posted_date,source',
              ignoreDuplicates: true
            })

          if (error) {
            console.error(`Error in batch ${i + 1}: ${error.message}`);
          } else {
            successCount += batch.length;
            console.log(`Successfully processed batch ${i + 1}`);
          }
        } catch (batchError) {
          console.error(`Failed to process batch ${i + 1}:`, batchError);
        }
      }

      console.log(`Successfully processed ${successCount}/${newTenders.length} tenders for ${source}`);

      // Return the new tenders for notification
      return newTenders;
    }

    return [];
  } catch (error) {
    console.error('Error storing tenders in Supabase:', error)
    throw error
  }
}

// Function to get all tenders from Supabase (client-side)
export async function getAllTendersFromSupabase(): Promise<Tender[]> {
  try {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`)
    }

    // Transform the data structure to match our Tender interface
    return data.map(item => ({
      name: item.name,
      postedDate: item.posted_date,
      closingDate: item.closing_date,
      downloadLinks: item.download_links,
      source: item.source
    }))
  } catch (error) {
    console.error('Error fetching tenders from Supabase:', error)
    throw error
  }
}