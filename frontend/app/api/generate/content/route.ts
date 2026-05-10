import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Workspace, ContentInput } from "@/types";

export async function POST(request: Request) {
  // Check for auth token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { workspace_id, input_id, input_text, platforms, count = 1 } = body;

    if (!workspace_id || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "workspace_id and platforms are required" },
        { status: 400 }
      );
    }

    const variationCount = Math.min(Math.max(count, 1), 3);

    // Create authenticated client with the token for RLS enforcement
    const { createClient: createBrowserClient } = await import("@supabase/supabase-js");
    const authClient = createBrowserClient(
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

    // Validate workspace ownership via RLS
    const { data: workspace, error: wsError } = await authClient
      .from("workspaces")
      .select("*")
      .eq("id", workspace_id)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found or not authorized" },
        { status: 404 }
      );
    }

    // Fetch content input if input_id provided
    let contentText = input_text || "";
    if (input_id) {
      const { data: input } = await authClient
        .from("content_inputs")
        .select("*")
        .eq("id", input_id)
        .single();

      if (input) {
        contentText = input.raw_content || input.source_url || input_text || "";
      }
    }

    if (!contentText) {
      return NextResponse.json(
        { error: "No content to generate from" },
        { status: 400 }
      );
    }

    // Initialize Claude client
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.error("CLAUDE_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured. Please add CLAUDE_API_KEY to environment." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Build system prompt from workspace brand context
    const systemPrompt = buildSystemPrompt(workspace as Workspace);

    // Define variation angles
    const angles = ["storytelling", "educational", "promotional"];
    const angleInstructions: Record<string, string> = {
      storytelling: "Write from an emotional/narrative angle — connect with the reader's feelings and share a story or relatable moment.",
      educational: "Write from an educational angle — teach something valuable, share insights, tips, or data.",
      promotional: "Write from a promotional/conversion angle — focus on benefits, urgency, and a clear CTA.",
    };

    // Generate a shared variation set UUID
    const variationSet = crypto.randomUUID();

    // Generate variations in parallel
    const variationPromises: Promise<{ angle: string; index: number; content: Record<string, string> }>[] = [];

    for (let i = 0; i < variationCount; i++) {
      const angle = angles[i];
      const promise = (async () => {
        const angleInstruction = angleInstructions[angle];
        const userPrompt = `
CONTENT ANGLE: ${angleInstruction}

Generate social media content for these platforms: ${platforms.join(", ")}

Source content:
${contentText}

Return ONLY a valid JSON object with keys for each platform and the generated content as values. Example format:
{"instagram": "Caption here", "facebook": "Post here", "linkedin": "Professional post", "twitter": "Tweet here"}

Only include the platforms requested. Do not include any markdown formatting, code blocks, or additional text.
`;

        const message = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
        });

        const responseText =
          message.content[0].type === "text" ? message.content[0].text : "";

        console.log(`Claude response for ${angle}:`, responseText);

        let generatedContent: Record<string, string>;
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : responseText;
          generatedContent = JSON.parse(jsonString);
          console.log(`Parsed content for ${angle}:`, generatedContent);
        } catch (parseError) {
          console.error(`Failed to parse Claude response for ${angle}:`, responseText, parseError);
          throw new Error(`Failed to parse AI response for ${angle}: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
        }

        return { angle, index: i, content: generatedContent };
      })();

      variationPromises.push(promise);
    }

    let allVariations: { angle: string; index: number; content: Record<string, string> }[];
    try {
      allVariations = await Promise.all(variationPromises);
    } catch (error) {
      console.error("Failed to generate variations:", error);
      return NextResponse.json(
        { error: `Failed to generate variations: ${error instanceof Error ? error.message : "Unknown error"}` },
        { status: 500 }
      );
    }

    // Save generated content to database
    const generatedIds: string[] = [];

    // For each variation, insert rows for each platform
    for (const variation of allVariations) {
      for (const platform of platforms) {
        const content = variation.content[platform];
        if (!content) continue;

        const insertData: any = {
          workspace_id,
          input_id: input_id || null,
          platform,
          content_text: content,
          content_type: "generated",
          status: "draft",
        };

        // Only add variation fields if count > 1
        if (variationCount > 1) {
          insertData.variation_set = variationSet;
          insertData.variation_index = variation.index;
          insertData.variation_angle = variation.angle;
        }

        const { data: insertedContent, error: insertError } = await authClient
          .from("generated_content")
          .insert([insertData])
          .select("id");

        if (insertError) {
          console.error(`Failed to insert content for ${platform} (${variation.angle}):`, insertError);
        } else if (insertedContent && insertedContent[0]) {
          generatedIds.push(insertedContent[0].id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      input_id: input_id || null,
      generated_ids: generatedIds,
      count: generatedIds.length,
      variation_set: variationCount > 1 ? variationSet : null,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Content generation error:", errorMsg, error);
    return NextResponse.json(
      { error: `Failed to generate content: ${errorMsg}` },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(workspace: Workspace): string {
  const brandContext = {
    name: workspace.name,
    niche: workspace.niche || "general",
    voice: workspace.brand_voice || "engaging and authentic",
    audience: workspace.target_audience || "general audience",
    products: workspace.offer_products || "products and services",
    cta: workspace.cta_style || "Shop now",
    pillars: (workspace.content_pillars || []).join(", ") || "lifestyle, education, promotion",
    forbidden: (workspace.forbidden_words || []).join(", ") || "none",
  };

  return `You are a world-class social media content strategist for ${brandContext.name}, a ${brandContext.niche} brand.

BRAND GUIDELINES:
- Brand Voice: ${brandContext.voice}
- Target Audience: ${brandContext.audience}
- Products/Offers: ${brandContext.products}
- Call-to-Action Style: "${brandContext.cta}"
- Content Pillars: ${brandContext.pillars}
- FORBIDDEN WORDS (never use): ${brandContext.forbidden}

PLATFORM-SPECIFIC REQUIREMENTS:
- Instagram: Engaging caption with 5-8 relevant hashtags. Max 2200 characters. Use emojis appropriately.
- Facebook: Conversational, storytelling tone. Can be longer. Build community connection.
- LinkedIn: Professional, thought leadership angle. 600-800 characters. Educational value.
- Twitter: Punchy hook within 280 characters. 1-2 hashtags max. Action-oriented.
- TikTok: Hook-based script/caption. Trend-aware. Punchy and entertaining.

Generate platform-optimized content that:
1. Maintains the brand voice
2. Resonates with the target audience
3. Avoids all forbidden words
4. Includes a compelling CTA
5. Follows platform best practices
6. Is original and creative`;
}
