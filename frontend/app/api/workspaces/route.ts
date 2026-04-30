import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, niche, website_url, brand_voice, cta_style, target_audience, offer_products, ai_provider, brand_colors, forbidden_words, content_pillars, social_handles } = body;

  const { data, error } = await supabase
    .from("workspaces")
    .insert([{
      user_id: user.id,
      name,
      niche,
      website_url,
      brand_voice,
      cta_style,
      target_audience,
      offer_products,
      ai_provider,
      brand_colors,
      forbidden_words,
      content_pillars,
      social_handles,
      is_active: true,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}