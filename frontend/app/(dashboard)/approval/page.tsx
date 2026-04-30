"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GeneratedContent, Workspace } from "@/types";
import { Check, X, RotateCw, Calendar, Edit, Trash2 } from "lucide-react";

export default function ApprovalPage() {
  const supabase = createClient();
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "approved">("all");

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchContent();
    }
  }, [selectedWorkspace, filter]);

  const fetchWorkspaces = async () => {
    const { data } = await supabase
      .from("workspaces")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data && data.length > 0) {
      setWorkspaces(data);
      setSelectedWorkspace(data[0].id);
    }
    setLoading(false);
  };

  const fetchContent = async () => {
    let query = supabase
      .from("generated_content")
      .select("*")
      .eq("workspace_id", selectedWorkspace);

    if (filter !== "all") {
      query = query.eq("status", filter);
    } else {
      query = query.neq("status", "rejected");
    }

    const { data } = await query.order("created_at", { ascending: false });

    if (data) setContent(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    await supabase
      .from("generated_content")
      .update({ status: "approved" })
      .eq("id", id);

    setContent(content.map((c) => c.id === id ? { ...c, status: "approved" } : c));
  };

  const handleReject = async (id: string) => {
    await supabase
      .from("generated_content")
      .update({ status: "rejected" })
      .eq("id", id);

    setContent(content.filter((c) => c.id !== id));
  };

  const handleRegenerate = async (contentItem: GeneratedContent) => {
    alert("Regeneration would trigger n8n workflow to regenerate this content item.");
  };

  const handleSchedule = (id: string) => {
    alert("Schedule modal would open here. Connect to n8n for scheduling.");
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: "📷",
      facebook: "📘",
      linkedin: "💼",
      twitter: "🐦",
    };
    return icons[platform] || "📝";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-400 bg-green-400/10";
      case "draft": return "text-yellow-400 bg-yellow-400/10";
      case "rejected": return "text-red-400 bg-red-400/10";
      default: return "text-slate-400 bg-slate-400/10";
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-400">Loading...</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Approval Board</h1>
          <p className="text-slate-400 mt-1">Review and approve generated content</p>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="mb-6">
        <select
          value={selectedWorkspace}
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          className="w-full md:w-1/3 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        {(["all", "draft", "approved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {content.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 mb-2">No content to review</p>
          <p className="text-slate-600 text-sm">Generate content in the Content tab to see it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getPlatformIcon(item.platform)}</span>
                  <span className="text-white font-medium capitalize">{item.platform}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-slate-300 text-sm line-clamp-4 whitespace-pre-wrap">
                  {item.content_text}
                </p>
                <p className="text-slate-600 text-xs mt-3">
                  {item.content_type} • {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              {item.status === "draft" && (
                <div className="flex items-center gap-2 p-4 border-t border-slate-800">
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRegenerate(item)}
                    className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              )}

              {item.status === "approved" && (
                <div className="flex items-center gap-2 p-4 border-t border-slate-800">
                  <button
                    onClick={() => handleSchedule(item.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-500 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}