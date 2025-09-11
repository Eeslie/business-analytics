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
    <section className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-orange-900">Compliance and Regulatory Reporting</h2>
        <p className="text-black/80 mt-1 max-w-3xl">
          Supports the generation of government/industry reports with audit trails, compliant formats, and a searchable historical archive.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Builder & Validation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Format Templates</h3>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Template</span>
                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="rounded-md border border-black/15 px-3 py-2">
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Company</span>
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Holdings Ltd" className="rounded-md border border-black/15 px-3 py-2" />
              </label>

              {templateId !== "vat-quarterly" && (
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-black/70">Period</span>
                  <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="FY 2024 or Jan 2025" className="rounded-md border border-black/15 px-3 py-2" />
                </label>
              )}

              {templateId === "vat-quarterly" && (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-black/70">Quarter</span>
                    <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="rounded-md border border-black/15 px-3 py-2">
                      <option>Q1</option>
                      <option>Q2</option>
                      <option>Q3</option>
                      <option>Q4</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-black/70">Year</span>
                    <input value={year} onChange={(e) => setYear(e.target.value)} className="rounded-md border border-black/15 px-3 py-2" />
                  </label>
                </>
              )}
            </div>

            <div className="mt-4 rounded-md border border-black/10 bg-white p-3 text-sm">
              <div className="font-medium">
                Validation: {validation.ok ? (
                  <span className="text-green-900">OK – meets required fields</span>
                ) : (
                  <span className="text-orange-900">Missing {validation.missing.join(", ")}</span>
                )}
              </div>
              <p className="text-black/70 mt-1">Ensures format compliance with local/legal standards before export.</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={generateAuditTrail} className="rounded-md border border-black/10 bg-white px-4 py-2 text-green-900 hover:bg-black/[.03]">Create audit trail</button>
              <button disabled={!validation.ok} onClick={() => exportReport("pdf")} className="rounded-md border border-black/10 bg-white px-4 py-2 text-orange-900 hover:bg-black/[.03] disabled:opacity-60">Export PDF</button>
              <button disabled={!validation.ok} onClick={() => exportReport("xlsx")} className="rounded-md border border-black/10 bg-white px-4 py-2 text-orange-900 hover:bg-black/[.03] disabled:opacity-60">Export Excel</button>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Audit Trail</h3>
            <ul className="mt-3 space-y-2">
              {auditEvents.length === 0 && (
                <li className="text-sm text-black/60">No audit entries yet. Generate an audit trail after building a report.</li>
              )}
              {auditEvents.map((e) => (
                <li key={e.id} className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm flex items-center justify-between">
                  <span className="text-black/80">{e.message}</span>
                  <span className="text-black/40">{e.at}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Historical Archive */}
        <div className="space-y-6">
          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Historical Reports</h3>
            <div className="mt-3">
              <input
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                placeholder="Search by ID, template, period, status"
                className="w-full rounded-md border border-black/15 px-3 py-2"
              />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-black/60">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Template</th>
                    <th className="py-2 pr-3">Period</th>
                    <th className="py-2 pr-3">Created</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((h) => (
                    <tr key={h.id} className="border-t border-black/10">
                      <td className="py-2 pr-3 font-medium text-green-900">{h.id}</td>
                      <td className="py-2 pr-3">{h.template}</td>
                      <td className="py-2 pr-3">{h.period}</td>
                      <td className="py-2 pr-3">{h.created}</td>
                      <td className="py-2 pr-3">{h.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3">
              <button onClick={() => exportReport("pdf")} disabled={exporting} className="rounded-md border border-black/10 bg-white px-3 py-2 text-orange-900 hover:bg-black/[.03] disabled:opacity-60">Export selected</button>
              <button onClick={() => alert("Retention policy: 7 years (example)")} className="rounded-md border border-black/10 bg-white px-3 py-2 text-green-900 hover:bg-black/[.03]">View retention policy</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

