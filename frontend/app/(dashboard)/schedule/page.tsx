"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ScheduledPost, Workspace, GeneratedContent } from "@/types";
import { Calendar, Clock, Globe, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

export default function SchedulePage() {
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<(ScheduledPost & { content_text?: string; platform?: string })[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchScheduledPosts = async () => {
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
    if (!confirm("Remove this scheduled post?")) return;

    await supabase.from("scheduled_posts").delete().eq("id", id);
    setScheduledPosts(scheduledPosts.filter((p) => p.id !== id));
  };

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  if (loading) {
    return <div className="p-8 text-slate-400">Loading...</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Schedule</h1>
          <p className="text-slate-400 mt-1">Manage your content calendar</p>
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

      {/* Calendar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-white">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-slate-500 text-sm py-2">{day}</div>
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
                className={`min-h-24 p-2 rounded-lg border ${
                  isCurrentMonth ? "bg-slate-800 border-slate-700" : "bg-slate-900 border-slate-800/50"
                } ${isToday ? "border-purple-500" : ""}`}
              >
                <span className={`text-sm ${isCurrentMonth ? "text-slate-300" : "text-slate-600"} ${isToday ? "text-purple-400 font-bold" : ""}`}>
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="text-xs p-1 bg-purple-600/20 text-purple-300 rounded truncate flex items-center justify-between"
                    >
                      <span className="truncate">{post.platform}</span>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="opacity-0 hover:opacity-100 p-0.5 hover:bg-purple-600/40 rounded"
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
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming Posts</h3>
        {scheduledPosts.length === 0 ? (
          <p className="text-slate-500">No scheduled posts</p>
        ) : (
          <div className="space-y-3">
            {scheduledPosts.slice(0, 5).map((post) => (
              <div key={post.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-lg">
                    {post.platform === "instagram" ? "📷" : post.platform === "facebook" ? "📘" : post.platform === "linkedin" ? "💼" : "🐦"}
                  </div>
                  <div>
                    <p className="text-white font-medium">{post.platform}</p>
                    <p className="text-slate-400 text-sm">{post.content_text?.slice(0, 50)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-300 text-sm">{new Date(post.scheduled_at).toLocaleDateString()}</p>
                  <p className="text-slate-500 text-xs">{new Date(post.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}