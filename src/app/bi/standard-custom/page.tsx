"use client";

import React, { useMemo, useState } from "react";
import { exportToPDF, exportToExcel, exportToCSV } from "../../../lib/utils/exportUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
// --- FIX ---
// I've removed the unused 'AppSidebar' import.


const PREDEFINED_REPORTS = [
  { id: "sales-summary", name: "Sales Summary" },
  { id: "inventory-stock", name: "Inventory Stock" },
  { id: "profit-loss", name: "Profit & Loss" },
];

export default function StandardCustomReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState("inventory-stock");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "", isError: false });

  const selectedReportName = useMemo(() => {
    return PREDEFINED_REPORTS.find((r) => r.id === selectedReportId)?.name ?? "";
  }, [selectedReportId]);

  // Helper function to format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "₱0.00";
    const num = parseFloat(value);
    if (isNaN(num)) return "₱0.00";
    const formatted = `₱${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    // Replace any + signs with ₱ (peso sign)
    return formatted.replace(/\+/g, '₱');
  };

  // Helper function to format number
  const formatNumber = (value) => {
    if (value === null || value === undefined) return "0";
    const num = parseFloat(value);
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-US");
  };

  async function runReport() {
    setLoading(true);
    setError(null);

    try {
      if (selectedReportId === "inventory-stock") {
        const params = new URLSearchParams({
          dateFrom: dateFrom || "",
          dateTo: dateTo || "",
        }).toString();

        const url = `/api/inventory-stocks?${params}`;
        console.log("Fetching from:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Received data:", data);

        setRunResult({
          reportId: selectedReportId,
          dateFrom,
          dateTo,
          columns: Object.keys(includeColumns).filter((k) => includeColumns[k]),
          generatedAt: new Date().toISOString(),
          rows: data,
        });
      } else if (selectedReportId === "sales-summary" || selectedReportId === "profit-loss") {
        const params = new URLSearchParams({
          dateFrom: dateFrom || "",
          dateTo: dateTo || "",
        }).toString();

        const url = `/api/sales-orders?${params}`;
        console.log("Fetching sales orders from:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Received sales orders data:", data);

        setRunResult({
          reportId: selectedReportId,
          dateFrom,
          dateTo,
          columns: Object.keys(includeColumns).filter((k) => includeColumns[k]),
          generatedAt: new Date().toISOString(),
          rows: data.orders || [],
          summary: data.summary || {},
        });
      } else {
        setRunResult({
          reportId: selectedReportId,
          dateFrom,
          dateTo,
          columns: Object.keys(includeColumns).filter((k) => includeColumns[k]),
          generatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError(`Failed to fetch report: ${error.message}`);
      setModalContent({
        title: "Error",
        message: `Failed to fetch report: ${error.message}`,
        isError: true
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(kind) {
    if (!runResult) {
      setModalContent({
        title: "No Report",
        message: "Please generate a report first",
        isError: false
      });
      setShowModal(true);
      return;
    }
    try {
      setExporting(true);
      const payload = {
        reportId: runResult.reportId,
        dateFrom: runResult.dateFrom,
        dateTo: runResult.dateTo,
        columns: runResult.columns,
        generatedAt: runResult.generatedAt,
        rows: runResult.rows,
        summary: runResult.summary,
      };
      if (kind === "pdf") exportToPDF(payload);
      else if (kind === "xlsx") exportToExcel(payload);
      else if (kind === "csv") exportToCSV(payload);
    } catch (err) {
      console.error("Export failed", err);
      setModalContent({
        title: "Export Failed",
        message: `Export failed: ${err.message}`,
        isError: true
      });
      setShowModal(true);
    } finally {
      setExporting(false);
    }
  }

  async function saveSchedule() {
    try {
      if (!schedule.email) {
        setModalContent({
          title: "Missing Email",
          message: "Please enter an email address",
          isError: false
        });
        setShowModal(true);
        return;
      }
      const body = {
        id: `${selectedReportId}:${schedule.email}`,
        reportId: selectedReportId,
        dateFrom,
        dateTo,
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
      setModalContent({
        title: "Error",
        message: `Failed to save schedule: ${err.message}`,
        isError: true
      });
      setShowModal(true);
    }
  }

  return (
    <div className="space-y-8 p-8 bg-white min-h-screen">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-full text-sm font-bold text-green-800 shadow-lg">
              <span className="w-3 h-3 bg-green-800 rounded-full"></span>
              <span>Report Generation</span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-green-800">
              Standard & Custom Reports
            </h1>

            <p className="text-xl text-black max-w-4xl mx-auto leading-relaxed">
              Generate built-in reports across all modules with customizable layouts, filters, and scheduling options.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-red-900 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">⚠️</span>
                </div>
                <div>
                  <strong className="text-lg font-bold">Error:</strong> {error}
                  <p className="text-sm mt-2 font-medium">Make sure your backend server is running on port 3001</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Report Selection */}
              <div className="bg-white rounded-3xl border-2 border-green-200 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
                {/* ... (rest of your unchanged code) ... */}
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-800 to-green-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <h2 className="text-3xl font-bold text-green-800">Predefined Reports</h2>
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
              <div className="bg-white rounded-3xl border-2 border-green-200 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
                {/* ... (rest of your unchanged code) ... */}
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-800 to-green-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">⚙️</span>
                  </div>
                  <h2 className="text-3xl font-bold text-green-800">Customize Filters</h2>
                </div>
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
                        className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-black"
                        placeholder="From"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-black mb-1">To Date</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-black"
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
              <div className="bg-white rounded-3xl border-2 border-green-200 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
                {/* ... (rest of your unchanged code) ... */}
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-800 to-green-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">📈</span>
                  </div>
                  <h2 className="text-3xl font-bold text-green-800">Report Results</h2>
                </div>
                {runResult && runResult.reportId === "inventory-stock" && runResult.rows ? (
                  <div className="space-y-4">
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
                ) : runResult && runResult.reportId === "sales-summary" && runResult.rows ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-900">{runResult.rows.length}</div>
                          <div className="text-xs text-black">Total Orders</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-900">
                            {formatCurrency(runResult.rows.reduce((sum, row) => sum + (parseFloat(row.total_amount) || 0), 0))}
                          </div>
                          <div className="text-xs text-black">Total Revenue</div>
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
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Order ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Total Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Created At</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Invoices</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {runResult.rows.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-black font-mono">{order.id}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-emerald-700">{formatCurrency(parseFloat(order.total_amount) || 0)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                  order.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {order.status || 'PENDING'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-black/70">
                                {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-black/70">
                                {order.invoices && order.invoices.length > 0 ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {order.invoices.length} invoice{order.invoices.length !== 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">No invoices</span>
                                )}
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
                ) : runResult && runResult.reportId === "profit-loss" && runResult.summary ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <h3 className="text-lg font-bold text-green-900 mb-4">Profit & Loss Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-sm text-black/70 mb-1">Total Revenue</div>
                          <div className="text-2xl font-bold text-green-900">{formatCurrency(runResult.summary.totalRevenue)}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-sm text-black/70 mb-1">Paid Revenue</div>
                          <div className="text-2xl font-bold text-emerald-700">{formatCurrency(runResult.summary.paidRevenue)}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-red-200">
                          <div className="text-sm text-black/70 mb-1">Unpaid Revenue</div>
                          <div className="text-2xl font-bold text-red-700">{formatCurrency(runResult.summary.unpaidRevenue)}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-sm text-black/70 mb-1">Total Orders</div>
                          <div className="text-2xl font-bold text-green-900">{formatNumber(runResult.summary.totalOrders)}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-emerald-200">
                          <div className="text-sm text-black/70 mb-1">Paid Orders</div>
                          <div className="text-2xl font-bold text-emerald-700">{formatNumber(runResult.summary.paidOrders)}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                          <div className="text-sm text-black/70 mb-1">Pending Orders</div>
                          <div className="text-2xl font-bold text-yellow-700">{formatNumber(runResult.summary.pendingOrders)}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-200 md:col-span-3">
                          <div className="text-sm text-black/70 mb-1">Net Profit (Paid Revenue)</div>
                          <div className="text-3xl font-bold text-blue-900">{formatCurrency(runResult.summary.netProfit)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <h4 className="text-md font-semibold text-green-900 mb-3">Date Range</h4>
                      <div className="text-sm text-black">
                        <span className="font-medium">From:</span> {dateFrom || "No start date"} | <span className="font-medium">To:</span> {dateTo || "No end date"}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-green-200">
                      <div className="px-4 py-3 border-b border-green-200">
                        <h4 className="text-md font-semibold text-green-900">Profit & Loss Detail</h4>
                      </div>
                      <div className="overflow-y-auto max-h-[500px]">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-100 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Order ID</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Order Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Paid Amount (Profit)</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Unpaid Amount (Loss)</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Created At</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {runResult.rows && runResult.rows.length > 0 ? (
                              runResult.rows.map((order) => {
                                const invoices = order.invoices || [];
                                const paidAmount = invoices
                                  .filter(inv => (inv.status || "").toLowerCase() === "paid")
                                  .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
                                const unpaidAmount = invoices.length > 0
                                  ? invoices
                                      .filter(inv => (inv.status || "").toLowerCase() !== "paid")
                                      .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0)
                                  : parseFloat(order.total_amount) || 0;
                                
                                return (
                                  <tr key={order.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm text-black font-mono">{order.id}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-emerald-700">{formatCurrency(parseFloat(order.total_amount) || 0)}</td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                        order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                        order.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {order.status || 'PENDING'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-emerald-700">{formatCurrency(paidAmount)}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-red-700">{formatCurrency(unpaidAmount)}</td>
                                    <td className="px-4 py-3 text-sm text-black/70">
                                      {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                  No orders found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-slate-50 px-4 py-3 text-sm text-black border-t border-slate-200">
                        {runResult.rows ? `Total records: ${runResult.rows.length}` : 'No records'}
                      </div>
                    </div>
                  </div>
                ) : runResult ? (
                  <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                    <p className="text-black">Report generated successfully.</p>
                    <p className="text-sm text-black/70">Date Range: {dateFrom || "No start"} - {dateTo || "No end"}</p>
                    <p className="text-sm text-black/70">Generated at: {new Date(runResult.generatedAt).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-slate-400 text-lg mb-2">No report generated yet</div>
                    <div className="text-slate-500 text-sm">Select a report type and click "Generate Report" to get started</div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              
              {/* Export */}
              <div className="bg-white rounded-3xl border-2 border-green-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
                {/* ... (rest of your unchanged code) ... */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-800 to-green-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">📥</span>
                  </div>
                  <h3 className="text-xl font-bold text-green-800">Export</h3>
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
              <div className="bg-white rounded-3xl border-2 border-green-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
                {/* ... (rest of your unchanged code) ... */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-800 to-green-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">⏰</span>
                  </div>
                  <h3 className="text-xl font-bold text-green-800">Schedule</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Frequency</label>
                    <select
                      value={schedule.frequency}
                      onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black"
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
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={schedule.email}
                      onChange={(e) => setSchedule({ ...schedule, email: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black "
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

      {/* In-Page Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={modalContent.isError ? "text-red-600" : "text-green-800"}>
              {modalContent.title}
            </DialogTitle>
            <div className="pt-4">
              <div className="whitespace-pre-line text-black">
                {modalContent.message.split('\n').map((line, index) => (
                  <div key={index} className={index > 0 ? "mt-2" : ""}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button 
                className={
                  modalContent.isError 
                    ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700" 
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                }
              >
                OK
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}