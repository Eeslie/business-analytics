"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

export default function RealTimeReportsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalMs, setIntervalMs] = useState(3000);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [kpis, setKpis] = useState({ revenue: 125000, orders: 342, stockAlerts: 7 });
  const [events, setEvents] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const timerRef = useRef(null);

  const ageSec = Math.floor((Date.now() - lastUpdated) / 1000);
  const freshnessColor = ageSec < 5 ? "text-green-900" : ageSec < 15 ? "text-orange-900" : "text-red-600";

  function pushEvent(message) {
    setEvents((prev) => [{ id: Math.random().toString(36).slice(2), message, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
  }

  function fetchLiveData() {
    // Simulate pulling live data from transactions/logs
    setKpis((prev) => ({
      revenue: Math.max(0, prev.revenue + Math.round((Math.random() - 0.4) * 2000)),
      orders: Math.max(0, prev.orders + Math.round((Math.random() - 0.4) * 20)),
      stockAlerts: Math.max(0, prev.stockAlerts + (Math.random() > 0.85 ? 1 : 0) - (Math.random() > 0.9 ? 1 : 0)),
    }));
    setLastUpdated(Date.now());
    pushEvent("Pulled new transactions & logs");
  }

  function startPolling() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchLiveData, intervalMs);
  }

  useEffect(() => {
    if (autoRefresh) {
      startPolling();
      return () => timerRef.current && clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [autoRefresh, intervalMs]);

  async function generateOnTheFly() {
    // Generate a report immediately using the freshest in-memory data
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsGenerating(false);
    pushEvent("Generated on-the-fly report (no batch queue)");
    alert("On-the-fly report generated using the latest live data.");
  }

  const staleWarning = useMemo(() => ageSec >= 15, [ageSec]);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-green-900">Real-Time Data Retrieval</h2>
        <p className="text-black/80 mt-1 max-w-3xl">
          Pull live data from transactions and logs to generate on-the-fly reports without waiting for batch processing.
        </p>
      </header>

      {staleWarning && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Data appears stale. Last update was {ageSec}s ago. Consider enabling auto-refresh or refreshing now.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-black/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-orange-900">Live KPIs</h3>
              <div className={`text-sm ${freshnessColor}`}>Updated {ageSec}s ago</div>
            </div>
            <div className="mt-4 grid sm:grid-cols-3 gap-4">
              <div className="rounded-md border border-black/10 bg-white p-4">
                <div className="text-black/60 text-sm">Revenue (today)</div>
                <div className="text-2xl font-semibold text-green-900">${formatNumber(kpis.revenue)}</div>
              </div>
              <div className="rounded-md border border-black/10 bg-white p-4">
                <div className="text-black/60 text-sm">Orders</div>
                <div className="text-2xl font-semibold text-green-900">{formatNumber(kpis.orders)}</div>
              </div>
              <div className="rounded-md border border-black/10 bg-white p-4">
                <div className="text-black/60 text-sm">Stock alerts</div>
                <div className="text-2xl font-semibold text-orange-900">{formatNumber(kpis.stockAlerts)}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button onClick={fetchLiveData} className="rounded-md border border-black/10 bg-white px-4 py-2 text-green-900 hover:bg-black/[.03]">Refresh now</button>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> Auto-refresh
              </label>
              <select value={intervalMs} onChange={(e) => setIntervalMs(Number(e.target.value))} className="rounded-md border border-black/15 px-3 py-2 text-sm">
                <option value={2000}>2s</option>
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
              </select>
              <button disabled={isGenerating} onClick={generateOnTheFly} className="rounded-md border border-black/10 bg-white px-4 py-2 text-orange-900 hover:bg-black/[.03] disabled:opacity-60">
                {isGenerating ? "Generating…" : "Generate on-the-fly report"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-orange-900">Decision Support</h3>
            <ul className="list-disc ml-5 mt-2 text-black/90 space-y-1">
              <li>Dashboards auto-refresh</li>
              <li>Prevent data silos & outdated views</li>
              <li>API-ready data access</li>
            </ul>
            <p className="mt-3 text-sm text-black/70">Use the latest values to take immediate action. All panels reflect the most recent pull.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Recent Transactions & Logs</h3>
            <ul className="mt-3 space-y-2">
              {events.length === 0 && (
                <li className="text-sm text-black/60">No events yet. Enable auto-refresh or refresh now to start pulling live data.</li>
              )}
              {events.map((ev) => (
                <li key={ev.id} className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm flex items-center justify-between">
                  <span className="text-black/80">{ev.message}</span>
                  <span className="text-black/40">{ev.at}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Anti‑stale Safeguards</h3>
            <ul className="list-disc ml-5 mt-2 text-black/90 space-y-1">
              <li>Freshness indicator with color states</li>
              <li>Auto-refresh polling with adjustable interval</li>
              <li>Stale warning banner on inactivity</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}


