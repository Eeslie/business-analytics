import Link from "next/link";

export default function BiLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-slate-50 text-black">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BI</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-green-800">
                  Business Intelligence
                  <span className="mx-2 text-slate-400">/</span>
                  <span className="text-green-900">Reports</span>
                </h1>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-1">
              {[
                { href: "/bi", label: "Overview", icon: "📊" },
                { href: "/bi/standard-custom", label: "Standard & Custom", icon: "📋" },
                { href: "/bi/real-time", label: "Real‑Time", icon: "⚡" },
                { href: "/bi/compliance", label: "Compliance", icon: "🛡️" },
                { href: "/bi/access", label: "Access & Security", icon: "🔐" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-black hover:text-green-900 hover:bg-green-50 transition-all duration-200"
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}


