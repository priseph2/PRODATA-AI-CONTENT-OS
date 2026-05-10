"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Workspace } from "@/types";
import { ChevronLeft, Plus, X } from "lucide-react";

export default function EditWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = (params?.id || "") as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<Workspace | null>(null);
  const [newPillar, setNewPillar] = useState("");
  const [newForbiddenWord, setNewForbiddenWord] = useState("");
  const [newColor, setNewColor] = useState("");

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", workspaceId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error("Workspace not found");

      setFormData(data as Workspace);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  const addPillar = () => {
    if (!formData || !newPillar.trim()) return;
    setFormData(prev => prev ? {
      ...prev,
      content_pillars: [...(prev.content_pillars || []), newPillar.trim()]
    } : null);
    setNewPillar("");
  };

  const removePillar = (index: number) => {
    if (!formData) return;
    setFormData(prev => prev ? {
      ...prev,
      content_pillars: prev.content_pillars.filter((_, i) => i !== index)
    } : null);
  };

  const addForbiddenWord = () => {
    if (!formData || !newForbiddenWord.trim()) return;
    setFormData(prev => prev ? {
      ...prev,
      forbidden_words: [...(prev.forbidden_words || []), newForbiddenWord.trim()]
    } : null);
    setNewForbiddenWord("");
  };

  const removeForbiddenWord = (index: number) => {
    if (!formData) return;
    setFormData(prev => prev ? {
      ...prev,
      forbidden_words: prev.forbidden_words.filter((_, i) => i !== index)
    } : null);
  };

  const addColor = () => {
    if (!formData || !newColor.trim()) return;
    setFormData(prev => prev ? {
      ...prev,
      brand_colors: [...(prev.brand_colors || []), newColor.trim()]
    } : null);
    setNewColor("");
  };

  const removeColor = (index: number) => {
    if (!formData) return;
    setFormData(prev => prev ? {
      ...prev,
      brand_colors: prev.brand_colors.filter((_, i) => i !== index)
    } : null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!formData) return;
    const { name, value } = e.target;

    if (name.startsWith("social_")) {
      const platform = name.replace("social_", "");
      setFormData(prev => prev ? {
        ...prev,
        social_handles: {
          ...prev.social_handles,
          [platform as keyof typeof prev.social_handles]: value
        }
      } : null);
    } else {
      setFormData(prev => prev ? {
        ...prev,
        [name]: value
      } : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setError("");
    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from("workspaces")
        .update({
          name: formData.name,
          niche: formData.niche,
          website_url: formData.website_url,
          brand_voice: formData.brand_voice,
          cta_style: formData.cta_style,
          target_audience: formData.target_audience,
          offer_products: formData.offer_products,
          content_pillars: formData.content_pillars,
          forbidden_words: formData.forbidden_words,
          ai_provider: formData.ai_provider,
          social_handles: formData.social_handles,
          brand_colors: formData.brand_colors,
          is_active: formData.is_active,
        })
        .eq("id", workspaceId);

      if (updateError) throw updateError;

      router.push("/dashboard/workspaces");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workspace");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full mb-4" />
          <p className="text-gray-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-coral-400">{error || "Workspace not found"}</p>
          <Link href="/dashboard/workspaces" className="btn-primary inline-block mt-4">
            Back to Workspaces
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/workspaces"
            className="p-2 hover:bg-navy-800/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-white">Edit Workspace</h1>
            <p className="text-gray-400 mt-2">{formData.name}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-coral-400/10 border border-coral-400/30 rounded-lg p-4 text-coral-300">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="card-glass border-cyan-400/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Basic Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-modern w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Niche
                  </label>
                  <input
                    type="text"
                    name="niche"
                    value={formData.niche}
                    onChange={handleInputChange}
                    className="input-modern w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleInputChange}
                    className="input-modern w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    className="input-modern w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Offer / Products
                  </label>
                  <input
                    type="text"
                    name="offer_products"
                    value={formData.offer_products}
                    onChange={handleInputChange}
                    className="input-modern w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Brand Voice */}
          <div className="card-glass border-cyan-400/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Brand Voice & Style</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Brand Voice / Tone
                </label>
                <textarea
                  name="brand_voice"
                  value={formData.brand_voice}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-modern w-full resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CTA Style
                  </label>
                  <input
                    type="text"
                    name="cta_style"
                    value={formData.cta_style}
                    onChange={handleInputChange}
                    className="input-modern w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    AI Provider
                  </label>
                  <select
                    name="ai_provider"
                    value={formData.ai_provider}
                    onChange={handleInputChange}
                    className="input-modern w-full"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="claude">Claude</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Content Pillars */}
          <div className="card-glass border-cyan-400/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Content Pillars</h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPillar())}
                  placeholder="Add a content pillar..."
                  className="input-modern flex-1"
                />
                <button
                  type="button"
                  onClick={addPillar}
                  className="px-4 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {formData.content_pillars.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.content_pillars.map((pillar, index) => (
                    <div
                      key={index}
                      className="bg-cyan-400/10 border border-cyan-400/30 rounded-lg px-3 py-1 flex items-center gap-2 text-cyan-300"
                    >
                      <span>{pillar}</span>
                      <button
                        type="button"
                        onClick={() => removePillar(index)}
                        className="hover:text-coral-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Forbidden Words */}
          <div className="card-glass border-cyan-400/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Forbidden Words</h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newForbiddenWord}
                  onChange={(e) => setNewForbiddenWord(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addForbiddenWord())}
                  placeholder="Add a forbidden word..."
                  className="input-modern flex-1"
                />
                <button
                  type="button"
                  onClick={addForbiddenWord}
                  className="px-4 py-2 bg-coral-400/20 hover:bg-coral-400/30 text-coral-300 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {formData.forbidden_words.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.forbidden_words.map((word, index) => (
                    <div
                      key={index}
                      className="bg-coral-400/10 border border-coral-400/30 rounded-lg px-3 py-1 flex items-center gap-2 text-coral-300"
                    >
                      <span>{word}</span>
                      <button
                        type="button"
                        onClick={() => removeForbiddenWord(index)}
                        className="hover:text-cyan-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Brand Colors */}
          <div className="card-glass border-cyan-400/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Brand Colors</h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                  placeholder="e.g., #1a1a2e or rgb(26, 26, 46)"
                  className="input-modern flex-1"
                />
                <button
                  type="button"
                  onClick={addColor}
                  className="px-4 py-2 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {formData.brand_colors.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {formData.brand_colors.map((color, index) => (
                    <div key={index} className="relative group">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-cyan-400/30 shadow-lg"
                        style={{ backgroundColor: color }}
                      />
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="absolute -top-2 -right-2 bg-navy-900 border border-coral-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-coral-400" />
                      </button>
                      <p className="text-xs text-gray-400 mt-1 text-center">{color}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Social Handles */}
          <div className="card-glass border-cyan-400/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Social Handles</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(formData.social_handles).map((platform) => (
                <div key={platform}>
                  <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                    {platform}
                  </label>
                  <input
                    type="text"
                    name={`social_${platform}`}
                    value={formData.social_handles[platform as keyof typeof formData.social_handles]}
                    onChange={handleInputChange}
                    className="input-modern w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              href="/dashboard/workspaces"
              className="px-6 py-3 btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
