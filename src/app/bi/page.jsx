"use client";

import { useMemo, useState } from "react";

const tiles = [
  {
    href: "/bi/standard-custom",
    title: "Standard & Custom Report Generation",
    desc: "Built-in reports with customization for layout, filters, and scheduling.",
    gradient: "from-blue-500 to-cyan-500",
    icon: "📊",
    features: ["Predefined Templates", "Custom Filters", "Export Options", "Scheduling"],
  },
  {
    href: "/bi/real-time",
    title: "Real-Time Data Retrieval",
    desc: "Live reports powered by up-to-date operational data from the ERP.",
    gradient: "from-emerald-500 to-teal-500",
    icon: "⚡",
    features: ["Live KPIs", "Auto-refresh", "Real-time Updates", "Instant Reports"],
  },
  {
    href: "/bi/compliance",
    title: "Compliance & Regulatory Reporting",
    desc: "Generate compliant statements with audit trails and historical retention.",
    gradient: "from-amber-500 to-orange-500",
    icon: "🛡️",
    features: ["Audit Trails", "Regulatory Templates", "Historical Archive", "Validation"],
  },
  {
    href: "/bi/access",
    title: "Role-Based Access & Security",
    desc: "Control access, define permissions and track report access logs.",
    gradient: "from-purple-500 to-pink-500",
    icon: "🔐",
    features: ["Role Management", "Access Logs", "Security Controls", "Permissions"],
  },
];

export default function BiHomePage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tiles;
    return tiles.filter((t) =>
      [t.title, t.desc, ...t.features].some((s) => s.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-sm font-medium text-emerald-700">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>Business Intelligence Platform</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            ERP Module:
          </span>
          <br />
          <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
            Business Intelligence
          </span>
          <span className="mx-4 text-slate-400">/</span>
          <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
            Reports
          </span>
        </h1>
        
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Central hub for analytics and reporting across your ERP. Explore powerful capabilities, 
          generate insights, and make data-driven decisions with confidence.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports, features, and capabilities..."
              className="w-full pl-12 pr-4 py-4 text-lg border border-slate-200 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
        {filtered.map((tile, index) => (
          <a
            key={tile.href}
            href={tile.href}
            className="group relative block"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tile.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative p-8">
                <div className="flex items-start space-x-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tile.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                    {tile.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                      {tile.title}
                    </h3>
                    <p className="text-slate-600 mt-2 leading-relaxed">
                      {tile.desc}
                    </p>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2">
                    {tile.features.map((feature, featureIndex) => (
                      <span
                        key={featureIndex}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 group-hover:bg-slate-200 transition-colors"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
                    Explore capabilities
                  </span>
                  <div className="flex items-center space-x-2 text-emerald-600 group-hover:text-emerald-700 transition-colors">
                    <span className="text-sm font-medium">Get started</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Hover Effect Border */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${tile.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}></div>
            </div>
          </a>
        ))}
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">4</div>
            <div className="text-sm text-slate-600 mt-1">Core Modules</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">50+</div>
            <div className="text-sm text-slate-600 mt-1">Report Templates</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">Real-time</div>
            <div className="text-sm text-slate-600 mt-1">Data Updates</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">100%</div>
            <div className="text-sm text-slate-600 mt-1">Compliance Ready</div>
          </div>
        </div>
      </div>
    </div>
  );
}


