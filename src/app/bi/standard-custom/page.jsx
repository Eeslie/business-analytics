"use client";

import { useMemo, useState } from "react";

const PREDEFINED_REPORTS = [
  { id: "sales-summary", name: "Sales Summary" },
  { id: "inventory-stock", name: "Inventory Stock" },
  { id: "profit-loss", name: "Profit & Loss" },
];

const DEPARTMENTS = ["All", "Sales", "Operations", "Finance", "HR"];
const REGIONS = ["All", "North", "South", "East", "West"];

export default function StandardCustomReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState("sales-summary");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [department, setDepartment] = useState("All");
  const [region, setRegion] = useState("All");
  const [includeColumns, setIncludeColumns] = useState({
    amount: true,
    quantity: true,
    comments: false,
  });

  const [runResult, setRunResult] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [schedule, setSchedule] = useState({
    frequency: "daily",
    time: "09:00",
    email: "",
  });
  const [scheduleSaved, setScheduleSaved] = useState(false);

  const selectedReportName = useMemo(() => {
    return PREDEFINED_REPORTS.find((r) => r.id === selectedReportId)?.name ?? "";
  }, [selectedReportId]);

  function runReport() {
    const payload = {
      reportId: selectedReportId,
      dateFrom,
      dateTo,
      department,
      region,
      columns: Object.keys(includeColumns).filter((k) => includeColumns[k]),
      generatedAt: new Date().toISOString(),
    };
    setRunResult(payload);
  }

  async function handleExport(kind) {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 600));
    setExporting(false);
    alert(`Exported ${selectedReportName} as ${kind.toUpperCase()}`);
  }

  function saveSchedule() {
    setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 1500);
  }

  return (
    <section className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-orange-900">Standard and Custom Report Generation</h2>
        <p className="text-black/80 mt-1 max-w-3xl">
          Generates built-in reports across all modules with options to customize layout and filters. Run, export, or schedule reports.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Predefined Reports</h3>
            <div className="mt-3 grid sm:grid-cols-3 gap-3">
              {PREDEFINED_REPORTS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReportId(r.id)}
                  className={`text-left rounded-md border px-3 py-2 transition-colors ${
                    selectedReportId === r.id
                      ? "border-green-900 text-green-900 bg-black/[.03]"
                      : "border-black/10 hover:bg-black/[.03]"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Customize Filters</h3>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Date from</span>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border border-black/15 px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Date to</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border border-black/15 px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Department</span>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-md border border-black/15 px-3 py-2">
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Region</span>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-md border border-black/15 px-3 py-2">
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4">
              <div className="text-sm text-black/70 mb-2">Columns</div>
              <div className="flex flex-wrap gap-4">
                {Object.keys(includeColumns).map((key) => (
                  <label key={key} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeColumns[key]}
                      onChange={(e) => setIncludeColumns({ ...includeColumns, [key]: e.target.checked })}
                    />
                    <span className="capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <button onClick={runReport} className="rounded-md border border-black/10 bg-white px-4 py-2 text-green-900 hover:bg-black/[.03]">
                Run report
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Results</h3>
            {runResult ? (
              <div className="mt-3 text-sm text-black/80">
                <div><span className="font-semibold">Report:</span> {selectedReportName}</div>
                <div className="grid sm:grid-cols-2 gap-x-4">
                  <div><span className="font-semibold">Date from:</span> {runResult.dateFrom || "(not set)"}</div>
                  <div><span className="font-semibold">Date to:</span> {runResult.dateTo || "(not set)"}</div>
                  <div><span className="font-semibold">Department:</span> {runResult.department}</div>
                  <div><span className="font-semibold">Region:</span> {runResult.region}</div>
                  <div className="sm:col-span-2"><span className="font-semibold">Columns:</span> {runResult.columns.join(", ")}</div>
                </div>
                <div className="mt-3 text-black/60">Generated at {new Date(runResult.generatedAt).toLocaleString()}</div>
              </div>
            ) : (
              <p className="mt-3 text-black/60">Run a report to see a preview of parameters used.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Export</h3>
            <p className="text-black/70 mt-1">Choose a format to download.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button disabled={exporting} onClick={() => handleExport("pdf")} className="rounded-md border border-black/10 bg-white px-4 py-2 text-orange-900 hover:bg-black/[.03] disabled:opacity-60">PDF</button>
              <button disabled={exporting} onClick={() => handleExport("xlsx")} className="rounded-md border border-black/10 bg-white px-4 py-2 text-orange-900 hover:bg-black/[.03] disabled:opacity-60">Excel</button>
              <button disabled={exporting} onClick={() => handleExport("csv")} className="rounded-md border border-black/10 bg-white px-4 py-2 text-orange-900 hover:bg-black/[.03] disabled:opacity-60">CSV</button>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Schedule</h3>
            <div className="mt-4 grid gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Frequency</span>
                <select value={schedule.frequency} onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })} className="rounded-md border border-black/15 px-3 py-2">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Time</span>
                <input type="time" value={schedule.time} onChange={(e) => setSchedule({ ...schedule, time: e.target.value })} className="rounded-md border border-black/15 px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Send to email</span>
                <input type="email" placeholder="name@example.com" value={schedule.email} onChange={(e) => setSchedule({ ...schedule, email: e.target.value })} className="rounded-md border border-black/15 px-3 py-2" />
              </label>
              <div>
                <button onClick={saveSchedule} className="rounded-md border border-black/10 bg-white px-4 py-2 text-green-900 hover:bg-black/[.03]">Save schedule</button>
                {scheduleSaved && <span className="ml-3 text-sm text-green-900">Saved</span>}
              </div>
            </div>
            <p className="mt-3 text-sm text-black/60">Reports will be generated with the selected filters and delivered to the configured email.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

