import Link from "next/link";
import { FolderKanban, Zap, CheckSquare, Plus } from "lucide-react";
import { DashboardStats } from "@/components/DashboardStats";

export default function DashboardPage() {
  const actions = [
    {
      href: "/dashboard/workspaces",
      icon: FolderKanban,
      title: "Manage Workspaces",
      desc: "Create and edit client workspaces",
      color: "cyan",
    },
    {
      href: "/dashboard/content",
      icon: Zap,
      title: "Generate Content",
      desc: "Turn input into social media assets",
      color: "amber",
    },
    {
      href: "/dashboard/approval",
      icon: CheckSquare,
      title: "Review & Approve",
      desc: "Approve generated content",
      color: "green",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 mt-2">Here's what's happening with your content</p>
        </div>
        <Link href="/dashboard/workspaces/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Workspace
        </Link>
      </div>

      {/* Stats Grid */}
      <DashboardStats />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actions.map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="card-glass border-cyan-400/20 p-8 hover:border-cyan-400/50 transition-all duration-300 group"
          >
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-xl bg-navy-800/50 group-hover:scale-110 transition-transform">
                <action.icon className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white group-hover:gradient-text transition-all">{action.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{action.desc}</p>
              </div>
              <div className="text-cyan-400/0 group-hover:text-cyan-400/100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card-glass border-cyan-400/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
        <div className="text-center py-16">
          <div className="text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m0 0h6m0-6h-6m0 0H6" />
            </svg>
          </div>
          <p className="text-gray-400">No recent activity yet. Create a workspace to get started!</p>
        </div>
      </div>
    </div>
  );
}