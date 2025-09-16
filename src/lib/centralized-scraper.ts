// src/lib/centralized-scraper.ts - Efficient centralized scraping system

import { storeTenders, getAllTendersFromSupabase } from './supabase';
import { redis } from './redis';
import { CACHE_KEYS, CACHE_TTL } from './redis';
import { Tender } from './types';
import {
  scrapeRGUKTMainTenders,
  scrapeRKValleyTenders,
  scrapeOngoleTenders,
  scrapeBasarTenders,
  scrapeSrikakulamTenders,
  scrapeRGUKTNuzviduTenders
} from './direct-scrapers';

interface CampusConfig {
  id: string;
  name: string;
  scraper: () => Promise<Tender[]>;
  priority: number; // 1 = highest priority
  scrapeInterval: number; // minutes
  enabled: boolean;
}

// Campus configuration with priorities and intervals
const CAMPUS_CONFIGS: CampusConfig[] = [
  {
    id: 'basar',
    name: 'Basar',
    scraper: scrapeBasarTenders,
    priority: 1,
    scrapeInterval: 30, // Every 30 minutes
    enabled: true
  },
  {
    id: 'ongole',
    name: 'Ongole',
    scraper: scrapeOngoleTenders,
    priority: 1,
    scrapeInterval: 30,
    enabled: true
  },
  {
    id: 'rkvalley',
    name: 'RK Valley',
    scraper: scrapeRKValleyTenders,
    priority: 2,
    scrapeInterval: 45,
    enabled: true
  },
  {
    id: 'sklm',
    name: 'Srikakulam',
    scraper: scrapeSrikakulamTenders,
    priority: 2,
    scrapeInterval: 45,
    enabled: true
  },
  {
    id: 'nuzvidu',
    name: 'RGUKT Nuzvidu',
    scraper: scrapeRGUKTNuzviduTenders,
    priority: 3,
    scrapeInterval: 60,
    enabled: true
  },
  {
    id: 'rgukt',
    name: 'RGUKT Main',
    scraper: scrapeRGUKTMainTenders,
    priority: 4,
    scrapeInterval: 60,
    enabled: false // Currently disabled
  }
];

interface ScrapingJob {
  campusId: string;
  lastRun: number;
  nextRun: number;
  status: 'idle' | 'running' | 'error';
  lastError?: string;
  successCount: number;
  errorCount: number;
}

class CentralizedScraper {
  private jobs: Map<string, ScrapingJob> = new Map();
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs() {
    CAMPUS_CONFIGS.forEach(config => {
      if (config.enabled) {
        this.jobs.set(config.id, {
          campusId: config.id,
          lastRun: 0,
          nextRun: Date.now(),
          status: 'idle',
          successCount: 0,
          errorCount: 0
        });
      }
    });
  }

  // Start the centralized scraping system
  public start() {
    if (this.isRunning) {
      console.log('Centralized scraper is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting centralized scraper system');

    // Check for jobs every 5 minutes
    this.intervalId = setInterval(() => {
      this.checkAndRunJobs();
    }, 5 * 60 * 1000);

    // Run initial check
    this.checkAndRunJobs();
  }

  // Stop the scraping system
  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('🛑 Stopped centralized scraper system');
  }

  private async checkAndRunJobs() {
    const now = Date.now();

    for (const [campusId, job] of this.jobs) {
      if (job.nextRun <= now && job.status === 'idle') {
        await this.runScrapingJob(campusId);
      }
    }
  }

