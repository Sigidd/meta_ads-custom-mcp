/**
 * OAuth 2.1 Authorization Endpoint
 * GET /api/oauth/authorize
 *
 * Flow:
 *  1. Validate OAuth params (client_id, redirect_uri, PKCE)
 *  2. Check for a long-lived `mcp_user_id` cookie set after Facebook Login.
 *     If found AND credentials still valid → silent re-auth: skip Facebook Login,
 *     issue an auth code directly and redirect back to the MCP client.
 *  3. Otherwise → save session and redirect user to Facebook Login.
 *
 * KEY DIFFERENCE from Revolut People: we redirect to Facebook Login (real OAuth)
 * instead of showing an HTML form.
 */
import { NextRequest, NextResponse } from "next/server";
import { generateId, getBaseUrl } from "@/lib/auth";
import { store } from "@/lib/store";

const USER_COOKIE = "mcp_user_id";
const META_SCOPES = "ads_read,ads_management,business_management,pages_read_engagement,pages_manage_ads,pages_show_list,pages_manage_posts,pages_read_user_content";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const codeChallenge = searchParams.get("code_challenge");
  const codeChallengeMethod = searchParams.get("code_challenge_method");
  const state = searchParams.get("state");
  const scope = searchParams.get("scope") ?? "";

  if (!clientId || !redirectUri || !codeChallenge || codeChallengeMethod !== "S256") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const base = getBaseUrl();

  // Silent re-auth: if valid cookie + credentials, skip Facebook Login
  const cookieUserId = req.cookies.get(USER_COOKIE)?.value;
  if (cookieUserId) {
    const creds = await store.getCredentials(cookieUserId);
    if (creds && creds.tokenExpiresAt > Date.now()) {
      // Issue code directly — no need to go through Facebook again
      const code = generateId(32);
      await store.setCode(code, {
        userId: cookieUserId,
        clientId,
        redirectUri,
        codeChallenge,
        codeChallengeMethod,
        scope,
        createdAt: Date.now(),
      });
      const redirect = new URL(redirectUri);
      redirect.searchParams.set("code", code);
      if (state) redirect.searchParams.set("state", state);
      return NextResponse.redirect(redirect.toString(), 302);
    }
  }

  // Save OAuth session state so we can resume after Facebook callback
  const sessionId = generateId(32);
  await store.setSession(sessionId, {
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    scope,
    state: state ?? undefined,
    createdAt: Date.now(),
  });

  // Redirect to Facebook Login
  const appId = process.env.META_APP_ID!;
  const callbackUrl = `${base}/api/meta/callback`;
  const fbUrl = new URL("https://www.facebook.com/v22.0/dialog/oauth");
  fbUrl.searchParams.set("client_id", appId);
  fbUrl.searchParams.set("redirect_uri", callbackUrl);
  fbUrl.searchParams.set("scope", META_SCOPES);
  fbUrl.searchParams.set("state", sessionId); // sessionId is our state param
  fbUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(fbUrl.toString(), 302);
}
