'use server';
// This file is used to initialize server-only services
// It's marked with 'use server' to ensure it only runs on the server

import { initializeServices } from "./service-init";
import { ENABLE_RULES_POLLING, RULES_POLLING_INTERVAL_MINUTES, IS_PRODUCTION } from "./env";
import { withRetry } from "./db";

// Flag to ensure we only initialize once
let isInitialized = false;

/**
 * Initialize all server-side services
 * This should be called from server components only
 */
export async function initializeServerServices(): Promise<void> {
  // Skip if already initialized or not in production
  // In development, initialization happens on-demand via the API
  if (isInitialized || !IS_PRODUCTION) {
    return;
  }
  
  console.log('Initializing server-side services...');
  
  try {
    // Initialize all services with environment-based configuration
    // Wrap in Promise to fix type error
    await withRetry(() => Promise.resolve(initializeServices({
      enableRulesPolling: ENABLE_RULES_POLLING,
      rulesPollingIntervalMinutes: RULES_POLLING_INTERVAL_MINUTES,
    })));
    
    isInitialized = true;
    console.log('Server-side services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize server-side services:', error);
  }
}

/**
 * Status check for server services
 * Returns the current state of server-side services
 */
export async function getServerServicesStatus(): Promise<{
  initialized: boolean;
  rulesPollingEnabled: boolean;
}> {
  // This is just for status checking, not for actual initialization
  const { isRulesPollingEnabled } = await import('./service-init');
  
  return {
    initialized: isInitialized,
    rulesPollingEnabled: isRulesPollingEnabled(),
  };
} 