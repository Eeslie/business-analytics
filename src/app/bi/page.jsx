"use client";

import { useMemo, useState } from "react";

const tiles = [
  {
    href: "/bi/standard-custom",
    title: "Standard & Custom Report Generation",
    desc: "Built-in reports with customization for layout, filters, and scheduling.",
    accent: "from-orange-200/70 to-orange-100/40",
    icon: "📊",
  },
  {
    href: "/bi/real-time",
    title: "Real-Time Data Retrieval",
    desc: "Live reports powered by up-to-date operational data from the ERP.",
    accent: "from-green-200/70 to-green-100/40",
    icon: "⚡",
  },
  {
    href: "/bi/compliance",
    title: "Compliance & Regulatory Reporting",
    desc: "Generate compliant statements with audit trails and historical retention.",
    accent: "from-orange-200/70 to-orange-100/40",
    icon: "🛡️",
  },
  {
    href: "/bi/access",
    title: "Role-Based Access & Security",
    desc: "Control access, define permissions and track report access logs.",
    accent: "from-green-200/70 to-green-100/40",
    icon: "🔐",
  },
  {
    href: "/bi/tal",
    title: "Time, Attendance & Leave",
    desc: "Clock in/out, manage leave, approvals, accruals, and payroll-ready reports.",
    accent: "from-green-200/70 to-green-100/40",
    icon: "🕒",
  },
];

export default function BiHomePage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tiles;
    return tiles.filter((t) =>
      [t.title, t.desc].some((s) => s.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-green-900 to-orange-900 bg-clip-text text-transparent">
          ERP Module: Business Intelligence / Report
        </h2>
        <p className="text-black/80 max-w-3xl">
          Central hub for analytics and reporting across your ERP. Explore the capabilities below, search, or use the top navigation.
        </p>
        <div className="pt-1">
          <div className="relative max-w-md">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports and features..."
              className="w-full rounded-lg border border-black/10 bg-white px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-900/30"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/40">⌕</span>
          </div>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 gap-6">
        {filtered.map((t) => (
          <a
            key={t.href}
            href={t.href}
            className={`group relative block rounded-xl border border-black/10 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]`}
          >
            <div className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br ${t.accent} opacity-0 transition-opacity group-hover:opacity-100`}></div>
            <div className="relative z-[1] flex items-start gap-3">
              <div className="text-2xl leading-none">{t.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">{t.title}</h3>
                <p className="text-black/80 mt-1">{t.desc}</p>
              </div>
            </div>
            <div className="relative z-[1] mt-4 inline-flex items-center gap-2 text-sm font-medium text-orange-900">
              Explore
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}


