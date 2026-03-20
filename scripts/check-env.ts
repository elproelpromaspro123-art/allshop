#!/usr/bin/env node
const requiredEnvVars = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "CSRF_SECRET",
  "ORDER_LOOKUP_SECRET",
];

const missing = [];

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value || value.trim() === "" || value.startsWith("your_")) {
    missing.push(envVar);
  }
}

if (missing.length > 0) {
  console.error(`[Env Check] Missing required environment variables in production:`);
  for (const envVar of missing) {
    console.error(`  - ${envVar}`);
  }
  console.error("");
  console.error("Set these variables in your production environment before deploying.");
  process.exit(1);
}

console.log("[Env Check] All required environment variables are set.");
process.exit(0);