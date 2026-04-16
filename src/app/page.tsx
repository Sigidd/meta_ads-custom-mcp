const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://meta-ads-custom-mcp.vercel.app";

const TOOLS = [
  {
    category: "User & Accounts",
    tools: [
      { name: "get_me", desc: "Get authenticated user profile" },
      { name: "list_ad_accounts", desc: "List all accessible ad accounts" },
      { name: "get_ad_account", desc: "Get ad account details" },
      { name: "list_businesses", desc: "List all Business Managers" },
      { name: "get_business", desc: "Get Business Manager details" },
      { name: "list_business_ad_accounts", desc: "List ad accounts in a business" },
    ],
  },
  {
    category: "Campaigns",
    tools: [
      { name: "list_campaigns", desc: "List campaigns for an ad account" },
      { name: "get_campaign", desc: "Get campaign details" },
      { name: "create_campaign", desc: "Create a new campaign" },
      { name: "update_campaign", desc: "Update campaign settings" },
      { name: "delete_campaign", desc: "Delete a campaign" },
    ],
  },
  {
    category: "Ad Sets",
    tools: [
      { name: "list_ad_sets", desc: "List ad sets for an ad account" },
      { name: "get_ad_set", desc: "Get ad set details" },
      { name: "create_ad_set", desc: "Create a new ad set" },
      { name: "update_ad_set", desc: "Update ad set settings" },
      { name: "delete_ad_set", desc: "Delete an ad set" },
    ],
  },
  {
    category: "Ads",
    tools: [
      { name: "list_ads", desc: "List ads for an ad account" },
      { name: "get_ad", desc: "Get ad details" },
      { name: "create_ad", desc: "Create a new ad" },
      { name: "update_ad", desc: "Update ad settings" },
      { name: "delete_ad", desc: "Delete an ad" },
    ],
  },
  {
    category: "Ad Creatives",
    tools: [
      { name: "list_ad_creatives", desc: "List ad creatives" },
      { name: "get_ad_creative", desc: "Get ad creative details" },
      { name: "create_ad_creative", desc: "Create a new ad creative" },
    ],
  },
  {
    category: "Insights",
    tools: [
      { name: "get_insights", desc: "Get performance metrics for any object level" },
    ],
  },
  {
    category: "Pages",
    tools: [
      { name: "list_pages", desc: "List managed Facebook Pages" },
      { name: "get_page", desc: "Get Page details" },
      { name: "get_page_insights", desc: "Get Page performance analytics" },
    ],
  },
  {
    category: "Audiences",
    tools: [
      { name: "list_custom_audiences", desc: "List custom audiences" },
      { name: "get_custom_audience", desc: "Get custom audience details" },
      { name: "create_custom_audience", desc: "Create a custom audience" },
      { name: "list_saved_audiences", desc: "List saved audiences" },
    ],
  },
  {
    category: "Targeting",
    tools: [
      { name: "search_targeting", desc: "Search interests, behaviors, locations, etc." },
    ],
  },
  {
    category: "Media",
    tools: [
      { name: "list_ad_images", desc: "List uploaded ad images" },
      { name: "list_ad_videos", desc: "List uploaded ad videos" },
    ],
  },
];

export default function HomePage() {
  const mcpEndpoint = `${BASE_URL}/mcp`;
  const totalTools = TOOLS.reduce((sum, cat) => sum + cat.tools.length, 0);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem", color: "#1c1e21" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid #e4e6eb", paddingBottom: "1.5rem" }}>
        <img src="/icon.png" alt="Meta Ads" width={56} height={56} style={{ borderRadius: 12 }} />
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Meta Ads MCP</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#65676b", fontSize: "1rem" }}>
            MCP server connecting Claude to the Meta Ads API — {totalTools} tools
          </p>
        </div>
      </div>

      {/* MCP Endpoint */}
      <section style={{ background: "#f0f2f5", borderRadius: 8, padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontWeight: 600, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#65676b" }}>MCP Endpoint</p>
        <code style={{ fontSize: "1rem", color: "#0081FB", fontFamily: "monospace", wordBreak: "break-all" }}>{mcpEndpoint}</code>
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem", color: "#65676b" }}>
          Add this URL as a remote MCP connector in Claude. Authentication is handled automatically via OAuth 2.1 with Facebook Login.
        </p>
      </section>

      {/* Supabase Schema */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>Supabase Schema</h2>
        <pre style={{ background: "#1c1e21", color: "#e4e6eb", padding: "1.25rem", borderRadius: 8, overflow: "auto", fontSize: "0.8rem", lineHeight: 1.5 }}>{`CREATE TABLE IF NOT EXISTS mcp_credentials (
  user_id TEXT PRIMARY KEY,
  data    JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS mcp_oauth_sessions (
  session_id TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS mcp_auth_codes (
  code       TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS mcp_access_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS mcp_oauth_clients (
  client_id TEXT PRIMARY KEY,
  data      JSONB NOT NULL
);
GRANT ALL ON mcp_credentials TO anon;
GRANT ALL ON mcp_oauth_sessions TO anon;
GRANT ALL ON mcp_auth_codes TO anon;
GRANT ALL ON mcp_access_tokens TO anon;
GRANT ALL ON mcp_oauth_clients TO anon;`}</pre>
      </section>

      {/* Tools */}
      <section>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>Tools ({totalTools})</h2>
        {TOOLS.map((cat) => (
          <div key={cat.category} style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#0081FB", marginBottom: "0.5rem", margin: "0 0 0.5rem" }}>{cat.category}</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <tbody>
                {cat.tools.map((tool) => (
                  <tr key={tool.name} style={{ borderBottom: "1px solid #e4e6eb" }}>
                    <td style={{ padding: "0.5rem 0.75rem 0.5rem 0", width: "45%", fontFamily: "monospace", color: "#1c1e21", fontWeight: 500 }}>{tool.name}</td>
                    <td style={{ padding: "0.5rem 0", color: "#65676b" }}>{tool.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      <footer style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid #e4e6eb", color: "#65676b", fontSize: "0.85rem", textAlign: "center" }}>
        Meta Ads MCP — built with Next.js 15 and @vercel/mcp-adapter
      </footer>
    </main>
  );
}
