// This file initializes all the services needed for flight tracking, rule processing,
// and alert monitoring. It's a central place to start and stop the services.

import { processRules } from "./rule-processor";

// Service initialization settings
let rulesPollingEnabled = false;
let rulesPollingInterval: NodeJS.Timeout | null = null;

/**
 * Start the rules polling service
 * @param intervalMinutes How frequently to poll for rule updates (in minutes)
 */
export function startRulesPolling(intervalMinutes: number = 10): void {
  if (rulesPollingEnabled) {
    console.log("Rules polling already enabled");
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
  if (!rulesPollingEnabled || !rulesPollingInterval) {
    console.log("Rules polling not running");
    return;
  }
  
  console.log("Stopping rules polling service");
  clearInterval(rulesPollingInterval);
  rulesPollingInterval = null;
  rulesPollingEnabled = false;
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
  
  // Start rules polling if enabled
  if (enableRulesPolling) {
    startRulesPolling(rulesPollingIntervalMinutes);
  }
  
  console.log("Services initialized with options:", options);
} 