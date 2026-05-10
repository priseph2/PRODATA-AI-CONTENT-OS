"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ContentTemplate, Workspace } from "@/types";
import { Plus, Trash2, Edit2 } from "lucide-react";

const PLATFORMS = ["instagram", "facebook", "linkedin", "twitter"] as const;

export default function TemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | typeof PLATFORMS[number]>("all");
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", platform: "instagram", category: "", template_text: "" });

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchTemplates();
    }
  }, [selectedWorkspace]);

  const fetchWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

      if (data && data.length > 0) {
        setWorkspaces(data);
        setSelectedWorkspace(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await supabase
        .from("content_templates")
        .select("*")
        .eq("workspace_id", selectedWorkspace)
        .order("created_at", { ascending: false });

      if (data) {
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.template_text) {
      alert("Please fill in name and template text");
      return;
    }

    try {
      if (editingTemplate) {
        await supabase
          .from("content_templates")
          .update({
            name: formData.name,
            platform: formData.platform,
            category: formData.category,
            template_text: formData.template_text,
          })
          .eq("id", editingTemplate.id);
      } else {
        await supabase.from("content_templates").insert({
          workspace_id: selectedWorkspace,
          name: formData.name,
          platform: formData.platform,
          category: formData.category,
          template_text: formData.template_text,
        });
      }

      setShowForm(false);
      setEditingTemplate(null);
      setFormData({ name: "", platform: "instagram", category: "", template_text: "" });
      await fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;

    try {
      await supabase.from("content_templates").delete().eq("id", id);
      await fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template");
    }
  };

  const handleEdit = (template: ContentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      platform: template.platform,
      category: template.category || "",
      template_text: template.template_text,
    });
    setShowForm(true);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setFormData({ name: "", platform: "instagram", category: "", template_text: "" });
    setShowForm(true);
  };

  const filteredTemplates = filter === "all"
    ? templates
    : templates.filter(t => t.platform === filter);

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
        <div className="text-center py-20 card-glass p-12 border-cyan-400/20">
          <p className="text-gray-400 mb-6">No workspaces found</p>
          <p className="text-gray-500 text-sm">Create a workspace to start managing templates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Templates</h1>
        <p className="text-gray-400 mt-2">Create reusable content templates</p>
      </div>

      {/* Workspace Selector */}
      <div className="card-glass border-cyan-400/20 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Select Workspace</label>
        <select
          value={selectedWorkspace}
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          className="input-modern w-full md:w-96"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name} {ws.niche && `(${ws.niche})`}
            </option>
          ))}
        </select>
      </div>

      {/* Filter & New Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {["all", ...PLATFORMS].map((platform) => (
            <button
              key={platform}
              onClick={() => setFilter(platform as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === platform
                  ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/50"
                  : "bg-navy-800/30 text-gray-400 border border-cyan-400/10 hover:border-cyan-400/30"
              }`}
            >
              {platform === "all" ? "All" : platform.charAt(0).toUpperCase() + platform.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={handleNewTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 rounded-lg hover:bg-cyan-400/30 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-20 card-glass p-12 border-cyan-400/20">
          <p className="text-gray-400 mb-2">No templates yet</p>
          <p className="text-gray-500 text-sm">Create your first template to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="card-glass border border-cyan-400/10 p-6 hover:border-cyan-400/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{template.name}</h3>
                  <span className="inline-block mt-1 text-xs px-2 py-1 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                    {template.platform}
                  </span>
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-navy-800/50 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-navy-800/50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {template.category && (
                <p className="text-xs text-gray-500 mb-2">Category: {template.category}</p>
              )}
              <p className="text-gray-400 text-sm line-clamp-3">{template.template_text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="card-glass border border-cyan-400/20 max-w-2xl w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingTemplate ? "Edit Template" : "New Template"}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-modern w-full"
                  placeholder="e.g., Product Launch"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="input-modern w-full"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-modern w-full"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Template Text</label>
                <textarea
                  value={formData.template_text}
                  onChange={(e) => setFormData({ ...formData, template_text: e.target.value })}
                  className="input-modern w-full h-32 resize-none"
                  placeholder="Your template with placeholders like {product_name}, {benefit}..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-cyan-400/10">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-3 bg-navy-800/50 border border-cyan-400/20 text-white rounded-lg hover:border-cyan-400/50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 px-4 py-3 bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 rounded-lg hover:bg-cyan-400/30 transition-all font-medium"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
