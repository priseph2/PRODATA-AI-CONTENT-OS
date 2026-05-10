"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FolderKanban, FileText, CheckSquare, Calendar } from "lucide-react";

interface Stats {
  workspaces: number;
  contentInputs: number;
  pendingApproval: number;
  scheduledPosts: number;
}

export function DashboardStats() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    workspaces: 0,
    contentInputs: 0,
    pendingApproval: 0,
    scheduledPosts: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.id) {
        console.error("No authenticated user");
        setLoading(false);
        return;
      }

      // Get workspaces
      const { count: wsCount } = await supabase
        .from("workspaces")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((wsCount || 0) > 0) {
        // Get workspace IDs
        const { data: workspaces } = await supabase
          .from("workspaces")
          .select("id")
          .eq("user_id", user.id);

        const workspaceIds = workspaces?.map((w) => w.id) || [];

        if (workspaceIds.length > 0) {
          const [contentRes, approvalRes, scheduledRes] = await Promise.all([
            supabase
              .from("content_inputs")
              .select("id", { count: "exact", head: true })
              .in("workspace_id", workspaceIds),
            supabase
              .from("generated_content")
              .select("id", { count: "exact", head: true })
              .in("workspace_id", workspaceIds)
              .eq("status", "draft"),
            supabase
              .from("scheduled_posts")
              .select("id", { count: "exact", head: true })
              .in("workspace_id", workspaceIds),
          ]);

          setStats({
            workspaces: wsCount || 0,
            contentInputs: contentRes.count || 0,
            pendingApproval: approvalRes.count || 0,
            scheduledPosts: scheduledRes.count || 0,
          });
        } else {
          setStats(prev => ({
            ...prev,
            workspaces: wsCount || 0,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    { icon: FolderKanban, label: "Workspaces", value: stats.workspaces, color: "cyan" },
    { icon: FileText, label: "Content Inputs", value: stats.contentInputs, color: "amber" },
    { icon: CheckSquare, label: "Pending Approval", value: stats.pendingApproval, color: "green" },
    { icon: Calendar, label: "Scheduled Posts", value: stats.scheduledPosts, color: "coral" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-glass border border-cyan-400/20 bg-cyan-400/5 p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-navy-800/50 w-12 h-12" />
              <div className="flex-1">
                <div className="h-8 bg-navy-800/50 rounded w-12 mb-2" />
                <div className="h-4 bg-navy-800/50 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat, i) => {
        const colorMap = {
          cyan: "border-cyan-400/20 bg-cyan-400/5",
          amber: "border-amber-400/20 bg-amber-400/5",
          green: "border-green-400/20 bg-green-400/5",
          coral: "border-coral-400/20 bg-coral-400/5",
        };
        const iconColorMap = {
          cyan: "text-cyan-400",
          amber: "text-amber-400",
          green: "text-green-400",
          coral: "text-coral-400",
        };
        return (
          <div key={i} className={`card-glass border ${colorMap[stat.color as keyof typeof colorMap]} p-6 hover:border-opacity-50 transition-all`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-navy-800/50 ${iconColorMap[stat.color as keyof typeof iconColorMap]}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
