import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `/dashboard/settings?error=User cancelled OAuth`
      );
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
    if (accessToken) {
      const longLivedResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token`,
        {
          method: "GET",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: META_APP_ID,
            client_secret: META_APP_SECRET,
            fb_exchange_token: accessToken,
          }).toString(),
        }
      );

      if (longLivedResponse.ok) {
        const longLivedData = await longLivedResponse.json();
        accessToken = longLivedData.access_token;
      }
    }

    // Get Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    if (!pagesResponse.ok) {
      console.error("Failed to fetch pages");
      return NextResponse.redirect(
        `/dashboard/settings?error=Failed to fetch Facebook pages`
      );
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      return NextResponse.redirect(
        `/dashboard/settings?error=No Facebook pages found. Please create one first.`
      );
    }

    const supabase = await createClient();

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
        return NextResponse.redirect(
          `/dashboard/settings?error=No Instagram Business account found. Link one to your Facebook Page first.`
        );
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
          },
          { onConflict: "workspace_id,platform" }
        );

      if (insertError) {
        console.error("Failed to save IG account:", insertError);
        return NextResponse.redirect(
          `/dashboard/settings?error=Failed to save account`
        );
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
          },
          { onConflict: "workspace_id,platform" }
        );

      if (insertError) {
        console.error("Failed to save FB account:", insertError);
        return NextResponse.redirect(
          `/dashboard/settings?error=Failed to save account`
        );
      }
    }

    return NextResponse.redirect(`/dashboard/settings?connected=${platform}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `/dashboard/settings?error=An error occurred during authentication`
    );
  }
}
