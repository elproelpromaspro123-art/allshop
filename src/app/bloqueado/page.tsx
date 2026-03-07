export default function BlockedPage() {
    return (
        <div
            style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                background: "#0a0b0f",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                margin: 0,
                padding: "20px",
            }}
        >
            <div
                style={{
                    background: "#1a1b2e",
                    borderRadius: "20px",
                    padding: "48px 36px",
                    maxWidth: "480px",
                    textAlign: "center",
                    border: "1px solid rgba(239,68,68,0.3)",
                    boxShadow: "0 0 60px rgba(239,68,68,0.1)",
                }}
            >
                <div
                    style={{
                        width: "72px",
                        height: "72px",
                        borderRadius: "50%",
                        background: "rgba(239,68,68,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px",
                        fontSize: "32px",
                    }}
                >
                    🚫
                </div>
                <h1
                    style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        marginBottom: "12px",
                        color: "#ef4444",
                    }}
                >
                    Acceso Bloqueado
                </h1>
                <p
                    style={{
                        color: "#a0a0b0",
                        lineHeight: 1.7,
                        fontSize: "0.95rem",
                        marginBottom: "24px",
                    }}
                >
                    Has sido bloqueado de esta página por violar las normas éticas.
                </p>
                <div
                    style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: "12px",
                        padding: "16px",
                        fontSize: "0.85rem",
                        color: "#888",
                        lineHeight: 1.6,
                    }}
                >
                    Si crees que esto es un error, contacta a soporte con tu caso.
                </div>
            </div>
        </div>
    );
}
