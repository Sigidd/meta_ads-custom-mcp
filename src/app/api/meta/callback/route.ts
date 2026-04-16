/**
 * Facebook OAuth Callback Handler
 * GET /api/meta/callback
 *
 * Called by Facebook after the user grants permission. Handles:
 *  1. Code exchange for short-lived token
 *  2. Exchange for long-lived token (60 days)
 *  3. Get Meta user ID and derive stable userId via SHA256
 *  4. Store credentials in Supabase
 *  5. Issue MCP auth code
 *  6. Redirect to Claude with auth code + set long-lived cookie
 */
import { NextRequest, NextResponse } from "next/server";
import { generateId, getBaseUrl } from "@/lib/auth";
import { store } from "@/lib/store";
import { createHash } from "crypto";

const USER_COOKIE = "mcp_user_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const sessionId = searchParams.get("state"); // sessionId was passed as state
  const error = searchParams.get("error");

  const base = getBaseUrl();

  if (error || !code || !sessionId) {
    const url = new URL(`${base}/connect`);
    url.searchParams.set("error", error ?? "Authorization was denied or failed.");
    return NextResponse.redirect(url.toString(), 302);
  }

  // Load OAuth session from Supabase
  const session = await store.getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: "Session expired. Please restart from your MCP client." },
      { status: 400 }
    );
  }

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const callbackUrl = `${base}/api/meta/callback`;

  try {
    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&client_secret=${appSecret}&code=${code}`
    );
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
    const tokenData = await tokenRes.json() as { access_token: string; token_type: string };
    const shortToken = tokenData.access_token;

    // 2. Exchange for long-lived token (60 days)
    const llRes = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
    );
    if (!llRes.ok) throw new Error(`Long-lived token exchange failed: ${await llRes.text()}`);
    const llData = await llRes.json() as { access_token: string; expires_in?: number };
    const accessToken = llData.access_token;
    const expiresIn = llData.expires_in ?? 60 * 24 * 60 * 60; // default 60 days in seconds

    // 3. Get Meta user ID
    const meRes = await fetch(`https://graph.facebook.com/v22.0/me?fields=id,name&access_token=${accessToken}`);
    if (!meRes.ok) throw new Error(`Failed to get user info: ${await meRes.text()}`);
    const me = await meRes.json() as { id: string; name: string };

    // 4. Derive stable userId from Meta user ID via SHA256
    const userId = createHash("sha256").update(me.id).digest("hex").slice(0, 32);

    // 5. Store credentials in Supabase
    await store.setCredentials(userId, {
      metaUserId: me.id,
      accessToken,
      tokenExpiresAt: Date.now() + expiresIn * 1000,
      connectedAt: Date.now(),
    });

    // 6. Issue MCP auth code
    const authCode = generateId(32);
    await store.setCode(authCode, {
      userId,
      clientId: session.clientId,
      redirectUri: session.redirectUri,
      codeChallenge: session.codeChallenge,
      codeChallengeMethod: session.codeChallengeMethod,
      scope: session.scope,
      createdAt: Date.now(),
    });

    // Clean up session
    await store.delSession(sessionId);

    // 7. Redirect to Claude with auth code and set cookie for silent re-auth
    const redirect = new URL(session.redirectUri);
    redirect.searchParams.set("code", authCode);
    if (session.state) redirect.searchParams.set("state", session.state);

    const response = NextResponse.redirect(redirect.toString(), 302);
    response.cookies.set(USER_COOKIE, userId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return response;

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const url = new URL(`${base}/connect`);
    url.searchParams.set("error", `Connection failed: ${msg}`);
    return NextResponse.redirect(url.toString(), 303);
  }
}
