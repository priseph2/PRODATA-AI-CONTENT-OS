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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Workspaces</h1>
          <p className="text-slate-400 mt-1">Manage your client workspaces</p>
        </div>
        <Link
          href="/dashboard/workspaces/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Workspace
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search workspaces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Workspaces Grid */}
      {loading ? (
        <div className="text-slate-400 text-center py-12">Loading workspaces...</div>
      ) : filteredWorkspaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No workspaces found</p>
          <Link
            href="/dashboard/workspaces/new"
            className="text-purple-400 hover:text-purple-300"
          >
            Create your first workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{workspace.name}</h3>
                  <p className="text-slate-400 text-sm">{workspace.niche || "No niche set"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicate(workspace)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/dashboard/workspaces/${workspace.id}`}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(workspace.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Brand Colors */}
              {workspace.brand_colors && workspace.brand_colors.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  {workspace.brand_colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-slate-600"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-800 rounded-lg py-2 px-3">
                  <p className="text-white font-semibold">0</p>
                  <p className="text-slate-500">Content</p>
                </div>
                <div className="bg-slate-800 rounded-lg py-2 px-3">
                  <p className="text-white font-semibold">0</p>
                  <p className="text-slate-500">Approved</p>
                </div>
                <div className="bg-slate-800 rounded-lg py-2 px-3">
                  <p className="text-white font-semibold">0</p>
                  <p className="text-slate-500">Scheduled</p>
                </div>
              </div>

              {/* AI Provider Badge */}
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  workspace.ai_provider === "claude"
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-green-500/20 text-green-400"
                }`}>
                  {workspace.ai_provider === "claude" ? "Claude" : "OpenAI"}
                </span>
                <span className={`text-xs ${workspace.is_active ? "text-green-400" : "text-slate-500"}`}>
                  {workspace.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}