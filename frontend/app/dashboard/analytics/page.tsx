"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Workspace, PostAnalytics } from "@/types";
import { BarChart2, TrendingUp, Heart, MessageCircle, Share2 } from "lucide-react";

interface AnalyticsData {
  analytics: (PostAnalytics & {
    published_at?: string;
    content_text?: string;
    image_url?: string;
  })[];
  summary: {
    total_posts: number;
    total_reach: number;
    total_likes: number;
    total_comments: number;
    total_interactions: number;
    avg_engagement_rate: number;
    last_synced?: string;
  };
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<"all" | "instagram" | "facebook">("all");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    analytics: [],
    summary: {
      total_posts: 0,
      total_reach: 0,
      total_likes: 0,
      total_comments: 0,
      total_interactions: 0,
      avg_engagement_rate: 0,
    },
  });

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchAnalytics();
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

  const fetchAnalytics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `/api/analytics?workspace_id=${selectedWorkspace}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      alert(`Failed to fetch analytics: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleSyncAnalytics = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/analytics/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ workspace_id: selectedWorkspace }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync analytics");
      }

      const data = await response.json();
      alert(`Success! Synced analytics for ${data.synced_count} posts.`);

      // Refresh analytics after sync
      await fetchAnalytics();
    } catch (error) {
      console.error("Sync error:", error);
      alert(`Failed to sync: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSyncing(false);
    }
  };

  const filteredAnalytics = analyticsData.analytics.filter((post) => {
    if (filter === "all") return true;
    return post.platform === filter;
  });

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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <BarChart2 className="w-10 h-10 text-cyan-400" />
          Analytics
        </h1>
        <p className="text-gray-400 mt-2">Track your post performance across social platforms</p>
      </div>

      {/* Workspace Selector */}
      <div className="card-glass border-cyan-400/20 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Select Workspace</label>
        <div className="flex gap-4 items-end">
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
          <button
            onClick={handleSyncAnalytics}
            disabled={syncing}
            className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 rounded-lg transition-all disabled:opacity-50"
          >
            {syncing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-cyan-300/20 border-t-cyan-300 rounded-full animate-spin" />
                Syncing...
              </span>
            ) : (
              "Sync Now"
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-glass border-cyan-400/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Published Posts</p>
              <p className="text-3xl font-bold text-white mt-2">
                {analyticsData.summary.total_posts}
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        <div className="card-glass border-cyan-400/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Reach</p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatNumber(analyticsData.summary.total_reach)}
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="card-glass border-cyan-400/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Engagement</p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatNumber(analyticsData.summary.total_interactions)}
              </p>
            </div>
            <div className="text-4xl">💬</div>
          </div>
        </div>

        <div className="card-glass border-cyan-400/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Engagement Rate</p>
              <p className="text-3xl font-bold text-white mt-2">
                {analyticsData.summary.avg_engagement_rate.toFixed(2)}%
              </p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </div>
      </div>

      {/* Platform Filters */}
      <div className="flex gap-3">
        {(["all", "instagram", "facebook"] as const).map((platform) => (
          <button
            key={platform}
            onClick={() => setFilter(platform)}
            className={`px-4 py-2 rounded-lg transition-all capitalize ${
              filter === platform
                ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/50"
                : "bg-navy-800/50 text-gray-400 hover:text-white border border-cyan-400/10"
            }`}
          >
            {platform === "all" ? "All Platforms" : platform}
          </button>
        ))}
      </div>

      {/* Posts Table */}
      <div className="card-glass border-cyan-400/20 overflow-hidden">
        {filteredAnalytics.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">
              {analyticsData.analytics.length === 0
                ? "No analytics yet. Click Sync Now to load your post performance."
                : "No posts for this platform."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-cyan-400/10 bg-navy-800/30">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Post</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Platform</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-medium">Reach</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-medium">Likes</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-medium">Comments</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-medium">Engagement</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-medium">Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-400/10">
                {filteredAnalytics.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-navy-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt="Post"
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="text-white line-clamp-1">
                            {post.content_text?.substring(0, 40)}...
                          </p>
                          <p className="text-gray-500 text-xs">
                            {formatDate(post.created_at)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-medium">
                      {formatNumber(
                        post.reach || post.post_impressions_unique || 0
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-white font-medium">
                      {formatNumber(post.likes || 0)}
                    </td>
                    <td className="px-6 py-4 text-right text-white font-medium">
                      {formatNumber(post.comments || 0)}
                    </td>
                    <td className="px-6 py-4 text-right text-white font-medium">
                      {formatNumber((post.shares || 0) + (post.saved || 0))}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400">
                      {post.published_at
                        ? formatDate(post.published_at)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Last Synced */}
      {analyticsData.summary.last_synced && (
        <p className="text-xs text-gray-500 text-center">
          Last synced: {formatDate(analyticsData.summary.last_synced)}
        </p>
      )}
    </div>
  );
}
