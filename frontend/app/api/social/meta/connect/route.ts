import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get("workspace_id");
    const platform = searchParams.get("platform");

    if (!workspace_id || !platform) {
      return NextResponse.json(
        { error: "workspace_id and platform are required" },
        { status: 400 }
      );
    }

    const META_APP_ID = process.env.META_APP_ID;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!META_APP_ID) {
      return NextResponse.json(
        { error: "Meta App ID not configured" },
        { status: 500 }
      );
    }

    const state = Buffer.from(
      JSON.stringify({
        workspace_id,
        platform,
        timestamp: Date.now(),
      })
    ).toString("base64");

    const scopes = [
      "pages_manage_posts",
      "pages_show_list",
      "instagram_basic",
      "instagram_content_publish",
    ];

    const redirectUri = encodeURIComponent(`${APP_URL}/api/social/meta/callback`);
    const facebookAuthUrl =
      `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${META_APP_ID}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scopes.join(",")}` +
      `&state=${state}` +
      `&display=popup`;

    return NextResponse.redirect(facebookAuthUrl);
  } catch (error) {
    console.error("OAuth connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth" },
      { status: 500 }
    );
  }
}
