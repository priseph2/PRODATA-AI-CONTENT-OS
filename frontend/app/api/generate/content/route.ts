import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Trigger n8n workflow for content generation
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { workspace_id, input_text, input_type, platforms } = body;

    // Validate workspace ownership
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Call n8n webhook to trigger content generation
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      // Fallback: simulate generation for demo purposes
      const mockContentIds = platforms.flatMap((platform: string) =>
        Array(3).fill(null).map((_, i) => `demo-${platform}-${i}`)
      );

      return NextResponse.json({
        success: true,
        message: "Demo mode: n8n webhook not configured",
        input_id: `input-${Date.now()}`,
        generated_ids: mockContentIds,
      });
    }

    // Call n8n webhook
    const n8nResponse = await fetch(`${n8nWebhookUrl}/generate-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id,
        input_text,
        input_type: input_type || "text",
        platforms,
        user_id: user.id,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error("n8n workflow failed");
    }

    const result = await n8nResponse.json();

    return NextResponse.json({
      success: true,
      input_id: result.input_id,
      generated_ids: result.generated_ids,
    });
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}