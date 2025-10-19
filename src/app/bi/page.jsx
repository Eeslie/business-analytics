"use client";

import { useState } from "react";
import Link from "next/link";

const MODULES = [
  {
    id: "standard-custom",
    title: "Standard & Custom Reports",
    description: "Create and manage both standard and custom business reports",
    icon: "📋",
    href: "/bi/standard-custom",
    color: "from-blue-500 to-cyan-500",
    bgColor: "from-blue-50 to-cyan-50",
    borderColor: "border-blue-200"
  },
  {
    id: "real-time",
    title: "Real-Time Analytics",
    description: "Monitor live data and real-time business metrics",
    icon: "⚡",
    href: "/bi/real-time",
    color: "from-emerald-500 to-teal-500",
    bgColor: "from-emerald-50 to-teal-50",
    borderColor: "border-emerald-200"
  },
  {
    id: "compliance",
    title: "Compliance & Audit",
    description: "Generate compliance reports and audit trails",
    icon: "🛡️",
    href: "/bi/compliance",
    color: "from-purple-500 to-pink-500",
    bgColor: "from-purple-50 to-pink-50",
    borderColor: "border-purple-200"
  },
  {
    id: "access",
    title: "Access & Security",
    description: "Manage user permissions and security settings",
    icon: "🔐",
    href: "/bi/access",
    color: "from-orange-500 to-red-500",
    bgColor: "from-orange-50 to-red-50",
    borderColor: "border-orange-200"
  }
];

const STATS = [
  { label: "Total Reports", value: "24", change: "+12%", trend: "up" },
  { label: "Active Users", value: "156", change: "+8%", trend: "up" },
  { label: "Data Sources", value: "8", change: "+2", trend: "up" },
  { label: "Compliance Score", value: "98%", change: "+3%", trend: "up" }
];

export default function BiOverviewPage() {
  const [selectedModule, setSelectedModule] = useState(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-800">
          <span className="w-2 h-2 bg-green-800 rounded-full"></span>
          <span>Business Intelligence Dashboard</span>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-green-800">
          Welcome to BI & Reports
        </h1>
        
        <p className="text-xl text-black/80 max-w-3xl mx-auto">
          Access powerful business intelligence tools and generate comprehensive reports 
          to drive data-driven decisions across your organization.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-black">{stat.label}</h3>
              <div className={`flex items-center space-x-1 text-xs font-medium ${
                stat.trend === 'up' ? 'text-green-900' : 'text-red-900'
              }`}>
                <span>{stat.trend === 'up' ? '↗' : '↘'}</span>
                <span>{stat.change}</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-black">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {MODULES.map((module) => (
          <Link
            key={module.id}
            href={module.href}
            className={`group relative bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
            onMouseEnter={() => setSelectedModule(module.id)}
            onMouseLeave={() => setSelectedModule(null)}
          >
            <div className="flex items-start space-x-4">
              <div className={`w-16 h-16 bg-green-800 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {module.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-green-800 mb-2 group-hover:text-green-900 transition-colors">
                  {module.title}
                </h3>
                <p className="text-black text-sm leading-relaxed mb-4">
                  {module.description}
                </p>
                
                <div className="flex items-center text-sm font-medium text-green-900 group-hover:text-green-800 transition-colors">
                  <span>Explore Module</span>
                  <svg 
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Hover Effect Overlay */}
            {selectedModule === module.id && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none"></div>
            )}
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">⚡</span>
          </div>
          <h2 className="text-2xl font-bold text-green-800">Quick Actions</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-200">
            <span className="text-lg">📊</span>
            <span className="font-medium text-green-900">Create Report</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-200">
            <span className="text-lg">📈</span>
            <span className="font-medium text-green-900">View Analytics</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-200">
            <span className="text-lg">⚙️</span>
            <span className="font-medium text-green-900">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

