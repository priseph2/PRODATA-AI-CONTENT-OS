"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  CheckSquare,
  Calendar,
  Settings,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/workspaces", icon: FolderKanban, label: "Workspaces" },
    { href: "/dashboard/content", icon: FileText, label: "Content" },
    { href: "/dashboard/approval", icon: CheckSquare, label: "Approval" },
    { href: "/dashboard/schedule", icon: Calendar, label: "Schedule" },
  ];

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950">
        {/* Sidebar */}
        <aside className="w-64 bg-navy-900/50 backdrop-blur border-r border-cyan-400/10 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-cyan-400/10">
            <Link href="/dashboard" className="inline-flex items-center gap-2 group">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-lg gradient-cyan-coral opacity-20 blur-lg" />
                <div className="relative w-8 h-8 rounded-lg gradient-cyan-coral flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                  ✨
                </div>
              </div>
              <span className="text-base font-bold text-white hidden sm:block">PRO DATA AI<span className="gradient-text">OS</span></span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30"
                      : "text-gray-400 hover:text-white hover:bg-navy-800/50"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm hidden sm:block">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-4 border-t border-cyan-400/10 space-y-2">
            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive("/dashboard/settings")
                  ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30"
                  : "text-gray-400 hover:text-white hover:bg-navy-800/50"
              }`}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm hidden sm:block">Settings</span>
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-navy-800/50 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm hidden sm:block">Sign Out</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}