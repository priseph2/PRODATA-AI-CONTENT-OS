"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Workspace } from "@/types";
import { Plus, Edit, Trash2, Copy, MoreHorizontal, Search } from "lucide-react";

export default function WorkspacesPage() {
  const supabase = createClient();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setWorkspaces(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workspace?")) return;

    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", id);

    if (!error) {
      setWorkspaces(workspaces.filter((w) => w.id !== id));
    }
  };

  const handleDuplicate = async (workspace: Workspace) => {
    const { data, error } = await supabase
      .from("workspaces")
      .insert([{
        name: `${workspace.name} (Copy)`,
        niche: workspace.niche,
        website_url: workspace.website_url,
        social_handles: workspace.social_handles,
        brand_colors: workspace.brand_colors,
        brand_voice: workspace.brand_voice,
        cta_style: workspace.cta_style,
        target_audience: workspace.target_audience,
        offer_products: workspace.offer_products,
        forbidden_words: workspace.forbidden_words,
        content_pillars: workspace.content_pillars,
        ai_provider: workspace.ai_provider,
      }]);

    if (!error && data) {
      fetchWorkspaces();
    }
  };

  const filteredWorkspaces = workspaces.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.niche?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Workspaces</h1>
          <p className="text-gray-400 mt-2">Manage your client workspaces and campaigns</p>
        </div>
        <Link
          href="/dashboard/workspaces/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Workspace
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search workspaces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-modern pl-12"
        />
      </div>

      {/* Workspaces Grid */}
      {loading ? (
        <div className="text-gray-400 text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full mb-4" />
          <p>Loading workspaces...</p>
        </div>
      ) : filteredWorkspaces.length === 0 ? (
        <div className="text-center py-20 card-glass p-12 border-cyan-400/20">
          <p className="text-gray-400 mb-6 text-lg">No workspaces found</p>
          <Link
            href="/dashboard/workspaces/new"
            className="inline-block btn-primary"
          >
            Create your first workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="card-glass border-cyan-400/20 p-6 hover:border-cyan-400/50 transition-all duration-300 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:gradient-text transition-all">{workspace.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{workspace.niche || "No niche set"}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDuplicate(workspace)}
                    className="p-2 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/dashboard/workspaces/${workspace.id}`}
                    className="p-2 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(workspace.id)}
                    className="p-2 text-gray-400 hover:text-coral-400 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Brand Colors */}
              {workspace.brand_colors && workspace.brand_colors.length > 0 && (
                <div className="flex items-center gap-2 mb-6 pb-6 border-b border-cyan-400/10">
                  {workspace.brand_colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg border border-cyan-400/20 shadow-lg"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs mb-6">
                <div className="bg-navy-800/50 border border-cyan-400/10 rounded-lg py-3 px-2">
                  <p className="text-white font-bold text-lg">0</p>
                  <p className="text-gray-400 text-xs mt-1">Content</p>
                </div>
                <div className="bg-navy-800/50 border border-cyan-400/10 rounded-lg py-3 px-2">
                  <p className="text-white font-bold text-lg">0</p>
                  <p className="text-gray-400 text-xs mt-1">Approved</p>
                </div>
                <div className="bg-navy-800/50 border border-cyan-400/10 rounded-lg py-3 px-2">
                  <p className="text-white font-bold text-lg">0</p>
                  <p className="text-gray-400 text-xs mt-1">Scheduled</p>
                </div>
              </div>

              {/* AI Provider Badge & Status */}
              <div className="flex items-center justify-between pt-4 border-t border-cyan-400/10">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  workspace.ai_provider === "claude"
                    ? "bg-amber-400/20 text-amber-300"
                    : "bg-green-400/20 text-green-300"
                }`}>
                  {workspace.ai_provider === "claude" ? "Claude" : "OpenAI"}
                </span>
                <span className={`text-xs font-medium ${workspace.is_active ? "text-cyan-400" : "text-gray-500"}`}>
                  {workspace.is_active ? "● Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}