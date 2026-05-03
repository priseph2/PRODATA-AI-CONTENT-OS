"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950" />
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-10 transition-transform duration-700"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        >
          <div className="w-full h-full bg-cyan-500 rounded-full" />
        </div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-10 transition-transform duration-700"
          style={{ transform: `translateY(${-scrollY * 0.5}px)` }}
        >
          <div className="w-full h-full bg-coral-500 rounded-full" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        {/* Animated logo */}
        <div className="animate-fadeInUp mb-8">
          <div className="inline-flex items-center gap-4 mb-12">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-2xl gradient-cyan-coral opacity-20 blur-lg" />
              <div className="relative w-16 h-16 rounded-2xl gradient-cyan-coral flex items-center justify-center">
                <span className="text-3xl">✨</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main heading */}
        <div className="text-center max-w-5xl animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            Content That
            <br />
            <span className="gradient-text">Converts</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform one piece of content into perfectly optimized social media assets. Powered by AI, guided by your brand.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="animate-fadeInUp flex flex-col sm:flex-row gap-4 mb-24" style={{ animationDelay: "0.2s" }}>
          <Link href="/signup" className="btn-primary">
            Start Creating Free
            <span className="ml-2">→</span>
          </Link>
          <Link href="/login" className="btn-secondary">
            Sign In
          </Link>
        </div>

        {/* Process Flow */}
        <div className="animate-fadeInUp w-full max-w-4xl" style={{ animationDelay: "0.3s" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "1", label: "Input", desc: "Paste content" },
              { step: "2", label: "Generate", desc: "AI creates assets" },
              { step: "3", label: "Approve", desc: "Review & brand" },
              { step: "4", label: "Publish", desc: "Schedule posts" },
            ].map((item, i) => (
              <div
                key={i}
                className="card-glass p-6 text-center hover:border-cyan-400/30 transition-all duration-300"
              >
                <div className="text-3xl font-bold gradient-text mb-2">{item.step}</div>
                <div className="font-semibold text-white mb-1">{item.label}</div>
                <div className="text-sm text-gray-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 animate-bounce">
          <div className="flex flex-col items-center gap-2 text-cyan-400/50">
            <span className="text-sm font-medium">Explore</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-center mb-20">
            Why creators love us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Multi-Platform",
                desc: "Auto-format content for Instagram, TikTok, Twitter, LinkedIn and more.",
                icon: "🎯",
              },
              {
                title: "Brand Control",
                desc: "Maintain your unique voice with custom tone, colors, and style guidelines.",
                icon: "🎨",
              },
              {
                title: "AI Powered",
                desc: "Powered by Claude and OpenAI for human-quality creative content.",
                icon: "🤖",
              },
              {
                title: "Approval Workflow",
                desc: "Built-in review process to catch edits before publishing.",
                icon: "✅",
              },
              {
                title: "Smart Scheduling",
                desc: "Post at optimal times across all platforms from one dashboard.",
                icon: "⏰",
              },
              {
                title: "Performance Insights",
                desc: "Track what resonates and optimize your content strategy.",
                icon: "📊",
              },
            ].map((feature, i) => (
              <div key={i} className="card-glass p-8 group hover:border-coral-400/30 transition-all duration-300">
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="relative py-24 px-6 border-t border-cyan-400/10">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Built on Modern Tech</h2>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {["Next.js", "Supabase", "n8n", "OpenAI", "Claude", "Tailwind"].map((tech) => (
              <div key={tech} className="card-glass px-6 py-3 text-sm font-medium hover:border-cyan-400/50 transition-colors">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto text-center card-glass p-12 border-cyan-400/20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to transform your content?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join creators who are saving hours every week with AI-powered content.
          </p>
          <Link href="/signup" className="inline-block btn-primary">
            Get Started Free Today
          </Link>
        </div>
      </section>
    </main>
  );
}