  private async runScrapingJob(campusId: string) {
    const job = this.jobs.get(campusId);
    const config = CAMPUS_CONFIGS.find(c => c.id === campusId);

    if (!job || !config) return;

    job.status = 'running';
    job.lastRun = Date.now();

    console.log(`🔄 Starting scraping job for ${config.name}`);

    try {
      // 1. Scrape fresh data
      const tenders = await config.scraper();

      if (!tenders || tenders.length === 0) {
        throw new Error('No tenders found');
      }

      // 2. Store in database
      const newTenders = await storeTenders(tenders, config.name);

      // 3. Cache in Redis for fast API responses
      await this.cacheData(campusId, tenders, newTenders);

      // 4. Update job status
      job.status = 'idle';
      job.successCount++;
      job.nextRun = Date.now() + (config.scrapeInterval * 60 * 1000);
      job.lastError = undefined;

      console.log(`✅ ${config.name}: Scraped ${tenders.length} tenders (${newTenders.length} new)`);

    } catch (error) {
      job.status = 'error';
      job.errorCount++;
      job.lastError = error instanceof Error ? error.message : 'Unknown error';

      // Retry with exponential backoff
      const retryDelay = Math.min(30 * Math.pow(2, job.errorCount), 240); // Max 4 hours
      job.nextRun = Date.now() + (retryDelay * 60 * 1000);

      console.error(`❌ ${config.name}: Scraping failed - ${job.lastError}`);
    }
  }

  private async cacheData(campusId: string, allTenders: Tender[], newTenders: Tender[]) {
    try {
      // Cache all tenders with 6-hour TTL
      const cacheKey = CACHE_KEYS.tenderData(campusId);
      await redis.setex(cacheKey, CACHE_TTL.TENDER_DATA, JSON.stringify({
        success: true,
        data: allTenders,
        source: campusId,
        timestamp: new Date().toISOString(),
        totalTenders: allTenders.length,
        newTenders: newTenders.length,
        cached: true
      }));

      // Cache metadata
      const metaKey = `${cacheKey}:meta`;
      await redis.setex(metaKey, CACHE_TTL.TENDER_DATA, JSON.stringify({
        lastUpdated: new Date().toISOString(),
        totalTenders: allTenders.length,
        newTenders: newTenders.length,
        campus: campusId
      }));

      console.log(`💾 Cached ${allTenders.length} tenders for ${campusId}`);
    } catch (error) {
      console.error(`Failed to cache data for ${campusId}:`, error);
    }
  }

  // Get job status for monitoring
  public getJobStatuses() {
    const statuses: Record<string, any> = {};

    for (const [campusId, job] of this.jobs) {
      const config = CAMPUS_CONFIGS.find(c => c.id === campusId);
      statuses[campusId] = {
        name: config?.name,
        status: job.status,
        lastRun: new Date(job.lastRun).toISOString(),
        nextRun: new Date(job.nextRun).toISOString(),
        successCount: job.successCount,
        errorCount: job.errorCount,
        lastError: job.lastError,
        priority: config?.priority,
        interval: config?.scrapeInterval
      };
    }

    return statuses;
  }

  // Force run a specific campus
  public async forceRun(campusId: string) {
    const job = this.jobs.get(campusId);
    if (job && job.status === 'idle') {
      await this.runScrapingJob(campusId);
      return true;
    }
    return false;
  }

  // Force run all campuses
  public async forceRunAll() {
    const promises = Array.from(this.jobs.keys()).map(campusId =>
      this.forceRun(campusId)
    );
    await Promise.allSettled(promises);
  }
}

// Singleton instance
export const centralizedScraper = new CentralizedScraper();

// Helper function to get cached data for API responses
export async function getCachedTenderData(campusId: string): Promise<any> {
  try {
    const cacheKey = CACHE_KEYS.tenderData(campusId);
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached as string);
    }

    // Fallback to database if cache miss
    console.log(`Cache miss for ${campusId}, falling back to database`);
    const dbTenders = await getAllTendersFromSupabase();
    const campusConfig = CAMPUS_CONFIGS.find(c => c.id === campusId);

    if (campusConfig) {
      const filteredTenders = dbTenders.filter(
        tender => tender.source?.toLowerCase() === campusConfig.name.toLowerCase()
      );

      return {
        success: true,
        data: filteredTenders,
        source: campusId,
        timestamp: new Date().toISOString(),
        totalTenders: filteredTenders.length,
        cached: false,
        fallback: 'database'
      };
    }

    return {
      success: false,
      data: [],
      source: campusId,
      error: 'Campus not found'
    };

  } catch (error) {
    console.error(`Error getting cached data for ${campusId}:`, error);
    return {
      success: false,
      data: [],
      source: campusId,
      error: 'Cache retrieval failed'
    };
  }
}

export default centralizedScraper;