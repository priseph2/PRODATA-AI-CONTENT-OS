import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    // Verify cron secret from Authorization header
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn("Cron request with invalid secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // Fetch all scheduled posts due for publishing
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select(
        `
        id,
        content_id,
        workspace_id,
        platform,
        scheduled_at
      `
      )
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(50); // Process up to 50 posts per cron run

    if (fetchError) {
      console.error("Failed to fetch scheduled posts:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch posts", success: false },
        { status: 500 }
      );
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return NextResponse.json({
        success: true,
        published: 0,
        failed: 0,
        message: "No posts to publish",
      });
    }

    // Publish posts in parallel with concurrency limit (5 at a time)
    const concurrencyLimit = 5;
    let publishedCount = 0;
    let failedCount = 0;

    const publishPost = async (post: any) => {
      try {
        const publishResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/publish`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scheduled_post_id: post.id,
            }),
          }
        );

        if (publishResponse.ok) {
          publishedCount++;
        } else {
          failedCount++;
          console.error(`Failed to publish post ${post.id}`);
        }
      } catch (error) {
        failedCount++;
        console.error(`Error publishing post ${post.id}:`, error);
      }
    };

    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < scheduledPosts.length; i += concurrencyLimit) {
      const batch = scheduledPosts.slice(i, i + concurrencyLimit);
      await Promise.all(batch.map(publishPost));
    }

    return NextResponse.json({
      success: true,
      published: publishedCount,
      failed: failedCount,
      total: scheduledPosts.length,
      message: `Published ${publishedCount}, failed ${failedCount}`,
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
