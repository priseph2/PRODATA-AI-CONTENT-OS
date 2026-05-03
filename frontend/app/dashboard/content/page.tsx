"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Workspace } from "@/types";
import { Zap, FileText, Link, Youtube, Upload, ArrowRight } from "lucide-react";

export default function ContentPage() {
  const supabase = createClient();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [inputText, setInputText] = useState("");
  const [inputType, setInputType] = useState<"text" | "url" | "youtube" | "pdf">("text");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    const { data } = await supabase
      .from("workspaces")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setWorkspaces(data);
      if (data.length > 0) setSelectedWorkspace(data[0].id);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!selectedWorkspace || !inputText.trim()) return;
    setGenerating(true);

    // Call n8n webhook or API to generate content
    try {
      const response = await fetch("/api/generate/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: selectedWorkspace,
          input_text: inputText,
          input_type: inputType,
          platforms: ["instagram", "facebook", "linkedin", "twitter"],
        }),
      });

      if (response.ok) {
        setInputText("");
        alert("Content generation started! Check the approval board for results.");
      }
    } catch (error) {
      console.error("Generation error:", error);
    }

    setGenerating(false);
  };

  const inputTypes = [
    { id: "text", label: "Text Idea", icon: FileText, desc: "Paste text directly" },
    { id: "url", label: "Blog URL", icon: Link, desc: "Scrape from URL" },
    { id: "youtube", label: "YouTube", icon: Youtube, desc: "Get transcript" },
    { id: "pdf", label: "PDF Upload", icon: Upload, desc: "Upload document" },
  ];

  if (loading) {
    return <div className="p-8 text-slate-400">Loading...</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Content Generation</h1>
        <p className="text-slate-400 mt-1">Turn your input into platform-ready social content</p>
      </div>

      {/* Workspace Selector */}
      <div className="mb-6">
        <label className="block text-sm text-slate-300 mb-2">Select Workspace</label>
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

      {/* Input Type Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {inputTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setInputType(type.id as typeof inputType)}
            className={`p-4 rounded-xl border transition-all ${
              inputType === type.id
                ? "bg-purple-600/20 border-purple-500 text-white"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <type.icon className="w-6 h-6 mb-2 mx-auto" />
            <span className="block font-medium">{type.label}</span>
            <span className="text-xs opacity-70">{type.desc}</span>
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <label className="block text-sm text-slate-300 mb-2">
          {inputType === "text" && "Paste your content idea"}
          {inputType === "url" && "Enter URL to scrape"}
          {inputType === "youtube" && "Enter YouTube URL"}
          {inputType === "pdf" && "Upload PDF file"}
        </label>

        {inputType === "text" ? (
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-48 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
            placeholder="Enter your content idea, topic, or raw material..."
          />
        ) : (
          <input
            type={inputType === "pdf" ? "file" : "url"}
            accept={inputType === "pdf" ? ".pdf" : undefined}
            onChange={(e) => {
              if (inputType === "pdf") {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) setInputText(file.name);
              } else {
                setInputText((e.target as HTMLInputElement).value);
              }
            }}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            placeholder={
              inputType === "url" ? "https://example.com/blog/post"
                : inputType === "youtube" ? "https://youtube.com/watch?v=..."
                  : undefined
            }
          />
        )}
      </div>

      {/* Platforms */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h3 className="text-sm text-slate-300 mb-4">Generate for Platforms</h3>
        <div className="flex flex-wrap gap-4">
          {["instagram", "facebook", "linkedin", "twitter"].map((platform) => (
            <label key={platform} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-purple-600" />
              <span className="text-white capitalize">{platform}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || !inputText.trim() || !selectedWorkspace}
        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Zap className="w-5 h-5" />
        {generating ? "Generating..." : "Generate Content"}
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-sm">
        <strong>How it works:</strong> Content is sent to n8n automation which calls AI (OpenAI or Claude) to generate platform-specific content. Results appear in the Approval board.
      </div>
    </div>
  );
}