# Meta Ads MCP

A remote MCP server that connects Claude to the Meta Ads API (Facebook Graph API v22.0). Built with Next.js 15 and @vercel/mcp-adapter, deployed on Vercel.

**MCP Endpoint:** `https://your-deployment.vercel.app/mcp`

---

## Setup

### 1. Meta App Setup

1. Go to [developers.facebook.com](https://developers.facebook.com) and create an app (Business type)
2. Add the "Facebook Login" product
3. Under Facebook Login > Settings, add your Valid OAuth Redirect URI:
   `https://your-deployment.vercel.app/api/meta/callback`
4. Note your App ID and App Secret from App Settings > Basic

Required permissions (must be approved for production):
- `ads_read`
- `ads_management`
- `business_management`
- `pages_read_engagement`
- `pages_manage_ads`
- `pages_show_list`
- `read_insights`

### 2. Supabase Schema

Run the following SQL in your Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS mcp_credentials (
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
GRANT ALL ON mcp_oauth_clients TO anon;
```

### 3. Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BASE_URL` | Your deployment URL, e.g. `https://meta-ads-custom-mcp.vercel.app` |
| `META_APP_ID` | Facebook App ID |
| `META_APP_SECRET` | Facebook App Secret |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |

### 4. Deploy to Vercel

```bash
npm install
vercel --prod
```

Set the environment variables in the Vercel dashboard before deploying.

### 5. Connect in Claude

Add a remote MCP connector with URL: `https://your-deployment.vercel.app/mcp`

Claude will initiate the OAuth flow, redirect you to Facebook Login, and after granting permissions, you'll be connected automatically.

---

## Authentication Flow

```
Claude → GET /api/oauth/authorize (PKCE S256)
       → Redirect to Facebook Login
Facebook → GET /api/meta/callback?code=...
         → Exchange code for long-lived token (60 days)
         → SHA256(metaUserId) = userId
         → Store credentials in Supabase
         → Issue auth code → Redirect to Claude
Claude → POST /api/oauth/token → Bearer token (30 days)
Claude tool call → /mcp → MetaAdsClient → Graph API v22.0
```

Silent re-auth: After first login, a `mcp_user_id` cookie is set. On subsequent authorization requests, if the cookie is valid and credentials have not expired, Claude gets a new auth code immediately without going through Facebook Login again.

---

## Tools (35 total)

| Category | Tool | Description |
|---|---|---|
| User & Accounts | `get_me` | Get authenticated user profile |
| | `list_ad_accounts` | List all accessible ad accounts |
| | `get_ad_account` | Get ad account details |
| | `list_businesses` | List all Business Managers |
| | `get_business` | Get Business Manager details |
| | `list_business_ad_accounts` | List ad accounts in a business |
| Campaigns | `list_campaigns` | List campaigns for an ad account |
| | `get_campaign` | Get campaign details |
| | `create_campaign` | Create a new campaign |
| | `update_campaign` | Update campaign settings |
| | `delete_campaign` | Delete a campaign |
| Ad Sets | `list_ad_sets` | List ad sets for an ad account |
| | `get_ad_set` | Get ad set details |
| | `create_ad_set` | Create a new ad set |
| | `update_ad_set` | Update ad set settings |
| | `delete_ad_set` | Delete an ad set |
| Ads | `list_ads` | List ads for an ad account |
| | `get_ad` | Get ad details |
| | `create_ad` | Create a new ad |
| | `update_ad` | Update ad settings |
| | `delete_ad` | Delete an ad |
| Ad Creatives | `list_ad_creatives` | List ad creatives |
| | `get_ad_creative` | Get ad creative details |
| | `create_ad_creative` | Create a new ad creative |
| Insights | `get_insights` | Get performance metrics for any object level |
| Pages | `list_pages` | List managed Facebook Pages |
| | `get_page` | Get Page details |
| | `get_page_insights` | Get Page performance analytics |
| Audiences | `list_custom_audiences` | List custom audiences |
| | `get_custom_audience` | Get custom audience details |
| | `create_custom_audience` | Create a custom audience |
| | `list_saved_audiences` | List saved audiences |
| Targeting | `search_targeting` | Search interests, behaviors, locations |
| Media | `list_ad_images` | List uploaded ad images |
| | `list_ad_videos` | List uploaded ad videos |

---

## Known Gotchas

1. **No middleware.ts** — Do not create a middleware.ts file. It causes routing conflicts with the MCP handler.

2. **Facebook App review** — For production use (non-developers/testers), permissions like `ads_management` require Facebook App Review.

3. **Long-lived token expiry** — Meta long-lived tokens expire in ~60 days. Users must reconnect after expiry. The cookie makes reconnection seamless.

4. **act_ prefix** — Ad account IDs require the `act_` prefix. The client handles this automatically, but it helps to include it when referencing IDs.

5. **Insights rate limits** — The Insights API has separate rate limits. Large date ranges with breakdowns may hit limits.
