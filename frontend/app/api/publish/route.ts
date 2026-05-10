import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scheduled_post_id } = body;

    if (!scheduled_post_id) {
      return NextResponse.json(
        { error: "scheduled_post_id is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch scheduled post (select only needed columns)
    const { data: scheduledPostData, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("id, content_id, workspace_id, platform, status")
      .eq("id", scheduled_post_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        { error: `Failed to fetch scheduled post: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!scheduledPostData) {
      return NextResponse.json(
        { error: "Scheduled post not found" },
        { status: 404 }
      );
    }

    const scheduledPost = scheduledPostData;

    if (scheduledPost.status !== "scheduled") {
      return NextResponse.json(
        { error: `Post is ${scheduledPost.status}, not scheduled` },
        { status: 400 }
      );
    }

    // Fetch generated content and social account in parallel
    const [{ data: generatedContent, error: contentError }, { data: socialAccount, error: accountError }] = await Promise.all([
      supabase
        .from("generated_content")
        .select("id, content_text, platform, content_type, image_url")
        .eq("id", scheduledPost.content_id)
        .maybeSingle(),
      supabase
        .from("social_accounts")
        .select("account_id, page_id, access_token")
        .eq("workspace_id", scheduledPost.workspace_id)
        .eq("platform", scheduledPost.platform)
        .maybeSingle(),
    ]);

    if (contentError || !generatedContent) {
      console.error("Content error:", contentError);
      return NextResponse.json(
        { error: "No generated content found" },
        { status: 404 }
      );
    }

    const content = generatedContent;

    if (accountError) {
      console.error("Account error:", accountError);
      return NextResponse.json(
        { error: `Failed to fetch social account: ${accountError.message}` },
        { status: 500 }
      );
    }

    if (!socialAccount) {
      const errorMsg = `No ${scheduledPost.platform} account connected for this workspace`;
      await supabase
        .from("scheduled_posts")
        .update({ status: "failed", error_message: errorMsg })
        .eq("id", scheduled_post_id);

      return NextResponse.json(
        { error: errorMsg, success: false },
        { status: 400 }
      );
    }

    let platformPostId = null;
    let publishError = null;

    try {
      if (scheduledPost.platform === "instagram") {
        platformPostId = await publishToInstagram(
          socialAccount.account_id,
          content.content_text,
          socialAccount.access_token,
          content.image_url
        );
      } else if (scheduledPost.platform === "facebook") {
        platformPostId = await publishToFacebook(
          socialAccount.page_id || socialAccount.account_id,
          content.content_text,
          socialAccount.access_token
        );
      } else {
        throw new Error(`Unsupported platform: ${scheduledPost.platform}`);
      }
    } catch (error) {
      publishError = error instanceof Error ? error.message : String(error);
      console.error("Publishing error:", publishError);
    }

    if (publishError) {
      // Update as failed
      await supabase
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: publishError,
        })
        .eq("id", scheduled_post_id);

      return NextResponse.json(
        { error: publishError, success: false },
        { status: 500 }
      );
    }

    // Update as published
    const { error: updateError } = await supabase
      .from("scheduled_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        platform_post_id: platformPostId,
      })
      .eq("id", scheduled_post_id);

    if (updateError) {
      console.error("Failed to update post:", updateError);
      return NextResponse.json(
        { error: "Failed to update post status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      platform_post_id: platformPostId,
      message: `Post published to ${scheduledPost.platform}`,
    });
  } catch (error) {
    console.error("Publish error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status: 500 }
    );
  }
}

async function publishToInstagram(
  igAccountId: string,
  caption: string,
  accessToken: string,
  imageUrl?: string
): Promise<string> {
  const params: Record<string, string> = {
    caption: caption.substring(0, 2200), // Instagram caption limit
    access_token: accessToken,
  };

  // Use IMAGE media type if we have an image, otherwise CAPTION
  if (imageUrl) {
    params.media_type = "IMAGE";
    params.image_url = imageUrl;
  } else {
    params.media_type = "CAPTION";
  }

  const createMediaResponse = await fetch(
    `https://graph.instagram.com/v18.0/${igAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    }
  );

  if (!createMediaResponse.ok) {
    const error = await createMediaResponse.json();
    throw new Error(
      `Instagram media creation failed: ${error.error?.message || "Unknown error"}`
    );
  }

  const mediaData = await createMediaResponse.json();
  const mediaId = mediaData.id;

  if (!mediaId) {
    throw new Error("Instagram returned no media ID");
  }

  // Publish the media
  const publishResponse = await fetch(
    `https://graph.instagram.com/v18.0/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: mediaId,
        access_token: accessToken,
      }).toString(),
    }
  );

  if (!publishResponse.ok) {
    const error = await publishResponse.json();
    throw new Error(
      `Instagram publish failed: ${error.error?.message || "Unknown error"}`
    );
  }

  const publishData = await publishResponse.json();
  return publishData.id || mediaId;
}

async function publishToFacebook(
  pageId: string,
  message: string,
  accessToken: string
): Promise<string> {
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message: message,
        access_token: accessToken,
      }).toString(),
    }
  );

  if (!publishResponse.ok) {
    const error = await publishResponse.json();
    throw new Error(
      `Facebook publish failed: ${error.error?.message || "Unknown error"}`
    );
  }

  const publishData = await publishResponse.json();
  return publishData.id;
}
