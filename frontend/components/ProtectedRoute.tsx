"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setIsReady(true);
    };

    verifyAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => subscription?.unsubscribe();
  }, [router, supabase.auth]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-cyan-coral mb-4 animate-pulse">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}
