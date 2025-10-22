"use client";

import { useMemo, useState } from "react";
import { exportToPDF, exportToExcel, exportToCSV } from "../../../utils/exportUtils";

const PREDEFINED_REPORTS = [
  { id: "sales-summary", name: "Sales Summary" },
  { id: "inventory-stock", name: "Inventory Stock" },
  { id: "profit-loss", name: "Profit & Loss" },
];

const DEPARTMENTS = ["All", "Sales", "Operations", "Finance", "HR"];
const REGIONS = ["All", "North", "South", "East", "West"];

const API_BASE_URL = "http://localhost:3000";

export default function StandardCustomReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState("inventory-stock");
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [schedule, setSchedule] = useState({
    frequency: "daily",
    time: "09:00",
    email: "",
  });
  const [scheduleSaved, setScheduleSaved] = useState(false);

  const selectedReportName = useMemo(() => {
    return PREDEFINED_REPORTS.find((r) => r.id === selectedReportId)?.name ?? "";
  }, [selectedReportId]);

  async function runReport() {
    if (selectedReportId === "inventory-stock") {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        dateFrom: dateFrom || "",
        dateTo: dateTo || "",
        department: department || "All",
        region: region || "All",
      }).toString();

      try {
        console.log("Fetching from:", `${API_BASE_URL}/api/inventory-stocks?${params}`);
        
        const response = await fetch(`${API_BASE_URL}/api/inventory-stocks?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Received data:", data);

        setRunResult({
          reportId: selectedReportId,
          dateFrom,
          dateTo,
          department,
          region,
          columns: Object.keys(includeColumns).filter((k) => includeColumns[k]),
          generatedAt: new Date().toISOString(),
          rows: data,
        });
      } catch (error) {
        console.error("Fetch error:", error);
        setError(`Failed to fetch inventory stocks: ${error.message}`);
        alert(`Failed to fetch inventory stocks report: ${error.message}\n\nMake sure your backend is running on port 3001`);
      } finally {
        setLoading(false);
      }
    } else {
      setRunResult({
        reportId: selectedReportId,
        dateFrom,
        dateTo,
        department,
        region,
        columns: Object.keys(includeColumns).filter((k) => includeColumns[k]),
        generatedAt: new Date().toISOString(),
      });
    }
  }

  async function handleExport(kind) {
    if (!runResult) {
      alert("Please generate a report first");
      return;
    }
    try {
      setExporting(true);
      const payload = {
        reportId: runResult.reportId,
        dateFrom: runResult.dateFrom,
        dateTo: runResult.dateTo,
        department: runResult.department,
        region: runResult.region,
        columns: runResult.columns,
        generatedAt: runResult.generatedAt,
        rows: runResult.rows,
      };
      if (kind === "pdf") exportToPDF(payload);
      else if (kind === "xlsx") exportToExcel(payload);
      else if (kind === "csv") exportToCSV(payload);
    } catch (err) {
      console.error("Export failed", err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  async function saveSchedule() {
    try {
      if (!schedule.email) {
        alert("Please enter an email address");
        return;
      }
      const body = {
        id: `${selectedReportId}:${schedule.email}`,
        reportId: selectedReportId,
        dateFrom,
        dateTo,
        department,
        region,
        email: schedule.email,
        frequency: schedule.frequency,
        time: schedule.time,
      };
      const res = await fetch("/api/schedule-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to schedule");
      setScheduleSaved(true);
      setTimeout(() => setScheduleSaved(false), 1500);
    } catch (err) {
      console.error(err);
      alert(`Failed to save schedule: ${err.message}`);
    }
  }

  return (
    <div className="space-y-8 p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-800">
          <span className="w-2 h-2 bg-green-800 rounded-full"></span>
          <span>Report Generation</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-green-800">
          Standard & Custom Reports
        </h1>

        <p className="text-xl text-black/80 max-w-3xl mx-auto">
          Generate built-in reports across all modules with customizable layouts, filters, and scheduling options.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <strong>Error:</strong> {error}
          <p className="text-sm mt-2">Make sure your backend server is running on port 3001</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Report Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
              <h2 className="text-2xl font-bold text-green-800">Predefined Reports</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {PREDEFINED_REPORTS.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedReportId === report.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedReportId === report.id
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                      }`}
                    >
                      {selectedReportId === report.id ? "✓" : "○"}
                    </div>
                    <span
                      className={`font-medium ${
                        selectedReportId === report.id ? "text-blue-900" : "text-slate-700"
                      }`}
                    >
                      {report.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">⚙️</span>
              </div>
              <h2 className="text-2xl font-bold text-green-800">Customize Filters</h2>
            </div>

            {/* Date Range Filter - Highlighted */}
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <label className="block text-sm font-semibold text-green-900 mb-3 flex items-center">
                <span className="mr-2">📅</span>
                Transaction Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-black mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                    placeholder="From"
                  />
                </div>
                <div>
                  <label className="block text-xs text-black mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                    placeholder="To"
                  />
                </div>
              </div>
              {(dateFrom || dateTo) && (
                <div className="mt-2 text-xs text-green-900 flex items-center">
                  <span className="mr-2">ℹ️</span>
                  <span>Filtering inventory items that had transactions in this date range</span>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-black">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-black">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-black mb-3">Include Columns</label>
              <div className="flex flex-wrap gap-4">
                {Object.keys(includeColumns).map((key) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeColumns[key]}
                      onChange={(e) => setIncludeColumns({ ...includeColumns, [key]: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-black capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={runReport}
                disabled={loading}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📈</span>
              </div>
              <h2 className="text-2xl font-bold text-green-800">Report Results</h2>
            </div>

            {runResult && runResult.reportId === "inventory-stock" && runResult.rows ? (
              <div className="space-y-4">
                {/* Summary Info */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-900">{runResult.rows.length}</div>
                      <div className="text-xs text-black">Total Items</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {runResult.rows.reduce((sum, row) => sum + (row.transaction_count || 0), 0)}
                      </div>
                      <div className="text-xs text-black">Total Transactions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {dateFrom || "No start"}
                      </div>
                      <div className="text-xs text-black">From Date</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {dateTo || "No end"}
                      </div>
                      <div className="text-xs text-black">To Date</div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Item Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Branch</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Warehouse</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Transactions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {runResult.rows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-black">{row.inventory_item?.name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-black/70">{row.inventory_item?.category || "-"}</td>
                          <td className="px-4 py-3 text-sm text-black font-medium">{row.qty ?? "-"}</td>
                          <td className="px-4 py-3 text-sm text-black/70">{row.inventory_item?.unit_measurement || "-"}</td>
                          <td className="px-4 py-3 text-sm text-black/70">{row.branch?.name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-black/70">{row.warehouse?.name || "-"}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {row.transaction_count || 0} txns
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-slate-50 px-4 py-3 text-sm text-black border-t border-slate-200">
                    Total records: {runResult.rows.length}
                  </div>
                </div>
              </div>
            ) : runResult ? (
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-green-800">{selectedReportName}</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Generated
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-black/70">Date Range:</span>
                      <span className="font-medium text-black">
                        {runResult.dateFrom || "Not set"} - {runResult.dateTo || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70">Department:</span>
                      <span className="font-medium text-black">{runResult.department}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-black/70">Region:</span>
                      <span className="font-medium text-black">{runResult.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70">Columns:</span>
                      <span className="font-medium text-black">{runResult.columns.length}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm text-black/70">
                    <span>Generated at {new Date(runResult.generatedAt).toLocaleString()}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {runResult.columns.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-slate-400">📊</span>
                </div>
                <p className="text-black/70">Generate a report to see results and parameters</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Export */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📥</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Export</h3>
            </div>

            <p className="text-black text-sm mb-4">Choose a format to download your report</p>

            <div className="space-y-3">
              {[
                { format: "pdf", label: "PDF", icon: "📄", color: "from-red-500 to-pink-500" },
                { format: "xlsx", label: "Excel", icon: "📊", color: "from-green-500 to-emerald-500" },
                { format: "csv", label: "CSV", icon: "📋", color: "from-blue-500 to-cyan-500" },
              ].map(({ format, label, icon, color }) => (
                <button
                  key={format}
                  disabled={exporting}
                  onClick={() => handleExport(format)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <div className={`w-8 h-8 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center`}>
                    <span className="text-white text-sm">{icon}</span>
                  </div>
                  <span className="font-medium text-black">{label}</span>
                  {exporting && <div className="ml-auto w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>}
                </button>
              ))}
            </div>
          </div>



          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">⏰</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Schedule</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Frequency</label>
                <select
                  value={schedule.frequency}
                  onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Time</label>
                <input
                  type="time"
                  value={schedule.time}
                  onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Email</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={schedule.email}
                  onChange={(e) => setSchedule({ ...schedule, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                onClick={saveSchedule}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
              >
                <span>💾</span>
                <span>Save Schedule</span>
                {scheduleSaved && <span className="text-green-300">✓</span>}
              </button>
            </div>

            <p className="mt-4 text-xs text-black/70">
              Reports will be generated with selected filters and delivered to the configured email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}