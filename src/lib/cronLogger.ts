// src/lib/cronLogger.ts
import { supabase } from './supabase';

// Define log level types
export type LogLevel = 'info' | 'warn' | 'error' | 'success';

// Interface for log entry
export interface CronLogEntry {
  timestamp: string;
  job_name: string;
  status: string;
  message: string;
  level: LogLevel;
  details?: Record<string, unknown>;
}

/**
 * Logs cron job execution details to Supabase
 */
export async function logCronExecution(
  jobName: string,
  status: string,
  message: string,
  level: LogLevel = 'info',
  details?: Record<string, unknown>
): Promise<boolean> {
  try {
    // Current timestamp
    const timestamp = new Date().toISOString();

    // Log to console first
    const logPrefix = `[CRON:${jobName}] ${status}:`;

    // Console logging based on level
    switch (level) {
      case 'error':
        console.error(logPrefix, message, details || '');
        break;
      case 'warn':
        console.warn(logPrefix, message, details || '');
        break;
      case 'success':
        console.log(`✅ ${logPrefix}`, message, details || '');
        break;
      default:
        console.log(logPrefix, message, details || '');
    }

    // Create the log entry
    const logEntry: CronLogEntry = {
      timestamp,
      job_name: jobName,
      status,
      message,
      level,
      details: details ? details : undefined,
    };

    // Store in Supabase
    const { error } = await supabase
      .from('cron_logs')
      .insert(logEntry);

    if (error) {
      // If we fail to log to Supabase, at least log to console
      console.error('Failed to write cron log to database:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging cron execution:', error);
    return false;
  }
}

/**
 * Fetches recent cron job logs from Supabase
 */
export async function getRecentCronLogs(limit: number = 50): Promise<CronLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('cron_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching cron logs:', error);
      return [];
    }

    return data as CronLogEntry[];
  } catch (error) {
    console.error('Error fetching cron logs:', error);
    return [];
  }
}

/**
 * Gets the last execution time for a specific cron job
 */
export async function getLastCronExecutionTime(jobName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('cron_logs')
      .select('timestamp')
      .eq('job_name', jobName)
      .eq('status', 'completed')
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last cron execution time:', error);
      return null;
    }

    return data && data.length > 0 ? data[0].timestamp : null;
  } catch (error) {
    console.error('Error fetching last cron execution time:', error);
    return null;
  }
}