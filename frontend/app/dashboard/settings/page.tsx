export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        <div className="space-y-6">
          {/* AI Provider */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">AI Provider</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="ai_provider"
                  value="claude"
                  defaultChecked
                  className="w-4 h-4"
                />
                <span className="text-slate-300">Claude (Default)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="ai_provider"
                  value="openai"
                  className="w-4 h-4"
                />
                <span className="text-slate-300">OpenAI</span>
              </label>
            </div>
          </div>

          {/* API Keys */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">API Keys</h2>
            <p className="text-slate-400 mb-4">Manage your API keys for content generation</p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500">
              Configure API Keys
            </button>
          </div>

          {/* Account */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account</h2>
            <p className="text-slate-400 mb-4">Manage your account settings</p>
            <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
