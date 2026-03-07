import { NextRequest, NextResponse } from "next/server";
import { blockIp, unblockIp } from "@/lib/ip-block";
import { sendBlockNotificationToDiscord } from "@/lib/discord";

/**
 * API endpoint to block/unblock IPs from Discord moderation links.
 * Protected by ADMIN_BLOCK_SECRET to prevent unauthorized access.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get("ip");
    const duration = searchParams.get("duration") as "permanent" | "24h" | "1h" | null;
    const secret = searchParams.get("secret");
    const action = searchParams.get("action") || "block";

    const adminSecret =
        process.env.ADMIN_BLOCK_SECRET || process.env.ORDER_LOOKUP_SECRET;
    if (!adminSecret || secret !== adminSecret) {
        return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    if (!ip) {
        return NextResponse.json({ error: "IP requerida." }, { status: 400 });
    }

    if (action === "unblock") {
        unblockIp(ip);
        return NextResponse.json({
            ok: true,
            message: `IP ${ip} desbloqueada exitosamente.`,
        });
    }

    if (!duration || !["permanent", "24h", "1h"].includes(duration)) {
        return NextResponse.json(
            { error: 'Duración inválida. Usa: permanent, 24h, o 1h.' },
            { status: 400 }
        );
    }

    const durationLabels: Record<string, string> = {
        permanent: "Permanente",
        "24h": "24 horas",
        "1h": "1 hora",
    };

    blockIp(ip, duration, "Bloqueado desde Discord por administrador");

    await sendBlockNotificationToDiscord(
        ip,
        durationLabels[duration] || duration,
        "Bloqueado desde Discord por administrador"
    );

    // Return a nice HTML page so the admin sees feedback in the browser
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IP Bloqueada — Vortixy Admin</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0a0b0f; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #1a1b2e; border-radius: 16px; padding: 40px; max-width: 420px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
        h1 { font-size: 1.5rem; margin-bottom: 12px; color: #ef4444; }
        p { color: #a0a0b0; line-height: 1.6; }
        .ip { font-family: monospace; background: rgba(239,68,68,0.15); padding: 4px 12px; border-radius: 8px; color: #ef4444; font-size: 1.1rem; }
        .duration { color: #f59e0b; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🚫 IP Bloqueada</h1>
        <p>La IP <span class="ip">${ip}</span> ha sido bloqueada por <span class="duration">${durationLabels[duration]}</span>.</p>
        <p style="margin-top:16px;font-size:0.85rem;color:#666;">Puedes cerrar esta pestaña. El bloqueo ya está activo.</p>
      </div>
    </body>
    </html>
  `;

    return new NextResponse(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}
