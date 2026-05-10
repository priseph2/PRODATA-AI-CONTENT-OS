"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPlatformIcon } from "@/lib/utils";
import type { ScheduledPost, Workspace, GeneratedContent } from "@/types";
import { Calendar, ChevronLeft, ChevronRight, Trash2, Send, Eye } from "lucide-react";

export default function SchedulePage() {
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<(ScheduledPost & { content_text?: string; platform?: string })[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPost, setViewingPost] = useState<(ScheduledPost & { content_text?: string; platform?: string }) | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "published" | "failed">("all");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchScheduledPosts();
    }
    generateCalendarDays();
  }, [selectedWorkspace, currentDate]);

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

  const fetchScheduledPosts = async () => {
    try {
      const { data } = await supabase
        .from("scheduled_posts")
        .select(`
          *,
          generated_content (content_text, platform)
        `)
        .eq("workspace_id", selectedWorkspace)
        .order("scheduled_at", { ascending: true });

      if (data) {
        setScheduledPosts(data.map((d: any) => ({
          ...d,
          content_text: d.generated_content?.content_text,
          platform: d.generated_content?.platform,
        })));
      }
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: Date[] = [];

    for (let i = 0; i < startPadding; i++) {
      days.push(new Date(year, month, -startPadding + i + 1));
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    setCalendarDays(days);
  };

  const getPostsForDay = (day: Date) => {
    return scheduledPosts.filter((post) => {
      const postDate = new Date(post.scheduled_at);
      return postDate.toDateString() === day.toDateString();
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from("scheduled_posts").delete().eq("id", id);
      setScheduledPosts(scheduledPosts.filter((p) => p.id !== id));
      setDeletingPostId(null);
      setViewingPost(null);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handlePublish = async (postId: string) => {
    setPublishing(postId);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_post_id: postId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to publish");
      }

      // Refresh posts list
      await fetchScheduledPosts();
      setViewingPost(null);
    } catch (error) {
      console.error("Publish error:", error);
      alert(`Failed to publish: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setPublishing(null);
    }
  };

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

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
          <p className="text-gray-500 text-sm">Create a workspace to start scheduling content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Schedule</h1>
        <p className="text-gray-400 mt-2">Manage your content calendar</p>
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

      {/* Calendar */}
      <div className="card-glass border-cyan-400/20 p-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={prevMonth}
            className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-navy-800/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-navy-800/50 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-gray-500 text-sm font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, i) => {
            const posts = getPostsForDay(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={i}
                className={`min-h-28 p-3 rounded-lg border transition-all ${
                  isCurrentMonth
                    ? "bg-navy-800/50 border-cyan-400/10 hover:border-cyan-400/30"
                    : "bg-navy-900/30 border-cyan-400/5"
                } ${isToday ? "border-cyan-400/50 bg-cyan-400/5" : ""}`}
              >
                <span
                  className={`text-sm font-medium ${
                    isCurrentMonth ? "text-gray-300" : "text-gray-600"
                  } ${isToday ? "text-cyan-400 font-bold" : ""}`}
                >
                  {day.getDate()}
                </span>
                <div className="mt-2 space-y-1">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="text-xs p-2 bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 rounded flex items-center justify-between gap-1 group cursor-pointer hover:bg-cyan-400/20 transition-colors"
                    >
                      <button
                        onClick={() => setViewingPost(post)}
                        className="truncate flex items-center gap-1 flex-1 text-left"
                      >
                        <span>{getPlatformIcon(post.platform || "")}</span>
                        <span className="truncate text-xs capitalize">{post.platform}</span>
                      </button>
                      <button
                        onClick={() => setDeletingPostId(post.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Posts */}
      <div className="card-glass border-cyan-400/20 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="text-2xl font-bold text-white">Posts</h3>
          </div>
          <div className="flex gap-2">
            {(["all", "scheduled", "published", "failed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs rounded-lg transition-all capitalize ${
                  statusFilter === status
                    ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30"
                    : "bg-navy-800/50 text-gray-400 border border-cyan-400/10 hover:text-cyan-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {scheduledPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No posts yet</p>
            <p className="text-gray-500 text-sm mt-1">Schedule approved content from the Approval Board</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledPosts.filter((post) => statusFilter === "all" || post.status === statusFilter).slice(0, 10).map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 bg-navy-800/30 border border-cyan-400/10 rounded-lg hover:border-cyan-400/30 transition-all group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="text-2xl flex-shrink-0">
                    {getPlatformIcon(post.platform || "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium capitalize">{post.platform}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          post.status === "published"
                            ? "bg-green-400/20 text-green-300"
                            : post.status === "failed"
                            ? "bg-red-400/20 text-red-300"
                            : "bg-amber-400/20 text-amber-300"
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">{post.content_text?.slice(0, 60)}...</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-gray-300 text-sm">{new Date(post.scheduled_at).toLocaleDateString()}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(post.scheduled_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {post.status === "scheduled" && (
                    <button
                      onClick={() => handlePublish(post.id)}
                      disabled={publishing === post.id}
                      className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-navy-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Publish Now"
                    >
                      {publishing === post.id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setViewingPost(post)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-cyan-400 rounded-lg transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingPostId(post.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Filter Note */}
        {scheduledPosts.length > 10 && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Showing {scheduledPosts.filter((p) => statusFilter === "all" || p.status === statusFilter).length} of {scheduledPosts.length} posts
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingPostId && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDeletingPostId(null)}
        >
          <div
            className="card-glass border border-red-400/20 max-w-sm w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">Delete Post?</h3>
            <p className="text-gray-400 mb-6">This will permanently remove this scheduled post. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingPostId(null)}
                className="flex-1 px-4 py-3 bg-navy-800/50 border border-cyan-400/20 text-white rounded-lg hover:border-cyan-400/50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingPostId)}
                className="flex-1 px-4 py-3 bg-red-400/20 border border-red-400/30 text-red-300 rounded-lg hover:bg-red-400/30 transition-all font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingPost && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewingPost(null)}
        >
          <div
            className="card-glass border border-cyan-400/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingPost(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{getPlatformIcon(viewingPost.platform || "")}</span>
              <div>
                <h2 className="text-2xl font-bold text-white capitalize">{viewingPost.platform}</h2>
                <p className="text-gray-400 text-sm">
                  Scheduled for {new Date(viewingPost.scheduled_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-navy-800/50 border border-cyan-400/10 rounded-lg p-6 mb-8">
              <p className="text-white whitespace-pre-wrap break-words">{viewingPost.content_text}</p>
            </div>

            <div className="flex gap-3 pt-6 border-t border-cyan-400/10">
              <button
                onClick={() => setViewingPost(null)}
                className="flex-1 px-4 py-3 bg-navy-800/50 border border-cyan-400/20 text-white rounded-lg hover:border-cyan-400/50 transition-all font-medium"
              >
                Close
              </button>
              <button
                onClick={() => setDeletingPostId(viewingPost.id)}
                className="flex-1 px-4 py-3 bg-red-400/20 border border-red-400/30 text-red-300 rounded-lg hover:bg-red-400/30 transition-all font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
