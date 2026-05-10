"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Workspace, SocialAccount } from "@/types";
import { Trash2, LogOut, Zap } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchSocialAccounts();
    }
  }, [selectedWorkspace]);

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

  const fetchSocialAccounts = async () => {
    try {
      const { data } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("workspace_id", selectedWorkspace)
        .order("created_at", { ascending: false });

      if (data) {
        setSocialAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching social accounts:", error);
    }
  };

  const handleConnect = (platform: string) => {
    const redirect = `/api/social/meta/connect?workspace_id=${selectedWorkspace}&platform=${platform}`;
    window.location.href = redirect;
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return;

    setDisconnecting(accountId);
    try {
      const { error } = await supabase
        .from("social_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      setSocialAccounts(socialAccounts.filter((a) => a.id !== accountId));
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("Failed to disconnect account");
    } finally {
      setDisconnecting(null);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Sign out of your account?")) return;

    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
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

  const connectedPlatforms = socialAccounts.map((a) => a.platform);
  const availablePlatforms = [
    { id: "instagram", name: "Instagram", icon: "📷" },
    { id: "facebook", name: "Facebook", icon: "📘" },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your workspace and connected accounts</p>
      </div>

      {/* Workspace Selector */}
      {workspaces.length > 0 && (
        <div className="card-glass border-cyan-400/20 p-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Active Workspace</label>
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
      )}

      {/* Connected Accounts */}
      <div className="card-glass border-cyan-400/20 p-8">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Connected Accounts</h2>
        </div>

        <div className="space-y-4">
          {availablePlatforms.map((platform) => {
            const isConnected = connectedPlatforms.includes(platform.id as any);
            const account = socialAccounts.find((a) => a.platform === (platform.id as any));

            return (
              <div
                key={platform.id}
                className="flex items-center justify-between p-4 bg-navy-800/30 border border-cyan-400/10 rounded-lg hover:border-cyan-400/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <p className="text-white font-medium">{platform.name}</p>
                    {isConnected && account?.account_name && (
                      <p className="text-gray-400 text-sm">@{account.account_name}</p>
                    )}
                    {!isConnected && (
                      <p className="text-gray-500 text-sm">Not connected</p>
                    )}
                  </div>
                </div>

                {isConnected ? (
                  <button
                    onClick={() => account && handleDisconnect(account.id, platform.name)}
                    disabled={disconnecting === account?.id}
                    className="px-4 py-2 bg-red-400/20 border border-red-400/30 text-red-300 rounded-lg hover:bg-red-400/30 transition-all font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    className="px-4 py-2 bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 rounded-lg hover:bg-cyan-400/30 transition-all font-medium"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}

          {/* Coming Soon Platforms */}
          <div className="pt-4 border-t border-cyan-400/10 space-y-4">
            {[
              { name: "LinkedIn", icon: "💼" },
              { name: "Twitter / X", icon: "🐦" },
              { name: "TikTok", icon: "🎵" },
            ].map((platform) => (
              <div
                key={platform.name}
                className="flex items-center justify-between p-4 bg-navy-800/20 border border-cyan-400/5 rounded-lg opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <p className="text-white font-medium">{platform.name}</p>
                    <p className="text-gray-600 text-sm">Coming soon</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-gray-600/20 text-gray-500 rounded-full text-xs font-medium">
                  Soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="card-glass border-cyan-400/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Account</h2>
        <button
          onClick={handleLogout}
          className="px-4 py-3 bg-red-400/20 border border-red-400/30 text-red-300 rounded-lg hover:bg-red-400/30 transition-all font-medium flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
