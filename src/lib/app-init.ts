
// src/lib/app-init.ts
import { SubscriptionInitService } from './subscription-init';

let isInitialized = false;

/**
 * Initialize the application on startup
 * This should be called once when the app starts
 */
export async function initializeApp(): Promise<void> {
  if (isInitialized) {
    console.log('📱 App already initialized, skipping...');
    return;
  }

  try {
    console.log('🚀 Starting application initialization...');

    // Only initialize in server environment
    if (typeof window === 'undefined') {
      await SubscriptionInitService.initialize();
    }

    isInitialized = true;
    console.log('✅ Application initialized successfully');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    // Don't throw - app should still work with limited functionality
  }
}