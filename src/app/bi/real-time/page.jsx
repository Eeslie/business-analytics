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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-sm font-medium text-emerald-700">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>Live Data</span>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Real-Time Data Retrieval
          </span>
        </h1>
        
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Pull live data from transactions and logs to generate on-the-fly reports without waiting for batch processing.
        </p>
      </div>

      {/* Stale Warning */}
      {staleWarning && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 text-sm">⚠️</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-800">Data Stale Warning</h3>
            <p className="text-sm text-red-700">Last update was {ageSec}s ago. Consider enabling auto-refresh or refreshing now.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Live KPIs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Live KPIs</h2>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                ageSec < 5 ? 'bg-green-100 text-green-800' : 
                ageSec < 15 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  ageSec < 5 ? 'bg-green-500' : 
                  ageSec < 15 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}></div>
                <span>Updated {ageSec}s ago</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-emerald-600 text-sm font-medium">Revenue (today)</div>
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-900">${formatNumber(kpis.revenue)}</div>
                <div className="text-xs text-emerald-600 mt-1">+12% from yesterday</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-blue-600 text-sm font-medium">Orders</div>
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📦</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900">{formatNumber(kpis.orders)}</div>
                <div className="text-xs text-blue-600 mt-1">+8% from yesterday</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-orange-600 text-sm font-medium">Stock Alerts</div>
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">⚠️</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900">{formatNumber(kpis.stockAlerts)}</div>
                <div className="text-xs text-orange-600 mt-1">Requires attention</div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-8 p-4 bg-slate-50 rounded-xl">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={fetchLiveData}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <span>🔄</span>
                  <span>Refresh Now</span>
                </button>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Auto-refresh</span>
                </label>
                
                <select
                  value={intervalMs}
                  onChange={(e) => setIntervalMs(Number(e.target.value))}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                >
                  <option value={2000}>2s</option>
                  <option value={3000}>3s</option>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                </select>
                
                <button
                  disabled={isGenerating}
                  onClick={generateOnTheFly}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Generate Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Decision Support */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Decision Support</h2>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 text-xl">🔄</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Auto-refresh</h3>
                <p className="text-sm text-slate-600">Dashboards update automatically</p>
              </div>
              
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-xl">🔗</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">No Data Silos</h3>
                <p className="text-sm text-slate-600">Prevent outdated views</p>
              </div>
              
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 text-xl">🔌</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">API Ready</h3>
                <p className="text-sm text-slate-600">Direct data access</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">💡 Pro Tip:</span> Use the latest values to take immediate action. 
                All panels reflect the most recent data pull for real-time decision making.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Recent Events */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Recent Events</h3>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-slate-400 text-lg">📝</span>
                  </div>
                  <p className="text-sm text-slate-500">No events yet</p>
                  <p className="text-xs text-slate-400 mt-1">Enable auto-refresh to start</p>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm text-slate-700">{event.message}</span>
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{event.at}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Anti-stale Safeguards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Data Freshness</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Freshness Indicator</h4>
                  <p className="text-xs text-slate-500">Color-coded status for data age</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Auto-refresh Polling</h4>
                  <p className="text-xs text-slate-500">Adjustable interval updates</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Stale Warning</h4>
                  <p className="text-xs text-slate-500">Banner alerts for inactive data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


