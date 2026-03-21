#!/usr/bin/env node

/**
 * Environment Variables Check Script
 * Verifies all required and optional environment variables are configured
 */

// Critical - App will not work without these
const criticalEnvVars = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

// Security - Required for production security features
const securityEnvVars = [
  "CSRF_SECRET",
  "ORDER_LOOKUP_SECRET",
];

// Optional - Features work without these but with limited functionality
const optionalEnvVars = [
  "GROQ_API",
  "NEXT_PUBLIC_FACEBOOK_PIXEL_ID",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_USAGE_MODE",
  "CATALOG_ADMIN_ACCESS_CODE",
  "CATALOG_ADMIN_PATH_TOKEN",
  "VPNAPI_KEY",
  "DISCORD_WEBHOOK_URL",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "EMAIL_FROM",
];

const isProduction = process.env.NODE_ENV === "production";

const missingCritical = [];
const missingSecurity = [];
const missingOptional = [];

// Check critical variables
for (const envVar of criticalEnvVars) {
  const value = process.env[envVar];
  if (!value || value.trim() === "" || value.startsWith("your_")) {
    missingCritical.push(envVar);
  }
}

// Check security variables (required in production)
for (const envVar of securityEnvVars) {
  const value = process.env[envVar];
  if (!value || value.trim() === "" || value.startsWith("your_")) {
    if (isProduction) {
      missingSecurity.push(envVar);
    }
  }
}

// Check optional variables (just warn)
for (const envVar of optionalEnvVars) {
  const value = process.env[envVar];
  if (!value || value.trim() === "") {
    missingOptional.push(envVar);
  }
}

// Report results
let hasErrors = false;

if (missingCritical.length > 0) {
  console.error("\n❌ CRITICAL: Missing required environment variables:");
  for (const envVar of missingCritical) {
    console.error(`   - ${envVar}`);
  }
  hasErrors = true;
}

if (missingSecurity.length > 0) {
  console.error("\n❌ SECURITY: Missing security environment variables (required in production):");
  for (const envVar of missingSecurity) {
    console.error(`   - ${envVar}`);
  }
  hasErrors = true;
}

if (missingOptional.length > 0) {
  console.warn("\n⚠️  OPTIONAL: Some features may be limited without these variables:");
  for (const envVar of missingOptional) {
    console.warn(`   - ${envVar}`);
  }
  console.warn("");
}

if (hasErrors) {
  console.error("\n🛑 Fix these issues before deploying to production.\n");
  process.exit(1);
}

console.log("\n✅ All required environment variables are configured.\n");
if (missingOptional.length > 0) {
  console.log(`ℹ️  ${missingOptional.length} optional variables not set (some features may be limited).\n`);
}

process.exit(0);