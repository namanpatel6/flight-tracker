// This file initializes all the services needed for flight tracking, rule processing,
// and alert monitoring. It's a central place to start and stop the services.

import { processRules } from "./rule-processor";
import { processTrackedFlightsWithAlerts } from "./alert-monitor";

// Service initialization settings
let rulesPollingEnabled = false;
let rulesPollingInterval: NodeJS.Timeout | null = null;

// Tiered polling intervals
let nearTermPollingEnabled = false;
let midTermPollingEnabled = false;
let longTermPollingEnabled = false;

let nearTermInterval: NodeJS.Timeout | null = null;
let midTermInterval: NodeJS.Timeout | null = null;
let longTermInterval: NodeJS.Timeout | null = null;

// Flag to detect if we're in a build process
const IS_BUILD_PROCESS = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

/**
 * Start the optimized tiered polling service
 */
export function startOptimizedPolling(): void {
  if (nearTermPollingEnabled || midTermPollingEnabled || longTermPollingEnabled) {
    console.log("Optimized polling already enabled");
    return;
  }

  console.log("Starting optimized tiered polling service");
  
  // Near-term flights (within 12 hours) - poll every 15 minutes
  nearTermInterval = setInterval(() => {
    processTrackedFlightsWithAlerts().catch(error => {
      console.error("Error in near-term flight processing:", error);
    });
  }, 15 * 60 * 1000); // 15 minutes
  nearTermPollingEnabled = true;
  
  // Mid-term flights (12-24 hours away) - poll every hour
  midTermInterval = setInterval(() => {
    processTrackedFlightsWithAlerts().catch(error => {
      console.error("Error in mid-term flight processing:", error);
    });
  }, 60 * 60 * 1000); // 1 hour
  midTermPollingEnabled = true;
  
  // Long-term flights (>24 hours away) - poll every 6 hours
  longTermInterval = setInterval(() => {
    processTrackedFlightsWithAlerts().catch(error => {
      console.error("Error in long-term flight processing:", error);
    });
  }, 6 * 60 * 60 * 1000); // 6 hours
  longTermPollingEnabled = true;
  
  // Also process rules on a regular basis
  startRulesPolling(30); // Process rules every 30 minutes
}

/**
 * Stop the optimized tiered polling service
 */
export function stopOptimizedPolling(): void {
  if (nearTermInterval) {
    clearInterval(nearTermInterval);
    nearTermInterval = null;
    nearTermPollingEnabled = false;
  }
  
  if (midTermInterval) {
    clearInterval(midTermInterval);
    midTermInterval = null;
    midTermPollingEnabled = false;
  }
  
  if (longTermInterval) {
    clearInterval(longTermInterval);
    longTermInterval = null;
    longTermPollingEnabled = false;
  }
  
  console.log("Stopped optimized tiered polling service");
}

/**
 * Start the rules polling service
 * @param intervalMinutes How frequently to poll for rule updates (in minutes)
 */
export function startRulesPolling(intervalMinutes: number = 10): void {
  if (rulesPollingEnabled) {
    console.log("Rules polling already enabled");
    return;
  }

  // Skip polling during build process to avoid database contention
  if (IS_BUILD_PROCESS) {
    console.log("Skipping rules polling during build process");
    rulesPollingEnabled = false;
    return;
  }

  console.log(`Starting rules polling service (interval: ${intervalMinutes} minutes)`);
  
  // Process rules immediately once
  processRules().catch(error => {
    console.error("Error in initial rules processing:", error);
  });
  
  // Then start periodic processing
  rulesPollingInterval = setInterval(() => {
    processRules().catch(error => {
      console.error("Error in rules processing:", error);
    });
  }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
  
  rulesPollingEnabled = true;
}

/**
 * Stop the rules polling service
 */
export function stopRulesPolling(): void {
  if (rulesPollingInterval) {
    clearInterval(rulesPollingInterval);
    rulesPollingInterval = null;
    rulesPollingEnabled = false;
    console.log("Stopped rules polling service");
  }
}

/**
 * Check if rules polling is enabled
 */
export function isRulesPollingEnabled(): boolean {
  return rulesPollingEnabled;
}

/**
 * Initialize all services
 * This can be called during app startup to begin monitoring
 * @param options Configuration options
 */
export function initializeServices(options: {
  enableRulesPolling?: boolean;
  rulesPollingIntervalMinutes?: number;
} = {}): void {
  const {
    enableRulesPolling = false,
    rulesPollingIntervalMinutes = 10
  } = options;
  
  // Skip polling during build process
  if (IS_BUILD_PROCESS) {
    console.log("Skipping service initialization during build process");
    return;
  }
  
  // Start rules polling if enabled
  if (enableRulesPolling) {
    startRulesPolling(rulesPollingIntervalMinutes);
  }
  
  console.log("Services initialized with options:", options);
} 