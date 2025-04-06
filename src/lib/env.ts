// Environment configuration

// API keys
export const AEROAPI_KEY = process.env.AEROAPI_KEY || "";
export const CRON_API_KEY = process.env.CRON_API_KEY || "";

// Feature flags
export const ENABLE_RULES_POLLING = process.env.ENABLE_RULES_POLLING === "true";
export const RULES_POLLING_INTERVAL_MINUTES = parseInt(process.env.RULES_POLLING_INTERVAL_MINUTES || "10", 10);

// Environment detection
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
export const IS_TEST = process.env.NODE_ENV === "test"; 