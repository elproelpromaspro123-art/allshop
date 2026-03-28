import { NextResponse } from "next/server";
import { isDiscordConfigured, sendVisitorAlertToDiscord } from "@/lib/discord-visitors";
import { validateSameOrigin } from "@/lib/csrf";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { logger } from "@/lib/logger";

/**
 * Real-time visitor tracking with bot filtering.
 * Tracks human visitors only, filtering out bots, crawlers, and suspicious traffic.
 */

const VISITOR_TTL_MS = 90_000; // 90 seconds
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between alerts for same IP
const MIN_SESSION_DURATION_MS = 3_000; // 3 seconds minimum to be considered human

const activeVisitors = new Map<string, VisitorSession>();
const lastAlertTime = new Map<string, number>();
const visitorHistory = new Map<string, number[]>();

interface VisitorSession {
  sessionId: string;
  ip: string;
  userAgent: string;
  firstSeen: number;
  lastSeen: number;
  pageViews: number;
  paths: string[];
  isHuman: boolean;
  botScore: number;
}

interface VisitorPayload {
  sessionId?: string;
  path?: string;
  referrer?: string;
}

// Bot patterns to filter out
const BOT_PATTERNS = [
  // Search engine bots
  /googlebot/i,
  /bingbot/i,
  /slurp/i, // Yahoo
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  
  // Social media bots
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /pinterest/i,
  
  // SEO/Analytics bots
  /ahrefsbot/i,
  /semrush/i,
  /mj12bot/i,
  /rogerbot/i,
  
  // Generic bot patterns
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python/i,
  /java/i,
  /httpclient/i,
  
  // Monitoring services
  /uptimerobot/i,
  /pingdom/i,
  /statuscake/i,
];

// Additional bot detection headers
const BOT_HEADERS = [
  "x-headless-chrome",
  "x-phantomjs",
  "x-selenium",
  "x-puppeteer",
  "x-playwright",
];

function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  
  return "unknown";
}

function isBotUserAgent(userAgent: string): boolean {
  if (!userAgent) return true; // Empty UA = likely bot
  
  // Check against known bot patterns
  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return true;
    }
  }
  
  return false;
}

function hasBotHeaders(request: Request): boolean {
  for (const header of BOT_HEADERS) {
    if (request.headers.has(header)) {
      return true;
    }
  }
  
  // Check for suspicious header patterns
  const ua = request.headers.get("user-agent") || "";
  if (ua.length < 20) return true; // Very short UA = suspicious
  
  return false;
}

function calculateBotScore(request: Request, userAgent: string): number {
  let score = 0;
  
  // Bot UA patterns (high weight)
  if (isBotUserAgent(userAgent)) {
    score += 50;
  }
  
  // Bot detection headers (high weight)
  if (hasBotHeaders(request)) {
    score += 40;
  }
  
  // Missing or suspicious headers
  if (!request.headers.has("accept-language")) {
    score += 15;
  }
  
  if (!request.headers.has("sec-ch-ua") && !userAgent.includes("Firefox")) {
    score += 10; // Modern browsers send this
  }
  
  // Very short session or rapid requests
  const ip = extractClientIp(request);
  const history = visitorHistory.get(ip) || [];
  if (history.length > 10) {
    const recentRequests = history.filter(
      (t) => Date.now() - t < 1000
    );
    if (recentRequests.length > 5) {
      score += 30; // More than 5 requests per second
    }
  }
  
  return Math.min(100, score);
}

function isLikelyHuman(score: number, sessionDuration: number, pageViews: number): boolean {
  // High bot score = not human
  if (score >= 40) return false;
  
  // Multiple page views = likely human
  if (pageViews >= 3) return true;
  
  // Session longer than minimum = likely human
  if (sessionDuration >= MIN_SESSION_DURATION_MS) return true;
  
  // Low score but short session = still likely human (early visit)
  if (score < 20) return true;
  
  return false;
}

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [id, visitor] of activeVisitors.entries()) {
    if (now - visitor.lastSeen > VISITOR_TTL_MS) {
      activeVisitors.delete(id);
    }
  }
}

function shouldSendAlert(visitor: VisitorSession): boolean {
  const ip = visitor.ip;
  const now = Date.now();
  
  // Don't alert for bots
  if (!visitor.isHuman) return false;
  
  // Check cooldown for this IP
  const lastAlert = lastAlertTime.get(ip) || 0;
  if (now - lastAlert < ALERT_COOLDOWN_MS) {
    return false;
  }
  
  // Only alert if visitor has shown human behavior
  const sessionDuration = visitor.lastSeen - visitor.firstSeen;
  if (sessionDuration < MIN_SESSION_DURATION_MS && visitor.pageViews < 2) {
    return false;
  }
  
  return true;
}

export async function POST(request: Request) {
  if (!validateSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
    key: `visitor-alert:${clientIp}`,
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const body = (await request.json()) as VisitorPayload;
    const sessionId = typeof body.sessionId === "string" 
      ? body.sessionId.slice(0, 64) 
      : "";
    
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }
    
    const ip = extractClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    const path = body.path || "/";
    const now = Date.now();
    
    // Calculate bot score
    const botScore = calculateBotScore(request, userAgent);
    
    // Get or create visitor session
    let visitor = activeVisitors.get(sessionId);
    
    if (!visitor) {
      // New visitor
      visitor = {
        sessionId,
        ip,
        userAgent,
        firstSeen: now,
        lastSeen: now,
        pageViews: 1,
        paths: [path],
        isHuman: false, // Will be updated after analysis
        botScore,
      };
      activeVisitors.set(sessionId, visitor);
    } else {
      // Returning visitor - update session
      visitor.lastSeen = now;
      visitor.pageViews++;
      if (!visitor.paths.includes(path)) {
        visitor.paths.push(path);
      }
      
      // Re-evaluate if human based on behavior
      const sessionDuration = visitor.lastSeen - visitor.firstSeen;
      visitor.isHuman = isLikelyHuman(visitor.botScore, sessionDuration, visitor.pageViews);
    }
    
    // Track request history for rate analysis
    const history = visitorHistory.get(ip) || [];
    history.push(now);
    // Keep only last 60 seconds of history
    visitorHistory.set(
      ip, 
      history.filter((t) => now - t < 60_000)
    );
    
    cleanExpiredSessions();
    
    // Send Discord alert if this is a real human visitor
    if (shouldSendAlert(visitor) && isDiscordConfigured()) {
      // Update last alert time
      lastAlertTime.set(ip, now);
      
      // Send async to not block response
      sendVisitorAlertToDiscord({
        ip,
        userAgent,
        path,
        referrer: body.referrer || null,
        sessionId,
        pageViews: visitor.pageViews,
        paths: visitor.paths,
        sessionDuration: visitor.lastSeen - visitor.firstSeen,
        botScore: visitor.botScore,
      }).catch((err) => {
        logger.error("[Visitor Alert] Discord send failed", { error: err });
      });
    }
    
    return NextResponse.json({ 
      count: activeVisitors.size,
      isHuman: visitor.isHuman,
      botScore,
    });
  } catch (error) {
    logger.error("[Visitor Tracking] Error", { error });
    return NextResponse.json({ 
      count: activeVisitors.size,
      error: "Tracking failed",
    });
  }
}

export async function GET() {
  cleanExpiredSessions();
  
  const humanVisitors = Array.from(activeVisitors.values())
    .filter((v) => v.isHuman)
    .length;
  
  return NextResponse.json({ 
    count: activeVisitors.size,
    humanCount: humanVisitors,
  });
}
