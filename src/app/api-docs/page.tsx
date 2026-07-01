import { Terminal, Code, Database, Key, Server, Webhook } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 lg:w-72 border-r border-slate-200 bg-slate-50 md:min-h-screen pt-24 pb-10 px-6 shrink-0 md:sticky md:top-0 h-auto md:h-screen overflow-y-auto hidden md:block">
        <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4">Documentation</h2>
        <nav className="space-y-1 mb-8">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">
            <Terminal className="w-4 h-4" /> Introduction
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors">
            <Key className="w-4 h-4" /> Authentication
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors">
            <Server className="w-4 h-4" /> Base URL
          </a>
        </nav>

        <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4">Endpoints</h2>
        <nav className="space-y-1 mb-8">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors">
            <Database className="w-4 h-4" /> List Items
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors">
            <Code className="w-4 h-4" /> Create Item
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors">
            <Webhook className="w-4 h-4" /> Webhooks
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pt-24 pb-20 px-4 sm:px-8 lg:px-16 max-w-4xl">
        <div className="mb-4 text-emerald-600 font-semibold tracking-wide uppercase text-sm">v1.0.0</div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">API Reference</h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-10">
          The platform API is organized around REST. Our API has predictable resource-oriented URLs, accepts form-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.
        </p>

        <hr className="border-slate-200 mb-10" />

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            The platform API uses API keys to authenticate requests. You can view and manage your API keys in the platform Dashboard.
          </p>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mb-6">
            <p className="text-amber-800 text-sm font-medium">Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.</p>
          </div>
          
          <div className="bg-[#0b1120] rounded-xl overflow-hidden shadow-xl mb-6 border border-slate-800">
            <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-400 font-mono ml-2">cURL</span>
            </div>
            <pre className="p-4 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <code>
<span className="text-emerald-400">curl</span> https://api.lostfound.in/v1/items \<br/>
  -H <span className="text-amber-300">"Authorization: Bearer sk_test_YOUR_STRIPE_SECRET_KEY"</span>
              </code>
            </pre>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="bg-emerald-100 text-emerald-800 text-sm px-2 py-1 rounded font-mono font-bold uppercase tracking-wider">GET</span>
            /v1/items
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Returns a list of your lost or found items. The items are returned sorted by creation date, with the most recent items appearing first.
          </p>
          
          <h3 className="font-bold text-slate-900 mb-3">Parameters</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Query</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="px-4 py-3 font-mono text-emerald-600 font-medium">limit</td>
                  <td className="px-4 py-3 text-slate-600">A limit on the number of objects to be returned. Limit can range between 1 and 100. Default is 10.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-emerald-600 font-medium">status</td>
                  <td className="px-4 py-3 text-slate-600">Filter items by status: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">active</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">found</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">returned</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-bold text-slate-900 mb-3">Response</h3>
          <div className="bg-[#0b1120] rounded-xl overflow-hidden shadow-xl border border-slate-800">
            <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50">
              <span className="text-xs text-slate-400 font-mono">JSON</span>
            </div>
            <pre className="p-4 text-sm font-mono text-emerald-400 overflow-x-auto leading-relaxed">
              <code>
&#123;<br/>
  <span className="text-sky-300">"object"</span>: <span className="text-amber-300">"list"</span>,<br/>
  <span className="text-sky-300">"data"</span>: [<br/>
    &#123;<br/>
      <span className="text-sky-300">"id"</span>: <span className="text-amber-300">"item_1J2b3C..."</span>,<br/>
      <span className="text-sky-300">"type"</span>: <span className="text-amber-300">"lost"</span>,<br/>
      <span className="text-sky-300">"title"</span>: <span className="text-amber-300">"Blue iPhone 13"</span>,<br/>
      <span className="text-sky-300">"status"</span>: <span className="text-amber-300">"active"</span>,<br/>
      <span className="text-sky-300">"created_at"</span>: <span className="text-orange-300">1631234567</span><br/>
    &#125;<br/>
  ],<br/>
  <span className="text-sky-300">"has_more"</span>: <span className="text-rose-400">false</span><br/>
&#125;
              </code>
            </pre>
          </div>
        </section>

      </main>
    </div>
  );
}
