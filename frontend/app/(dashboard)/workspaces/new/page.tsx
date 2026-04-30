"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Workspace } from "@/types";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function NewWorkspacePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    niche: "",
    website_url: "",
    brand_voice: "",
    cta_style: "",
    target_audience: "",
    offer_products: "",
    ai_provider: "openai" as "openai" | "claude",
    brand_colors: ["#1a1a2e", "#e94560"],
    forbidden_words: [] as string[],
    content_pillars: [] as string[],
    social_handles: {
      instagram: "",
      facebook: "",
      linkedin: "",
      twitter: "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("workspaces")
      .insert([formData]);

    if (!error) {
      router.push("/dashboard/workspaces");
    }
    setLoading(false);
  };

  const addToArray = (field: "brand_colors" | "forbidden_words" | "content_pillars", value: string) => {
    if (!value.trim()) return;
    setFormData({ ...formData, [field]: [...formData[field], value.trim()] });
  };

  const removeFromArray = (field: "brand_colors" | "forbidden_words" | "content_pillars", index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/workspaces"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">New Workspace</h1>
          <p className="text-slate-400 mt-1">Create a new client workspace</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Basic Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Basic Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Workspace Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                placeholder="Scentified"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Niche</label>
              <input
                type="text"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                placeholder="Luxury perfume subscription"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Website URL</label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              placeholder="https://scentified.com"
            />
          </div>
        </div>

        {/* Brand Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Brand Profile</h2>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Brand Voice</label>
            <textarea
              value={formData.brand_voice}
              onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              placeholder="Sophisticated, sensual, confident..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">CTA Style</label>
            <input
              type="text"
              value={formData.cta_style}
              onChange={(e) => setFormData({ ...formData, cta_style: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              placeholder="Shop now / Subscribe / Discover"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Target Audience</label>
            <textarea
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              placeholder="Women 25-45 who value self-care..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Offer Products</label>
            <textarea
              value={formData.offer_products}
              onChange={(e) => setFormData({ ...formData, offer_products: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              placeholder="Monthly perfume subscriptions..."
              rows={2}
            />
          </div>
        </div>

        {/* Brand Colors */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Brand Colors</h2>
          <div className="flex items-center gap-4">
            {formData.brand_colors.map((color, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const newColors = [...formData.brand_colors];
                    newColors[i] = e.target.value;
                    setFormData({ ...formData, brand_colors: newColors });
                  }}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => removeFromArray("brand_colors", i)}
                  className="p-1 text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, brand_colors: [...formData.brand_colors, "#ffffff"] })}
              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white border border-slate-700 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Color
            </button>
          </div>
        </div>

        {/* Social Handles */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Social Handles</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Instagram</label>
              <input
                type="text"
                value={formData.social_handles.instagram}
                onChange={(e) => setFormData({ ...formData, social_handles: { ...formData.social_handles, instagram: e.target.value } })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                placeholder="@scentified"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Facebook</label>
              <input
                type="text"
                value={formData.social_handles.facebook}
                onChange={(e) => setFormData({ ...formData, social_handles: { ...formData.social_handles, facebook: e.target.value } })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                placeholder="ScentifiedOfficial"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">LinkedIn</label>
              <input
                type="text"
                value={formData.social_handles.linkedin}
                onChange={(e) => setFormData({ ...formData, social_handles: { ...formData.social_handles, linkedin: e.target.value } })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                placeholder="scentified"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Twitter/X</label>
              <input
                type="text"
                value={formData.social_handles.twitter}
                onChange={(e) => setFormData({ ...formData, social_handles: { ...formData.social_handles, twitter: e.target.value } })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                placeholder="@scentified"
              />
            </div>
          </div>
        </div>

        {/* AI Provider */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">AI Provider</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="ai_provider"
                value="openai"
                checked={formData.ai_provider === "openai"}
                onChange={() => setFormData({ ...formData, ai_provider: "openai" })}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-white">OpenAI (GPT-4o-mini)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="ai_provider"
                value="claude"
                checked={formData.ai_provider === "claude"}
                onChange={() => setFormData({ ...formData, ai_provider: "claude" })}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-white">Claude (Sonnet 4)</span>
            </label>
          </div>
        </div>

        {/* Content Pillars */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Content Pillars</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.content_pillars.map((pillar, i) => (
              <span key={i} className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full">
                {pillar}
                <button type="button" onClick={() => removeFromArray("content_pillars", i)} className="hover:text-red-400">×</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a content pillar..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addToArray("content_pillars", (e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
        </div>

        {/* Forbidden Words */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Forbidden Words</h2>
          <p className="text-slate-400 text-sm">AI will avoid these words in generated content</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.forbidden_words.map((word, i) => (
              <span key={i} className="flex items-center gap-2 px-3 py-1 bg-red-600/20 text-red-400 rounded-full">
                {word}
                <button type="button" onClick={() => removeFromArray("forbidden_words", i)} className="hover:text-red-300">×</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a forbidden word..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addToArray("forbidden_words", (e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Workspace"}
          </button>
          <Link
            href="/dashboard/workspaces"
            className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}