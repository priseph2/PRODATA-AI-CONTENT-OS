import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      const redirectUrl = new URL("/dashboard/settings?error=User cancelled OAuth", request.url);
      return NextResponse.redirect(redirectUrl.toString());
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state" },
        { status: 400 }
      );
    }

    // Decode state
    const decoded = JSON.parse(
      Buffer.from(state, "base64").toString("utf-8")
    );
    const { workspace_id, platform } = decoded;

    const META_APP_ID = process.env.META_APP_ID;
    const META_APP_SECRET = process.env.META_APP_SECRET;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!META_APP_ID || !META_APP_SECRET) {
      return NextResponse.json(
        { error: "Meta credentials not configured" },
        { status: 500 }
      );
    }

    // Exchange code for short-lived token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: META_APP_ID,
          client_secret: META_APP_SECRET,
          redirect_uri: `${APP_URL}/api/social/meta/callback`,
          code,
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      const err = await tokenResponse.json();
      console.error("Token exchange failed:", err);
      return NextResponse.redirect(`/dashboard/settings?error=Token exchange failed`);
    }

    const tokenData = await tokenResponse.json();
    let accessToken = tokenData.access_token;

    // Exchange short-lived token for long-lived token (if it's a user token)
    let expiresIn = 5184000; // 60 days default
    if (accessToken) {
      const exchangeParams = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        fb_exchange_token: accessToken,
      });
      const longLivedResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?${exchangeParams.toString()}`,
        { method: "GET" }
      );

      if (longLivedResponse.ok) {
        const longLivedData = await longLivedResponse.json();
        accessToken = longLivedData.access_token;
        expiresIn = longLivedData.expires_in || expiresIn;
      }
    }

    // Get Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    if (!pagesResponse.ok) {
      console.error("Failed to fetch pages");
      const redirectUrl = new URL("/dashboard/settings?error=Failed to fetch Facebook pages", request.url);
      return NextResponse.redirect(redirectUrl.toString());
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      const redirectUrl = new URL("/dashboard/settings?error=No Facebook pages found. Please create one first.", request.url);
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Fetch account name from Meta
    let accountName = "Connected Account";
    try {
      const meResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=name&access_token=${accessToken}`
      );
      if (meResponse.ok) {
        const meData = await meResponse.json();
        accountName = meData.name || "Connected Account";
      }
    } catch (e) {
      console.warn("Failed to fetch account name:", e);
    }

    const supabase = await createClient();
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // For Instagram: find Instagram Business account
    // For Facebook: use the page itself
    if (platform === "instagram") {
      // Find first page with Instagram Business account - parallelize page detail fetches
      let igAccountId = null;
      let pageId = null;
      let pageAccessToken = null;

      const pageDetailsPromises = pages.map((page: any) =>
        fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        )
          .then(res => res.ok ? res.json() : null)
          .then(details => details && details.instagram_business_account ? { pageId: page.id, pageAccessToken: page.access_token, igAccountId: details.instagram_business_account.id } : null)
      );

      const pageResults = await Promise.all(pageDetailsPromises);
      const foundPage = pageResults.find(result => result !== null);

      if (!foundPage) {
        const redirectUrl = new URL("/dashboard/settings?error=No Instagram Business account found. Link one to your Facebook Page first.", request.url);
        return NextResponse.redirect(redirectUrl.toString());
      }

      igAccountId = foundPage.igAccountId;
      pageId = foundPage.pageId;
      pageAccessToken = foundPage.pageAccessToken;

      // Store in social_accounts
      const { error: insertError } = await supabase
        .from("social_accounts")
        .upsert(
          {
            workspace_id,
            platform: "instagram",
            access_token: pageAccessToken,
            account_id: igAccountId,
            page_id: pageId,
            account_name: accountName,
            expires_at: expiresAt,
          },
          { onConflict: "workspace_id,platform" }
        );

      if (insertError) {
        console.error("Failed to save IG account:", insertError);
        const redirectUrl = new URL("/dashboard/settings?error=Failed to save account", request.url);
        return NextResponse.redirect(redirectUrl.toString());
      }
    } else if (platform === "facebook") {
      // Use first Facebook page
      const page = pages[0];

      const { error: insertError } = await supabase
        .from("social_accounts")
        .upsert(
          {
            workspace_id,
            platform: "facebook",
            access_token: page.access_token,
            account_id: page.id,
            page_id: page.id,
            account_name: accountName,
            expires_at: expiresAt,
          },
          { onConflict: "workspace_id,platform" }
        );

      if (insertError) {
        console.error("Failed to save FB account:", insertError);
        const redirectUrl = new URL("/dashboard/settings?error=Failed to save account", request.url);
        return NextResponse.redirect(redirectUrl.toString());
      }
    }

    const redirectUrl = new URL(`/dashboard/settings?connected=${platform}`, request.url);
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("OAuth callback error:", error);
    const redirectUrl = new URL("/dashboard/settings?error=An error occurred during authentication", request.url);
    return NextResponse.redirect(redirectUrl.toString());
  }
}
