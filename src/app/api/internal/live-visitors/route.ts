import { NextResponse } from "next/server";

/**
 * In-memory visitor tracking.
 * Each visitor is tracked by a session ID with a timestamp.
 * Sessions expire after 90 seconds without a heartbeat.
 */
const activeSessions = new Map<string, number>();

const SESSION_TTL_MS = 90_000; // 90 seconds

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [id, lastSeen] of activeSessions) {
    if (now - lastSeen > SESSION_TTL_MS) {
      activeSessions.delete(id);
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sessionId?: string };
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : "";

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    activeSessions.set(sessionId, Date.now());
    cleanExpiredSessions();

    return NextResponse.json({ count: activeSessions.size });
  } catch {
    return NextResponse.json({ count: activeSessions.size });
  }
}

export async function GET() {
  cleanExpiredSessions();
  return NextResponse.json({ count: activeSessions.size });
}
