import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content_id, content_text, platform, workspace_id } = body;

    if (!content_id || !workspace_id) {
      return NextResponse.json(
        { error: "content_id and workspace_id are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch workspace for brand context (select only needed columns)
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("brand_colors, brand_voice, niche")
      .eq("id", workspace_id)
      .maybeSingle();

    if (wsError) {
      console.error("Workspace fetch error:", wsError);
      return NextResponse.json(
        { error: `Failed to fetch workspace: ${wsError.message}` },
        { status: 500 }
      );
    }

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Build DALL-E prompt
    const brandColors = workspace.brand_colors?.join(", ") || "professional colors";
    const prompt = `Create a professional, modern ${platform} post image. Business niche: ${workspace.niche}.
Brand voice: ${workspace.brand_voice}
Brand colors to incorporate: ${brandColors}
Related to: "${content_text.substring(0, 80)}"

IMPORTANT:
- Photorealistic, professional quality (not cartoon or overly stylized)
- Clean, modern design with emphasis on the brand colors
- High quality photography or realistic digital art
- No text, watermarks, or captions
- Perfect for a ${platform} post
- Aspect ratio: ${platform === "facebook" ? "landscape (16:9)" : "square (1:1)"}
- Consistent with professional social media standards`;

    // Call DALL-E 3
    const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: platform === "facebook" ? "1792x1024" : "1024x1024",
        quality: "standard",
      }),
    });

    if (!dalleResponse.ok) {
      const error = await dalleResponse.json();
      console.error("DALL-E error:", error);
      return NextResponse.json(
        { error: `Image generation failed: ${error.error?.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    const dalleData = await dalleResponse.json();
    const imageUrl = dalleData.data[0].url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL returned from DALL-E" },
        { status: 500 }
      );
    }

    // Download image from OpenAI URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from OpenAI: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    if (imageBuffer.byteLength === 0) {
      throw new Error("Downloaded image is empty");
    }

    // Upload to Supabase Storage
    const fileName = `${workspace_id}/${content_id}.png`;
    console.log(`Uploading image to: generated-images/${fileName}, size: ${imageBuffer.byteLength} bytes`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    const storagePath = publicUrl.publicUrl;

    // Update generated_content with image_url
    const { error: updateError } = await supabase
      .from("generated_content")
      .update({ image_url: storagePath })
      .eq("id", content_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update content with image" },
        { status: 500 }
      );
    }

    // Insert into visual_assets
    const { error: assetError } = await supabase
      .from("visual_assets")
      .insert({
        workspace_id,
        content_id,
        asset_type: "generated",
        storage_url: storagePath,
        template_style: "dall-e-3",
      });

    if (assetError) {
      console.error("Asset insert error:", assetError);
      // Non-critical error — image is already saved, don't fail the request
    }

    return NextResponse.json({
      success: true,
      image_url: storagePath,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status: 500 }
    );
  }
}
