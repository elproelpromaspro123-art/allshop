"use client";

import { RotateCcw, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es-CO" style={{ background: "#f8fafc" }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error crítico | Vortixy</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top right, rgba(16,185,129,0.12), transparent 34%), linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
          color: "#0f172a",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: "620px",
              borderRadius: "28px",
              border: "1px solid rgba(148,163,184,0.28)",
              background: "rgba(255,255,255,0.88)",
              boxShadow: "0 30px 90px rgba(15,23,42,0.12)",
              padding: "28px",
              textAlign: "center",
              backdropFilter: "blur(18px)",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                margin: "0 auto 22px",
                borderRadius: 24,
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(251,113,133,0.08))",
                border: "1px solid rgba(248,113,113,0.25)",
              }}
            >
              <ShieldAlert className="h-8 w-8" style={{ color: "#dc2626" }} />
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Error crítico
            </p>
            <h1 style={{ margin: "10px 0 12px", fontSize: 32, lineHeight: 1, fontWeight: 900 }}>
              La aplicación no pudo renderizar
            </h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: 15 }}>
              La UI global falló al cargar. Usa el botón de recarga si el problema fue temporal
              o vuelve al inicio para continuar navegando.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: 24,
              }}
            >
              <button
                onClick={() => reset()}
                style={{
                  minHeight: 48,
                  padding: "0 18px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #047857, #0f766e)",
                  color: "#fff",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 16px 32px rgba(16,185,129,0.18)",
                  cursor: "pointer",
                }}
              >
                <RotateCcw className="h-5 w-5" />
                Recargar la aplicación
              </button>

              <Link
                href="/"
                style={{
                  minHeight: 48,
                  padding: "0 18px",
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "#fff",
                  color: "#0f172a",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                }}
              >
                Volver al inicio
              </Link>

              <Link
                href="/soporte"
                style={{
                  minHeight: 48,
                  padding: "0 18px",
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "#fff",
                  color: "#0f172a",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                }}
              >
                Soporte
              </Link>
            </div>

            {error.digest ? (
              <div
                style={{
                  marginTop: 20,
                  borderRadius: 16,
                  border: "1px solid rgba(226,232,240,0.9)",
                  background: "rgba(248,250,252,0.9)",
                  padding: 14,
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                  }}
                >
                  Referencia
                </p>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                    fontSize: 12,
                    color: "#334155",
                    wordBreak: "break-all",
                  }}
                >
                  {error.digest}
                </p>
              </div>
            ) : null}
          </section>
        </main>
      </body>
    </html>
  );
}
