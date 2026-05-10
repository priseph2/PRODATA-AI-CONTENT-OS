"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { GeneratedContent, Workspace } from "@/types";
import { Check, X, RotateCw, Calendar, Trash2, Eye, Image as ImageIcon } from "lucide-react";

export default function ApprovalPage() {
  const supabase = createClient();
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "approved">("all");
  const [viewingContent, setViewingContent] = useState<GeneratedContent | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [schedulingContent, setSchedulingContent] = useState<GeneratedContent | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [expandedVariationSet, setExpandedVariationSet] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchContent();
    }
  }, [selectedWorkspace, filter]);

  const fetchWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
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

  const fetchContent = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching content:", error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await supabase
        .from("generated_content")
        .update({ status: "approved" })
        .eq("id", id);

      setContent(content.map((c) => c.id === id ? { ...c, status: "approved" } : c));
    } catch (error) {
      console.error("Error approving:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await supabase
        .from("generated_content")
        .update({ status: "rejected" })
        .eq("id", id);

      setContent(content.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error rejecting:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content?")) return;

    try {
      await supabase
        .from("generated_content")
        .delete()
        .eq("id", id);

      setContent(content.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleRegenerate = async (item: GeneratedContent) => {
    setRegenerating(item.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/generate/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
        body: JSON.stringify({
          workspace_id: selectedWorkspace,
          input_id: item.input_id,
          platforms: [item.platform],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to regenerate");
      }

      // Refresh content list
      await fetchContent();
      setViewingContent(null);
    } catch (error) {
      console.error("Regeneration error:", error);
      alert(`Failed to regenerate: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setRegenerating(null);
    }
  };

  const handleScheduleContent = async () => {
    if (!schedulingContent || !scheduleDateTime) return;

    setIsScheduling(true);
    try {
      const { error: insertError } = await supabase
        .from("scheduled_posts")
        .insert([
          {
            content_id: schedulingContent.id,
            workspace_id: selectedWorkspace,
            platform: schedulingContent.platform,
            scheduled_at: new Date(scheduleDateTime).toISOString(),
            status: "scheduled",
          },
        ]);

      if (insertError) throw insertError;

      // Update generated_content status to published
      await supabase
        .from("generated_content")
        .update({ status: "published" })
        .eq("id", schedulingContent.id);

      // Refresh content and close modals
      await fetchContent();
      setSchedulingContent(null);
      setScheduleDateTime("");
    } catch (error) {
      console.error("Schedule error:", error);
      alert(`Failed to schedule: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsScheduling(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: "📷",
      facebook: "📘",
      linkedin: "💼",
      twitter: "🐦",
      tiktok: "🎵",
    };
    return icons[platform] || "📝";
  };

  const getVariationLabel = (angle: string | undefined): string => {
    if (!angle) return "Default";
    return angle.charAt(0).toUpperCase() + angle.slice(1);
  };

  const groupVariations = () => {
    const groups = new Map<string, GeneratedContent[]>();
    const singles: GeneratedContent[] = [];

    for (const item of content) {
      if (item.variation_set) {
        if (!groups.has(item.variation_set)) {
          groups.set(item.variation_set, []);
        }
        groups.get(item.variation_set)!.push(item);
      } else {
        singles.push(item);
      }
    }

    return { groups, singles };
  };

  const handleGenerateImage = async (item: GeneratedContent) => {
    setGeneratingImage(item.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
        body: JSON.stringify({
          content_id: item.id,
          content_text: item.content_text,
          platform: item.platform,
          workspace_id: selectedWorkspace,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
      }

      const data = await response.json();

      // Refresh from server to get the latest data
      await fetchContent();

      // Add cache buster to force fresh image load
      const imageUrlWithCache = `${data.image_url}?t=${Date.now()}`;

      // Update local state with the new image
      setContent((prevContent) =>
        prevContent.map((c) =>
          c.id === item.id ? { ...c, image_url: imageUrlWithCache } : c
        )
      );

      // Update modal if it's open for this item
      if (viewingContent?.id === item.id) {
        setViewingContent((prev) =>
          prev ? { ...prev, image_url: imageUrlWithCache } : null
        );
      }
    } catch (error) {
      console.error("Image generation error:", error);
      alert(`Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setGeneratingImage(null);
    }
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

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Approval Board</h1>
        <p className="text-gray-400 mt-2">Review and approve generated content</p>
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

      {/* Filters */}
      <div className="flex items-center gap-3">
        {(["all", "draft", "approved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? "bg-cyan-400/20 border border-cyan-400/30 text-cyan-300"
                : "bg-navy-800/50 border border-cyan-400/10 text-gray-400 hover:text-cyan-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button
          onClick={async () => {
            const { data } = await supabase
              .from("generated_content")
              .select("*")
              .eq("workspace_id", selectedWorkspace)
              .eq("status", "rejected")
              .order("created_at", { ascending: false });
            if (data) setContent(data);
            setFilter("all");
          }}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-red-400/20 border border-red-400/30 text-red-300 hover:bg-red-400/30"
        >
          Rejected
        </button>
      </div>

      {/* Content Grid */}
      {content.length === 0 ? (
        <div className="card-glass border-cyan-400/20 p-12 text-center">
          <p className="text-gray-400 mb-2">No content to review</p>
          <p className="text-gray-500 text-sm">Generate content from your inputs to see it here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Variation Groups */}
          {(() => {
            const { groups, singles } = groupVariations();
            const output = [];

            // Render variation groups first
            for (const [setId, items] of Array.from(groups.entries())) {
              const platform = items[0]?.platform || "unknown";
              const isExpanded = expandedVariationSet === setId;
              const approvedItem = items.find((i) => i.status === "approved");

              output.push(
                <div key={`group-${setId}`} className="card-glass border border-cyan-400/20 overflow-hidden">
                  <div
                    className="p-4 border-b border-cyan-400/10 flex items-center justify-between cursor-pointer hover:bg-navy-800/30 transition-all"
                    onClick={() => setExpandedVariationSet(isExpanded ? null : setId)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔀</span>
                      <div>
                        <h3 className="text-white font-medium">{items.length} Variations · {getPlatformIcon(platform)} {platform}</h3>
                        <p className="text-gray-400 text-sm">{approvedItem ? "✓ Selected" : "Awaiting selection"}</p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {isExpanded && (
                    <div className="p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, minmax(250px, 1fr))` }}>
                      {items
                        .sort((a, b) => (a.variation_index || 0) - (b.variation_index || 0))
                        .map((item) => (
                          <div
                            key={item.id}
                            className={`border rounded-lg p-4 transition-all flex flex-col ${
                              item.status === "approved"
                                ? "border-green-400/50 bg-green-400/10"
                                : "border-cyan-400/20 bg-navy-800/30 hover:border-cyan-400/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-cyan-300">{getVariationLabel(item.variation_angle)}</span>
                              {item.status === "approved" && <Check className="w-4 h-4 text-green-400" />}
                            </div>
                            <p className="text-gray-300 text-sm line-clamp-4 mb-3 flex-1">{item.content_text}</p>

                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt="Generated"
                                className="w-full h-20 object-cover rounded mb-3 border border-cyan-400/20"
                              />
                            )}

                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => setViewingContent(item)}
                                className="px-2 py-1 text-xs bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 rounded hover:bg-cyan-400/30 transition-all font-medium"
                                title="View full variation"
                              >
                                👁 View
                              </button>
                              {item.status !== "approved" && (
                                <button
                                  onClick={() => {
                                    handleApprove(item.id);
                                    items.forEach((i) => {
                                      if (i.id !== item.id && i.status !== "rejected") {
                                        handleReject(i.id);
                                      }
                                    });
                                  }}
                                  className="flex-1 px-2 py-1 text-xs bg-green-400/20 border border-green-400/30 text-green-300 rounded hover:bg-green-400/30 transition-all font-medium"
                                >
                                  ✓ Use This
                                </button>
                              )}
                              {item.status === "approved" && (
                                <>
                                  <button
                                    onClick={() => handleGenerateImage(item)}
                                    disabled={generatingImage === item.id}
                                    className="flex-1 px-2 py-1 text-xs bg-violet-400/20 border border-violet-400/30 text-violet-300 rounded hover:bg-violet-400/30 transition-all font-medium disabled:opacity-50"
                                  >
                                    {generatingImage === item.id ? "Generating..." : "🎨 Image"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSchedulingContent(item);
                                      setScheduleDateTime("");
                                    }}
                                    className="flex-1 px-2 py-1 text-xs bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 rounded hover:bg-cyan-400/30 transition-all font-medium"
                                  >
                                    📅 Schedule
                                  </button>
                                </>
                              )}
                              {item.status !== "rejected" && item.status !== "approved" && (
                                <button
                                  onClick={() => handleReject(item.id)}
                                  className="px-2 py-1 text-xs text-gray-400 hover:text-red-400 hover:bg-navy-800/50 rounded transition-colors"
                                  title="Skip this variation"
                                >
                                  ✗
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            }

            // Render single items in a grid
            if (singles.length > 0) {
              output.push(
                <div key="singles" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {singles.map((item) => (
            <div
              key={item.id}
              className="card-glass border border-cyan-400/10 hover:border-cyan-400/30 transition-all overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-cyan-400/10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getPlatformIcon(item.platform)}</span>
                  <span className="text-white font-medium capitalize">{item.platform}</span>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  item.status === "approved" ? "bg-green-400/20 text-green-300" :
                  item.status === "draft" ? "bg-amber-400/20 text-amber-300" :
                  "bg-red-400/20 text-red-300"
                }`}>
                  {item.status}
                </span>
              </div>

              {/* Image Thumbnail */}
              {item.image_url && (
                <div className="px-4 pt-4">
                  <img
                    src={item.image_url}
                    alt="Generated"
                    className="w-full h-40 object-cover rounded-lg border border-cyan-400/20"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-4">
                <p className="text-gray-300 text-sm line-clamp-5 whitespace-pre-wrap">
                  {item.content_text}
                </p>
                <p className="text-gray-500 text-xs mt-4">
                  {item.content_type} • {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="border-t border-cyan-400/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingContent(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 text-sm font-medium rounded-lg hover:bg-cyan-400/30 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
                {item.status === "draft" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-400/20 border border-green-400/30 text-green-300 text-sm font-medium rounded-lg hover:bg-green-400/30 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRegenerate(item)}
                      disabled={regenerating === item.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-sm font-medium rounded-lg hover:bg-amber-400/30 transition-all disabled:opacity-50"
                      title="Regenerate"
                    >
                      <RotateCw className={`w-4 h-4 ${regenerating === item.id ? "animate-spin" : ""}`} />
                      {regenerating === item.id ? "Regenerating..." : "Regenerate"}
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-navy-800/50 rounded-lg transition-colors"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-coral-400 hover:bg-navy-800/50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {item.status === "approved" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateImage(item)}
                      disabled={generatingImage === item.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-400/20 border border-violet-400/30 text-violet-300 text-sm font-medium rounded-lg hover:bg-violet-400/30 transition-all disabled:opacity-50"
                    >
                      {generatingImage === item.id ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-violet-300/30 border-t-violet-300 rounded-full" />
                          {item.image_url ? "Regenerating..." : "Generating..."}
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4" />
                          {item.image_url ? "Regenerate" : "Generate"} Image
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSchedulingContent(item);
                        setScheduleDateTime("");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 text-sm font-medium rounded-lg hover:bg-cyan-400/30 transition-all"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </button>
                  </div>
                )}
              </div>
            </div>
                  ))}
                </div>
              );
            }

            return output;
          })()}
        </div>
      )}

      {viewingContent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewingContent(null)}
        >
          <div
            className="card-glass border border-cyan-400/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingContent(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{getPlatformIcon(viewingContent.platform)}</span>
              <div>
                <h2 className="text-2xl font-bold text-white capitalize">{viewingContent.platform}</h2>
                <p className="text-gray-400 text-sm">{viewingContent.content_type} • {new Date(viewingContent.created_at).toLocaleString()}</p>
              </div>
            </div>

            {viewingContent.image_url && (
              <div className="mb-6">
                <img
                  src={viewingContent.image_url}
                  alt="Generated"
                  className="w-full rounded-lg border border-cyan-400/20"
                />
              </div>
            )}

            <div className="bg-navy-800/50 border border-cyan-400/10 rounded-lg p-6 mb-8">
              <p className="text-white whitespace-pre-wrap break-words">{viewingContent.content_text}</p>
            </div>

            <div className="flex gap-3 pt-6 border-t border-cyan-400/10">
              <button
                onClick={() => setViewingContent(null)}
                className="flex-1 px-4 py-3 bg-navy-800/50 border border-cyan-400/20 text-white rounded-lg hover:border-cyan-400/50 transition-all font-medium"
              >
                Close
              </button>
              {viewingContent.status === "draft" && (
                <button
                  onClick={() => {
                    handleRegenerate(viewingContent);
                  }}
                  disabled={regenerating === viewingContent.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-400/20 border border-amber-400/30 text-amber-300 rounded-lg hover:bg-amber-400/30 transition-all font-medium disabled:opacity-50"
                >
                  <RotateCw className={`w-4 h-4 ${regenerating === viewingContent.id ? "animate-spin" : ""}`} />
                  {regenerating === viewingContent.id ? "Regenerating..." : "Regenerate"}
                </button>
              )}
              {viewingContent.status === "rejected" && (
                <button
                  onClick={async () => {
                    await supabase
                      .from("generated_content")
                      .update({ status: "draft" })
                      .eq("id", viewingContent.id);
                    setContent(content.map((c) => c.id === viewingContent.id ? { ...c, status: "draft" } : c));
                    setViewingContent(null);
                  }}
                  className="flex-1 px-4 py-3 bg-green-400/20 border border-green-400/30 text-green-300 rounded-lg hover:bg-green-400/30 transition-all font-medium"
                >
                  ↶ Restore & Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {schedulingContent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !isScheduling && setSchedulingContent(null)}
        >
          <div
            className="card-glass border border-cyan-400/20 max-w-md w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !isScheduling && setSchedulingContent(null)}
              disabled={isScheduling}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">Schedule Post</h2>

            <div className="mb-6 p-4 bg-navy-800/50 border border-cyan-400/10 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{getPlatformIcon(schedulingContent.platform)}</span>
                <span className="text-sm font-medium text-cyan-300 capitalize">{schedulingContent.platform}</span>
              </div>
              <p className="text-gray-300 text-sm line-clamp-3">
                {schedulingContent.content_text}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Schedule for</label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                disabled={isScheduling}
                min={new Date().toISOString().slice(0, 16)}
                className="input-modern w-full disabled:opacity-50"
              />
              <p className="text-gray-500 text-xs mt-2">Pick a date and time to publish this post</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSchedulingContent(null)}
                disabled={isScheduling}
                className="flex-1 px-4 py-3 bg-navy-800/50 border border-cyan-400/20 text-white rounded-lg hover:border-cyan-400/50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleContent}
                disabled={isScheduling || !scheduleDateTime}
                className="flex-1 px-4 py-3 bg-cyan-400 text-navy-900 rounded-lg hover:bg-cyan-300 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isScheduling ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Schedule
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
