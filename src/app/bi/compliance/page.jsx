"use client";

import { useMemo, useState } from "react";

const TEMPLATES = [
  { id: "fs-local-gaap", name: "Financial Statements (Local GAAP)", required: ["company", "period"] },
  { id: "vat-quarterly", name: "VAT Return (Quarterly)", required: ["company", "quarter", "year"] },
  { id: "sox-audit", name: "SOX Audit Trail", required: ["company", "period"] },
];

const MOCK_HISTORY = [
  { id: "RPT-00121", template: "VAT Return (Quarterly)", period: "Q2 2025", created: "2025-09-10 10:12", status: "Filed" },
  { id: "RPT-00115", template: "Financial Statements (Local GAAP)", period: "FY 2024", created: "2025-04-01 15:44", status: "Approved" },
  { id: "RPT-00106", template: "SOX Audit Trail", period: "Jan 2025", created: "2025-02-01 09:03", status: "Archived" },
];

export default function ComplianceReportsPage() {
  const [templateId, setTemplateId] = useState("fs-local-gaap");
  const [company, setCompany] = useState("");
  const [period, setPeriod] = useState("");
  const [quarter, setQuarter] = useState("Q1");
  const [year, setYear] = useState("2025");
  const [auditEvents, setAuditEvents] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  const template = useMemo(() => TEMPLATES.find((t) => t.id === templateId), [templateId]);

  const validation = useMemo(() => {
    const required = template?.required || [];
    const missing = [];
    if (required.includes("company") && !company.trim()) missing.push("Company");
    if (required.includes("period") && !period.trim() && templateId !== "vat-quarterly") missing.push("Period");
    if (required.includes("quarter") && templateId === "vat-quarterly" && !quarter) missing.push("Quarter");
    if (required.includes("year") && templateId === "vat-quarterly" && !year) missing.push("Year");
    return { ok: missing.length === 0, missing };
  }, [template, company, period, quarter, year, templateId]);

  function appendAudit(message) {
    setAuditEvents((prev) => [{ id: Math.random().toString(36).slice(2), message, at: new Date().toLocaleString() }, ...prev].slice(0, 10));
  }

  function generateAuditTrail() {
    appendAudit("Generated audit trail for financial transactions and access logs");
    alert("Audit trail created. Entries are immutable and time-stamped.");
  }

  async function exportReport(kind) {
    if (!validation.ok) {
      alert(`Cannot export. Missing: ${validation.missing.join(", ")}`);
      return;
    }
    setExporting(true);
    await new Promise((r) => setTimeout(r, 700));
    setExporting(false);
    appendAudit(`Exported ${template?.name} as ${kind.toUpperCase()}`);
    alert(`Exported ${template?.name} as ${kind.toUpperCase()}`);
  }

  const filteredHistory = useMemo(() => {
    const q = historyFilter.trim().toLowerCase();
    if (!q) return MOCK_HISTORY;
    return MOCK_HISTORY.filter((h) =>
      [h.id, h.template, h.period, h.status].some((x) => x.toLowerCase().includes(q))
    );
  }, [historyFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-800">
          <span className="w-2 h-2 bg-green-800 rounded-full"></span>
          <span>Compliance & Regulatory</span>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-green-800">
          Compliance & Regulatory Reporting
        </h1>
        
        <p className="text-xl text-black/80 max-w-3xl mx-auto">
          Generate government and industry reports with audit trails, compliant formats, and searchable historical archive.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Template Builder */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
              </div>
              <h2 className="text-2xl font-bold text-green-800">Format Templates</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Template</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">Company</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Holdings Ltd"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              {templateId !== "vat-quarterly" && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Period</label>
                  <input
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="FY 2024 or Jan 2025"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              )}

              {templateId === "vat-quarterly" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Quarter</label>
                    <select
                      value={quarter}
                      onChange={(e) => setQuarter(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option>Q1</option>
                      <option>Q2</option>
                      <option>Q3</option>
                      <option>Q4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Year</label>
                    <input
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Validation Status */}
            <div className="mt-6 p-4 rounded-xl border-2 border-dashed">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-green-800">Validation Status</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  validation.ok 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-900 border border-red-200'
                }`}>
                  {validation.ok ? '✓ Valid' : '✗ Invalid'}
                </div>
              </div>
              <p className="text-sm text-black">
                {validation.ok 
                  ? 'All required fields are completed and meet compliance standards.'
                  : `Missing required fields: ${validation.missing.join(", ")}`
                }
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={generateAuditTrail}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
              >
                <span>📝</span>
                <span>Create Audit Trail</span>
              </button>
              
              <button
                disabled={!validation.ok || exporting}
                onClick={() => exportReport("pdf")}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>📄</span>
                )}
                <span>Export PDF</span>
              </button>
              
              <button
                disabled={!validation.ok || exporting}
                onClick={() => exportReport("xlsx")}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>📊</span>
                )}
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🔍</span>
              </div>
              <h2 className="text-2xl font-bold text-green-800">Audit Trail</h2>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {auditEvents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-slate-400 text-2xl">📝</span>
                  </div>
                  <p className="text-black/70">No audit entries yet</p>
                  <p className="text-sm text-black/50 mt-1">Generate an audit trail after building a report</p>
                </div>
              ) : (
                auditEvents.map((event) => (
                  <div key={event.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-800 rounded-full"></div>
                        <span className="text-sm font-medium text-black">{event.message}</span>
                      </div>
                      <span className="text-xs text-black/70">{event.at}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Historical Reports */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📚</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Historical Reports</h3>
            </div>
            
            <div className="mb-4">
              <input
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                placeholder="Search by ID, template, period, status"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600 border-b border-slate-200">
                    <th className="py-3 pr-3 font-medium text-green-800">ID</th>
                    <th className="py-3 pr-3 font-medium text-green-800">Template</th>
                    <th className="py-3 pr-3 font-medium text-green-800">Period</th>
                    <th className="py-3 pr-3 font-medium text-green-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((h) => (
                    <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-3 font-medium text-green-900">{h.id}</td>
                      <td className="py-3 pr-3 text-black">{h.template}</td>
                      <td className="py-3 pr-3 text-black/70">{h.period}</td>
                      <td className="py-3 pr-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          h.status === 'Filed' ? 'bg-green-100 text-green-800' :
                          h.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => exportReport("pdf")}
                disabled={exporting}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <span>📥</span>
                <span>Export Selected</span>
              </button>
              
              <button
                onClick={() => alert("Retention policy: 7 years (example)")}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-medium rounded-lg hover:from-slate-700 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 text-sm"
              >
                <span>📋</span>
                <span>Retention Policy</span>
              </button>
            </div>
          </div>

          {/* Compliance Features */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Compliance Features</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Audit Trails</h4>
                  <p className="text-xs text-black/70">Immutable and time-stamped entries</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Regulatory Templates</h4>
                  <p className="text-xs text-black/70">Pre-built compliance formats</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Historical Archive</h4>
                  <p className="text-xs text-black/70">Searchable report history</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Validation</h4>
                  <p className="text-xs text-black/70">Format compliance checking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

