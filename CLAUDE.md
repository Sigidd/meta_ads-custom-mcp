# Meta Ads MCP — Context for Claude

## What this project is

A **remote MCP server** that connects Claude to the Meta Ads (Facebook Graph) API v22.0. It is a Next.js 15 app deployed on Vercel, using `@vercel/mcp-adapter`.

**MCP endpoint** (use this URL when adding the connector): `https://your-deployment.vercel.app/mcp`

---

## Architecture

```
Claude → OAuth 2.1 PKCE → /api/oauth/authorize → Facebook Login redirect
Facebook → /api/meta/callback → exchange code → long-lived token → issue auth code → redirect to Claude
Claude → /api/oauth/token → bearer token
Claude tool call → /mcp → withMcpAuth → MetaAdsClient → Meta Graph API v22.0
```

### Key files

| File | Purpose |
|---|---|
| `src/app/[transport]/route.ts` | MCP endpoint (SSE + HTTP), auth gate |
| `src/lib/tools.ts` | All 35 MCP tool definitions |
| `src/lib/meta.ts` | Meta Graph API v22.0 client |
| `src/lib/store.ts` | Supabase persistence layer |
| `src/lib/auth.ts` | Token generation, PKCE, bearer helpers |
| `src/app/connect/page.tsx` | Connecting/error state page |
| `src/app/api/oauth/authorize/route.ts` | OAuth 2.1 authorization → redirects to Facebook Login |
| `src/app/api/meta/callback/route.ts` | Facebook OAuth callback → stores credentials → issues auth code |
| `src/app/api/oauth/token/route.ts` | Token exchange endpoint (auth code → bearer token) |
| `src/app/api/oauth/register/route.ts` | Dynamic client registration (RFC 7591) |

---

## KEY DIFFERENCE from Revolut People

Revolut People: `authorize` → shows HTML form → user submits credentials
Meta Ads: `authorize` → redirects directly to Facebook Login (real OAuth) → `/api/meta/callback` handles everything

There is NO connect form. The user never enters credentials manually.

---

## OAuth Flow

1. Claude calls `GET /api/oauth/authorize` with PKCE (S256 required)
2. **Silent re-auth**: if `mcp_user_id` cookie exists and credentials valid (not expired) → skip Facebook Login, issue code immediately
3. **First-time / expired**: session saved to Supabase, user redirected to `https://www.facebook.com/v22.0/dialog/oauth`
4. Facebook redirects to `/api/meta/callback?code=...&state={sessionId}`
5. Callback: exchange code for short-lived token → exchange for long-lived token (60 days) → get Meta user ID → `userId = SHA256(metaUserId).slice(0,32)` → store credentials → issue auth code → redirect to Claude with cookie
6. Claude → `POST /api/oauth/token` → bearer token (30 days)

---

## Meta OAuth Details

- Facebook Login URL: `https://www.facebook.com/v22.0/dialog/oauth`
- Scopes: `ads_read,ads_management,business_management,pages_read_engagement,pages_manage_ads,pages_show_list`
- Token exchange: `GET https://graph.facebook.com/v22.0/oauth/access_token?client_id=...&redirect_uri=...&client_secret=...&code=...`
- Long-lived token: `GET https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&...`
- Long-lived token expires in ~60 days
- Graph API base: `https://graph.facebook.com/v22.0`

---

## Supabase Schema

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

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BASE_URL` | Public deployment URL, e.g. `https://meta-ads-custom-mcp.vercel.app` |
| `META_APP_ID` | Facebook App ID |
| `META_APP_SECRET` | Facebook App Secret |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |

---

## Known Gotchas

1. **No middleware.ts** — Do NOT create a middleware.ts file. It causes routing conflicts with the MCP handler's pathname checks.

2. **Connector URL** — Must be `https://your-deployment.vercel.app/mcp` (the `/mcp` path, not `/sse` or root).

3. **`force-dynamic` on well-known routes** — Both oauth-authorization-server and oauth-protected-resource routes use `dynamic = "force-dynamic"` because `getBaseUrl()` reads env vars at runtime.

4. **`serverExternalPackages`** — `next.config.ts` must include `@vercel/mcp-adapter` in `serverExternalPackages`.

5. **Facebook App setup** — The Facebook App must have:
   - Facebook Login product added
   - Valid OAuth redirect URI: `{BASE_URL}/api/meta/callback`
   - The required permissions approved

6. **Long-lived token expiry** — Meta long-lived tokens expire in ~60 days. When expired, users reconnect via the OAuth flow (cookie makes future reconnects seamless).

7. **userId derivation** — `userId = SHA256(metaUserId).slice(0, 32)` — never store the raw Meta user ID as the key.

8. **act_ prefix** — Ad account IDs require `act_` prefix. All MetaAdsClient methods handle this automatically.

---

## Tools (35 total)

| Category | Tools |
|---|---|
| User & Accounts | `get_me`, `list_ad_accounts`, `get_ad_account`, `list_businesses`, `get_business`, `list_business_ad_accounts` |
| Campaigns | `list_campaigns`, `get_campaign`, `create_campaign`, `update_campaign`, `delete_campaign` |
| Ad Sets | `list_ad_sets`, `get_ad_set`, `create_ad_set`, `update_ad_set`, `delete_ad_set` |
| Ads | `list_ads`, `get_ad`, `create_ad`, `update_ad`, `delete_ad` |
| Ad Creatives | `list_ad_creatives`, `get_ad_creative`, `create_ad_creative` |
| Insights | `get_insights` |
| Pages | `list_pages`, `get_page`, `get_page_insights` |
| Audiences | `list_custom_audiences`, `get_custom_audience`, `create_custom_audience`, `list_saved_audiences` |
| Targeting | `search_targeting` |
| Media | `list_ad_images`, `list_ad_videos` |
