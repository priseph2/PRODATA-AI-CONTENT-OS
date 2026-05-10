import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    // Check for auth token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get("workspace_id");

    if (!workspace_id) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    // Use authenticated client so RLS policies are enforced
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Fetch analytics data for the workspace
    const { data: analyticsData, error: analyticsError } = await supabase
      .from("post_analytics")
      .select("*")
      .eq("workspace_id", workspace_id)
      .order("synced_at", { ascending: false });

    if (analyticsError) {
      console.error("Failed to fetch analytics:", analyticsError);
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 }
      );
    }

    if (!analyticsData || analyticsData.length === 0) {
      return NextResponse.json({
        analytics: [],
        summary: {
          total_posts: 0,
          total_reach: 0,
          total_likes: 0,
          total_comments: 0,
          total_interactions: 0,
          avg_engagement_rate: 0,
        },
      });
    }

    // Fetch corresponding scheduled_posts to get published_at and content_id
    const scheduledPostIds = analyticsData.map((a) => a.scheduled_post_id);
    const { data: scheduledPosts } = await supabase
      .from("scheduled_posts")
      .select("id, content_id, published_at")
      .in("id", scheduledPostIds);

    // Fetch corresponding generated_content
    const contentIds = scheduledPosts
      ?.map((p) => p.content_id)
      .filter(Boolean) || [];
    const { data: generatedContent } = await supabase
      .from("generated_content")
      .select("id, content_text, image_url")
      .in("id", contentIds);

    // Build maps for quick lookup
    const scheduledPostMap: Record<string, any> = {};
    const contentMap: Record<string, any> = {};

    if (scheduledPosts) {
      for (const post of scheduledPosts) {
        scheduledPostMap[post.id] = post;
      }
    }

    if (generatedContent) {
      for (const content of generatedContent) {
        contentMap[content.id] = content;
      }
    }

    // Enrich analytics with content data
    const enrichedAnalytics = analyticsData.map((analytics) => {
      const scheduledPost = scheduledPostMap[analytics.scheduled_post_id];
      const content = contentMap[scheduledPost?.content_id];

      return {
        ...analytics,
        published_at: scheduledPost?.published_at,
        content_text: content?.content_text || "",
        image_url: content?.image_url,
      };
    });

    // Calculate summary statistics
    const summary = {
      total_posts: analyticsData.length,
      total_reach: analyticsData.reduce(
        (sum, a) => sum + (a.reach || a.post_impressions_unique || 0),
        0
      ),
      total_likes: analyticsData.reduce((sum, a) => sum + (a.likes || 0), 0),
      total_comments: analyticsData.reduce(
        (sum, a) => sum + (a.comments || 0),
        0
      ),
      total_interactions: analyticsData.reduce(
        (sum, a) => sum + (a.total_interactions || 0),
        0
      ),
      avg_engagement_rate: 0 as number,
      last_synced: analyticsData[0]?.synced_at,
    };

    // Calculate average engagement rate
    const totalReach = summary.total_reach || 1; // Avoid division by zero
    summary.avg_engagement_rate =
      (summary.total_interactions / totalReach) * 100;

    return NextResponse.json({
      analytics: enrichedAnalytics,
      summary,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status: 500 }
    );
  }
}
