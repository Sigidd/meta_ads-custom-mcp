import { Suspense } from "react";

function ConnectContent({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error;
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: "2.5rem", maxWidth: 420, width: "90%", boxShadow: "0 2px 16px rgba(0,0,0,0.1)", textAlign: "center" }}>
        <img src="/icon.png" alt="Meta Ads" width={64} height={64} style={{ borderRadius: 12, marginBottom: "1rem" }} />
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem", color: "#1c1e21" }}>Meta Ads MCP</h1>
        {error ? (
          <>
            <p style={{ color: "#e41c1c", background: "#fff2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "0.75rem", fontSize: "0.9rem", margin: "1rem 0" }}>{error}</p>
            <p style={{ color: "#666", fontSize: "0.85rem", marginTop: "1rem" }}>Restart the connection from your MCP client and try again.</p>
          </>
        ) : (
          <>
            <p style={{ color: "#666", marginBottom: "1rem" }}>Redirecting to Meta for authentication...</p>
            <div style={{ display: "inline-block", width: 24, height: 24, border: "3px solid #0081FB", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConnectPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <Suspense>
      <ConnectContent searchParams={searchParams} />
    </Suspense>
  );
}
