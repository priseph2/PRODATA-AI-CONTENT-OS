import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">⚡</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            PRO DATA AI<span className="text-purple-400">OS</span>
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
          Turn one content input into many approved, branded, scheduled social media assets in minutes
        </p>

        {/* Flow */}
        <div className="flex items-center justify-center gap-4 md:gap-8 text-lg text-slate-400">
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
            Input
          </span>
          <span className="text-purple-500">→</span>
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
            Generate
          </span>
          <span className="text-purple-500">→</span>
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</span>
            Approve
          </span>
          <span className="text-purple-500">→</span>
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</span>
            Publish
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 pt-8">
          <Link
            href="/signup"
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors border border-slate-700"
          >
            Sign In
          </Link>
        </div>

        {/* Stack */}
        <div className="pt-16 text-slate-500 text-sm">
          <p className="mb-4">Built with:</p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <span className="px-3 py-1 bg-slate-800 rounded-full">Next.js</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full">Supabase</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full">n8n</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full">OpenAI</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full">Claude</span>
          </div>
        </div>
      </div>
    </main>
  );
}