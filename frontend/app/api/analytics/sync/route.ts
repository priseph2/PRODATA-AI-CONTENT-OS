import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspace_id } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch social accounts for this workspace
    const { data: socialAccounts, error: accountsError } = await supabase
      .from("social_accounts")
      .select("platform, access_token, page_id, account_id")
      .eq("workspace_id", workspace_id);

    if (accountsError) {
      console.error("Failed to fetch social accounts:", accountsError);
      return NextResponse.json(
        { error: "Failed to fetch social accounts" },
        { status: 500 }
      );
    }

    // Build map of platform to tokens
    const accountMap: Record<string, any> = {};
    if (socialAccounts) {
      for (const account of socialAccounts) {
        accountMap[account.platform] = account;
      }
    }

    // Fetch all published posts with platform_post_id
    const { data: publishedPosts, error: postsError } = await supabase
      .from("scheduled_posts")
      .select("id, platform, platform_post_id")
      .eq("workspace_id", workspace_id)
      .eq("status", "published")
      .not("platform_post_id", "is", null);

    if (postsError) {
      console.error("Failed to fetch published posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch published posts" },
        { status: 500 }
      );
    }

    if (!publishedPosts || publishedPosts.length === 0) {
      return NextResponse.json({
        success: true,
        synced_count: 0,
        message: "No published posts to sync",
      });
    }

    // Fetch analytics for each post in parallel
    const syncPromises = publishedPosts.map((post) =>
      syncPostAnalytics(post, accountMap, supabase)
    );

    const results = await Promise.all(syncPromises);
    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      synced_count: successCount,
      message: `Synced analytics for ${successCount}/${publishedPosts.length} posts`,
    });
  } catch (error) {
    console.error("Analytics sync error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status: 500 }
    );
  }
}

async function syncPostAnalytics(
  post: any,
  accountMap: Record<string, any>,
  supabase: any
) {
  try {
    const account = accountMap[post.platform];

    if (!account || !account.access_token) {
      console.warn(`No account/token for platform ${post.platform}`);
      return { success: false };
    }

    let metricsUrl: string;
    let metrics: string;

    if (post.platform === "instagram") {
      metricsUrl = `https://graph.facebook.com/v25.0/${post.platform_post_id}/insights`;
      metrics = "views,likes,comments,shares,saved,reach,total_interactions";
    } else if (post.platform === "facebook") {
      metricsUrl = `https://graph.facebook.com/v25.0/${post.platform_post_id}/insights`;
      metrics = "post_impressions,post_impressions_unique,post_clicks,post_reactions_like_total";
    } else {
      return { success: false };
    }

    const url = `${metricsUrl}?metric=${metrics}&access_token=${account.access_token}`;
    if (post.platform === "instagram") {
      url.concat("&period=lifetime");
    }

    const response = await fetch(
      `${metricsUrl}?metric=${metrics}&access_token=${account.access_token}${
        post.platform === "instagram" ? "&period=lifetime" : ""
      }`
    );

    if (!response.ok) {
      console.error(
        `Meta API error for post ${post.id}:`,
        response.statusText
      );
      return { success: false };
    }

    const data = await response.json();

    // Extract metrics from Meta response
    const metricsMap: Record<string, number> = {};
    if (data.data) {
      for (const metric of data.data) {
        const value = metric.values?.[0]?.value ?? 0;
        metricsMap[metric.name] = value;
      }
    }

    // Build analytics payload
    const analyticsData = {
      workspace_id: post.workspace_id,
      scheduled_post_id: post.id,
      platform: post.platform,
      platform_post_id: post.platform_post_id,
      views: metricsMap.views ?? 0,
      likes: metricsMap.likes ?? 0,
      comments: metricsMap.comments ?? 0,
      shares: metricsMap.shares ?? 0,
      saved: metricsMap.saved ?? 0,
      reach: metricsMap.reach ?? 0,
      total_interactions: metricsMap.total_interactions ?? 0,
      post_impressions: metricsMap.post_impressions ?? 0,
      post_impressions_unique: metricsMap.post_impressions_unique ?? 0,
      post_clicks: metricsMap.post_clicks ?? 0,
      post_reactions_like_total: metricsMap.post_reactions_like_total ?? 0,
      synced_at: new Date().toISOString(),
    };

    // UPSERT into post_analytics
    const { error: upsertError } = await supabase
      .from("post_analytics")
      .upsert([analyticsData], { onConflict: "scheduled_post_id" });

    if (upsertError) {
      console.error(`Failed to upsert analytics for post ${post.id}:`, upsertError);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error(`Error syncing post ${post.id}:`, error);
    return { success: false };
  }
}
