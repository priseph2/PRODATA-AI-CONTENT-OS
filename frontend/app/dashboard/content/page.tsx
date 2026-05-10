"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Workspace, ContentInput } from "@/types";
import { Trash2, FileText, Link as LinkIcon, Zap, Check } from "lucide-react";

export default function ContentPage() {
  const supabase = createClient();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [contentInputs, setContentInputs] = useState<ContentInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [textContent, setTextContent] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [viewingInput, setViewingInput] = useState<ContentInput | null>(null);
  const [generatingInput, setGeneratingInput] = useState<ContentInput | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "facebook", "linkedin", "twitter"]);
  const [variationCount, setVariationCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchContentInputs();
    }
  }, [selectedWorkspaceId]);

  const fetchWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setWorkspaces(data);
        if (data.length > 0) {
          setSelectedWorkspaceId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContentInputs = async () => {
    if (!selectedWorkspaceId) return;

    try {
      const { data } = await supabase
        .from("content_inputs")
        .select("*")
        .eq("workspace_id", selectedWorkspaceId)
        .order("created_at", { ascending: false });

      if (data) {
        setContentInputs(data);
      }
    } catch (error) {
      console.error("Error fetching content inputs:", error);
    }
  };

  const handleAddTextContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() || !selectedWorkspaceId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("content_inputs")
        .insert([
          {
            workspace_id: selectedWorkspaceId,
            input_type: "text",
            raw_content: textContent,
            extracted_metadata: {},
          },
        ]);

      if (error) throw error;

      setTextContent("");
      await fetchContentInputs();
    } catch (error) {
      console.error("Error adding content:", error);
      alert("Failed to add content");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !selectedWorkspaceId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("content_inputs")
        .insert([
          {
            workspace_id: selectedWorkspaceId,
            input_type: "url",
            raw_content: "",
            source_url: urlInput,
            extracted_metadata: {},
          },
        ]);

      if (error) throw error;

      setUrlInput("");
      await fetchContentInputs();
    } catch (error) {
      console.error("Error adding URL:", error);
      alert("Failed to add URL");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content input?")) return;

    try {
      const { error } = await supabase
        .from("content_inputs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchContentInputs();
    } catch (error) {
      console.error("Error deleting content:", error);
      alert("Failed to delete content");
    }
  };

  const handleGenerateContent = async () => {
    if (!generatingInput || selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    try {
      // Get the session token for auth
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/generate/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
        body: JSON.stringify({
          workspace_id: selectedWorkspaceId,
          input_id: generatingInput.id,
          input_text: generatingInput.raw_content,
          platforms: selectedPlatforms,
          count: variationCount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate content");
      }

      const result = await response.json();
      const suffix = variationCount > 1 ? ` (${variationCount} variations per platform)` : "";
      setSuccessMessage(`✓ Generated ${result.count} posts${suffix}! View in Approval Board`);
      setGeneratingInput(null);
      setVariationCount(1);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Generation error:", error);
      alert(`Failed to generate content: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Content Input</h1>
          <p className="text-gray-400 mb-8">Create content from text or URLs</p>

          <div className="text-center py-20 card-glass p-12 border-cyan-400/20">
            <p className="text-gray-400 mb-6 text-lg">No workspaces found</p>
            <Link href="/dashboard/workspaces/new" className="btn-primary inline-block">
              Create your first workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white">Content Input</h1>
        <p className="text-gray-400 mt-2">Create content from text or URLs</p>
      </div>

      <div className="card-glass border-cyan-400/20 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Select Workspace</label>
        <select
          value={selectedWorkspaceId}
          onChange={(e) => setSelectedWorkspaceId(e.target.value)}
          className="input-modern w-full md:w-96"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name} {ws.niche && `(${ws.niche})`}
            </option>
          ))}
        </select>
        <p className="text-gray-400 text-sm mt-2">
          {contentInputs.length} content input{contentInputs.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-glass border-cyan-400/20 p-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Paste Content</h2>
            </div>
            <form onSubmit={handleAddTextContent} className="space-y-4">
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste your content here..."
                rows={6}
                className="input-modern w-full resize-none"
              />
              <button
                type="submit"
                disabled={submitting || !textContent.trim()}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Adding..." : "Add Content"}
              </button>
            </form>
          </div>

          <div className="card-glass border-cyan-400/20 p-8">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-5 h-5 text-amber-400" />
              <h2 className="text-2xl font-bold text-white">Add URL</h2>
            </div>
            <form onSubmit={handleAddUrl} className="space-y-4">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/blog-post"
                className="input-modern w-full"
              />
              <p className="text-gray-400 text-sm">Supports blog posts, product pages, YouTube videos, and more</p>
              <button
                type="submit"
                disabled={submitting || !urlInput.trim()}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Adding..." : "Add URL"}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-glass border-cyan-400/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">What Next?</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>1. Add content from text or URLs</li>
              <li>2. AI generates variations</li>
              <li>3. Review and approve</li>
              <li>4. Schedule posts</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card-glass border-cyan-400/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Content Inputs ({contentInputs.length})</h2>
        {contentInputs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No content inputs yet. Add one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contentInputs.map((input) => (
              <div key={input.id} className="flex items-center justify-between p-4 bg-navy-800/30 border border-cyan-400/10 rounded-lg hover:border-cyan-400/30 transition-all cursor-pointer group">
                <div className="flex-1 min-w-0" onClick={() => setViewingInput(input)}>
                  <div className="flex items-center gap-2">
                    {input.input_type === "text" ? (
                      <FileText className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <LinkIcon className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-xs font-medium text-gray-400 uppercase">{input.input_type}</span>
                  </div>
                  <p className="text-white font-medium mt-1 truncate group-hover:text-cyan-300 transition-colors">
                    {input.input_type === "text"
                      ? input.raw_content.substring(0, 100) + (input.raw_content.length > 100 ? "..." : "")
                      : input.source_url}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{new Date(input.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => {
                      setGeneratingInput(input);
                      setSelectedPlatforms(["instagram", "facebook", "linkedin", "twitter"]);
                      setVariationCount(1);
                    }}
                    className="p-2 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors"
                    title="Generate content"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(input.id)}
                    className="p-2 text-gray-400 hover:text-coral-400 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingInput && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewingInput(null)}
        >
          <div
            className="card-glass border border-cyan-400/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingInput(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-6">
              {viewingInput.input_type === "text" ? (
                <FileText className="w-6 h-6 text-cyan-400" />
              ) : (
                <LinkIcon className="w-6 h-6 text-amber-400" />
              )}
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-cyan-400/20 text-cyan-300 uppercase">
                  {viewingInput.input_type}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {viewingInput.input_type === "text" ? "Content Text" : "URL Source"}
                </h2>
                <div className="bg-navy-800/50 border border-cyan-400/10 rounded-lg p-6 text-white whitespace-pre-wrap break-words">
                  {viewingInput.input_type === "text"
                    ? viewingInput.raw_content
                    : viewingInput.source_url}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cyan-400/10">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Type</p>
                  <p className="text-white font-medium capitalize">{viewingInput.input_type}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Created</p>
                  <p className="text-white font-medium">{new Date(viewingInput.created_at).toLocaleString()}</p>
                </div>
                {viewingInput.input_type === "url" && viewingInput.source_url && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-sm mb-2">Source URL</p>
                    <a
                      href={viewingInput.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 transition-colors break-all"
                    >
                      {viewingInput.source_url}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-cyan-400/10">
              <button
                onClick={() => setViewingInput(null)}
                className="flex-1 px-4 py-3 bg-navy-800/50 border border-cyan-400/20 text-white rounded-lg hover:border-cyan-400/50 transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed bottom-8 right-8 flex items-center gap-3 card-glass border border-green-400/20 bg-green-400/10 px-6 py-4 rounded-lg z-40">
          <Check className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-white font-medium">{successMessage.split("!")[0]}!</p>
            {successMessage.includes("Approval Board") && (
              <Link href="/dashboard/approval" className="text-green-400 hover:text-green-300 text-sm underline">
                Go to Approval Board →
              </Link>
            )}
          </div>
        </div>
      )}

      {generatingInput && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => generatingInput && !isGenerating && setGeneratingInput(null)}
        >
          <div
            className="card-glass border border-cyan-400/20 max-w-md w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !isGenerating && setGeneratingInput(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
              disabled={isGenerating}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">Generate Content</h2>
            <p className="text-gray-400 text-sm mb-6">
              Select platforms and number of variations
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Variations</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setVariationCount(num)}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      variationCount === num
                        ? "bg-cyan-400 text-navy-900"
                        : "bg-navy-800/50 text-gray-300 border border-cyan-400/20 hover:border-cyan-400/50"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-2">
                {variationCount === 1 && "Single variation"}
                {variationCount === 2 && "Two variations (storytelling, promotional)"}
                {variationCount === 3 && "Three variations (storytelling, educational, promotional)"}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {[
                { id: "instagram", label: "Instagram", icon: "📷" },
                { id: "facebook", label: "Facebook", icon: "📘" },
                { id: "linkedin", label: "LinkedIn", icon: "💼" },
                { id: "twitter", label: "Twitter", icon: "🐦" },
              ].map((platform) => (
                <label key={platform.id} className="flex items-center gap-3 p-3 bg-navy-800/50 border border-cyan-400/10 rounded-lg cursor-pointer hover:border-cyan-400/30 transition-all">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform.id)}
                    onChange={() => togglePlatform(platform.id)}
                    disabled={isGenerating}
                    className="w-4 h-4 rounded border-cyan-400/20 bg-navy-700 text-cyan-400 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-lg">{platform.icon}</span>
                  <span className="text-white font-medium flex-1">{platform.label}</span>
                  {selectedPlatforms.includes(platform.id) && (
                    <Check className="w-4 h-4 text-cyan-400" />
                  )}
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setGeneratingInput(null)}
                disabled={isGenerating}
                className="flex-1 px-4 py-3 bg-navy-800/50 border border-cyan-400/20 text-white rounded-lg hover:border-cyan-400/50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateContent}
                disabled={isGenerating || selectedPlatforms.length === 0}
                className="flex-1 px-4 py-3 bg-cyan-400 text-navy-900 rounded-lg hover:bg-cyan-300 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
