#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("node:fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const contractPath = path.join(rootDir, "config", "env-contract.json");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;

    const rawValue = line.slice(separatorIndex + 1).trim();
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function readContract() {
  return JSON.parse(fs.readFileSync(contractPath, "utf8"));
}

function normalizeValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isMissingValue(value) {
  return normalizeValue(value).length === 0;
}

function isPlaceholderValue(value) {
  const normalized = normalizeValue(value).toLowerCase();
  if (!normalized) return true;

  return (
    normalized.startsWith("your_") ||
    normalized.startsWith("replace_") ||
    normalized.startsWith("example_") ||
    normalized === "changeme" ||
    normalized === "placeholder" ||
    normalized === "todo"
  );
}

function isAllowedCiDummy(variable, value) {
  const allowCiDummy = process.env.CI_ALLOW_DUMMY_ENV === "1";
  const normalized = normalizeValue(value).toLowerCase();
  if (!allowCiDummy || !variable.ciDummyAllowed || !normalized) {
    return false;
  }

  return (
    normalized.includes("ci-dummy") ||
    normalized === "dummy" ||
    normalized.startsWith("dummy-")
  );
}

function getEnvLookup(variable) {
  const names = [variable.name].concat(variable.aliases || []);
  for (const name of names) {
    const value = normalizeValue(process.env[name]);
    if (value) {
      return { key: name, value };
    }
  }

  return { key: null, value: "" };
}

function isRequired(variable, isProduction) {
  return isProduction
    ? variable.requiredInProduction === true
    : variable.requiredInDevelopment === true;
}

function parseExampleEnvVariables(filePath) {
  const declared = new Set();
  if (!fs.existsSync(filePath)) return declared;

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Z0-9_]+)=/);
    if (match) {
      declared.add(match[1]);
    }
  }

  return declared;
}

function validateDocumentation(contract) {
  const mismatches = [];
  const documentationFiles = contract.documentationFiles || [];

  for (const relativePath of documentationFiles) {
    const absolutePath = path.join(rootDir, relativePath);
    if (!fs.existsSync(absolutePath)) {
      mismatches.push(`${relativePath}: missing documentation file`);
      continue;
    }

    if (relativePath === ".env.example") {
      const declared = parseExampleEnvVariables(absolutePath);
      for (const variable of contract.variables) {
        if (!declared.has(variable.name)) {
          mismatches.push(
            `${relativePath}: missing canonical variable ${variable.name}`,
          );
        }
      }
      continue;
    }

    const content = fs.readFileSync(absolutePath, "utf8");
    for (const variable of contract.variables) {
      if (!content.includes(variable.name)) {
        mismatches.push(
          `${relativePath}: variable ${variable.name} is not documented`,
        );
      }
    }
  }

  return mismatches;
}

function main() {
  loadEnvFile(path.join(rootDir, ".env"));
  loadEnvFile(path.join(rootDir, ".env.local"));

  const contract = readContract();
  const isProduction = process.env.NODE_ENV === "production";
  const enforceRealValues =
    isProduction || process.env.STRICT_ENV_VALUES === "1";
  const missingRequired = [];
  const missingOptional = [];
  const legacyAliasWarnings = [];
  const categoryCounts = new Map();

  for (const variable of contract.variables) {
    const lookup = getEnvLookup(variable);
    const required = isRequired(variable, isProduction);
    const missing = isMissingValue(lookup.value);
    const placeholder =
      !missing &&
      isPlaceholderValue(lookup.value) &&
      !isAllowedCiDummy(variable, lookup.value);
    const usingAlias = lookup.key && lookup.key !== variable.name;

    categoryCounts.set(
      variable.category,
      (categoryCounts.get(variable.category) || 0) + 1,
    );

    if (usingAlias) {
      legacyAliasWarnings.push(
        `${variable.name}: using legacy alias ${lookup.key}; migrate to ${variable.name}`,
      );
    }

    if (required && (missing || (enforceRealValues && placeholder))) {
      missingRequired.push({
        name: variable.name,
        category: variable.category,
        reason: missing ? "missing value" : `placeholder value in ${lookup.key}`,
      });
      continue;
    }

    if (!required && (missing || placeholder)) {
      missingOptional.push({
        name: variable.name,
        category: variable.category,
        reason: missing ? "not configured" : "placeholder value",
      });
    }
  }

  const documentationMismatches = validateDocumentation(contract);

  console.log("");
  console.log(`Environment contract: ${path.relative(rootDir, contractPath)}`);
  console.log(`Mode: ${isProduction ? "production" : "development"}`);
  console.log(`Strict values: ${enforceRealValues ? "enabled" : "disabled"}`);
  console.log(
    `Variables in contract: ${contract.variables.length} (${Array.from(categoryCounts.entries())
      .map(([category, count]) => `${category}:${count}`)
      .join(", ")})`,
  );

  if (missingRequired.length > 0) {
    console.error("");
    console.error("ERROR: Missing required environment variables");
    for (const entry of missingRequired) {
      console.error(` - [${entry.category}] ${entry.name}: ${entry.reason}`);
    }
  }

  if (documentationMismatches.length > 0) {
    console.error("");
    console.error("ERROR: Environment contract drift detected");
    for (const entry of documentationMismatches) {
      console.error(` - ${entry}`);
    }
  }

  if (legacyAliasWarnings.length > 0) {
    console.warn("");
    console.warn("WARN: Legacy aliases detected");
    for (const entry of legacyAliasWarnings) {
      console.warn(` - ${entry}`);
    }
  }

  if (missingOptional.length > 0) {
    console.warn("");
    console.warn("WARN: Optional or non-required variables missing");
    for (const entry of missingOptional) {
      console.warn(` - [${entry.category}] ${entry.name}: ${entry.reason}`);
    }
  }

  if (missingRequired.length > 0 || documentationMismatches.length > 0) {
    console.error("");
    console.error("check-env failed.");
    process.exit(1);
  }

  console.log("");
  console.log("check-env passed.");
  if (missingOptional.length > 0) {
    console.log(
      `Optional warnings: ${missingOptional.length}. Features may run in degraded mode.`,
    );
  }
  console.log("");
}

main();
