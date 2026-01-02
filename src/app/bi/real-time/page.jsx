"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

function formatCurrency(num) {
  const formatted = `₱${formatNumber(num)}`;
  // Replace any + signs with ₱ (peso sign)
  return formatted.replace(/\+/g, '₱');
}

export default function RealTimeReportsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalMs, setIntervalMs] = useState(3000);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [kpis, setKpis] = useState({ revenue: 0, orders: 0, stockAlerts: 0 });
  const [previousKpis, setPreviousKpis] = useState({ revenue: 0, orders: 0, stockAlerts: 0 });
  const [reportData, setReportData] = useState({ orders: [], receivables: [] });
  const [allOrders, setAllOrders] = useState([]);
  const [allReceivables, setAllReceivables] = useState([]);
  const [events, setEvents] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportModalContent, setReportModalContent] = useState({ title: "", message: "", isError: false });
  const [dataSourceInfo, setDataSourceInfo] = useState({ lastFetchTime: null, dataAge: 0 });
  const timerRef = useRef(null);

  const ageSec = Math.floor((Date.now() - lastUpdated) / 1000);
  const freshnessColor = ageSec < 5 ? "text-green-900" : ageSec < 15 ? "text-orange-900" : "text-red-600";

  function pushEvent(message) {
    setEvents((prev) => [{ id: Math.random().toString(36).slice(2), message, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
  }

  const fetchLiveData = useCallback(async () => {
    try {
      // Cache-busting: Add timestamp to prevent stale data
      const timestamp = Date.now();
      const cacheBuster = `_t=${timestamp}`;
      const res = await fetch(`/api/realtime-kpis?range=all&${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      const data = await res.json();
      const apiKpis = data?.kpis || {};
      const samples = data?.samples || {};

      // Track changes for decision support - use functional updates to get latest state
      setKpis(currentKpis => {
        const newKpis = {
          revenue: apiKpis.revenue ?? 0,
          orders: apiKpis.orders ?? 0,
          stockAlerts: apiKpis.stockAlerts ?? 0,
        };

        // Detect significant changes and notify
        const revenueChange = newKpis.revenue - currentKpis.revenue;
        const ordersChange = newKpis.orders - currentKpis.orders;
        
        if (revenueChange !== 0 || ordersChange !== 0) {
          const changeMessages = [];
          if (revenueChange > 0) changeMessages.push(`Revenue increased by ${formatCurrency(revenueChange)}`);
          if (revenueChange < 0) changeMessages.push(`Revenue decreased by ${formatCurrency(Math.abs(revenueChange))}`);
          if (ordersChange > 0) changeMessages.push(`${ordersChange} new order(s)`);
          if (ordersChange < 0) changeMessages.push(`${Math.abs(ordersChange)} order(s) removed`);
          
          if (changeMessages.length > 0) {
            pushEvent(`Data updated: ${changeMessages.join(', ')}`);
          }
        }

        // Store previous values before updating
        setPreviousKpis(currentKpis);
        return newKpis;
      });

      setReportData({
        orders: samples.recentOrders || [],
        receivables: samples.recentReceivables || [],
      });

      // Store all orders and receivables for the full table
      setAllOrders(data?.allOrders || []);
      setAllReceivables(data?.allReceivables || []);

      const now = Date.now();
      setLastUpdated(now);
      setDataSourceInfo({
        lastFetchTime: new Date(now).toISOString(),
        dataAge: 0
      });
      pushEvent("Fetched latest real-time KPIs from sales & receivables");
    } catch (err) {
      console.error("Failed to fetch real-time KPIs", err);
      pushEvent(`Failed to fetch real-time KPIs: ${err.message}`);
      // Update data source info to show error state
      setDataSourceInfo(prev => ({
        ...prev,
        dataAge: Math.floor((Date.now() - (prev.lastFetchTime ? new Date(prev.lastFetchTime).getTime() : Date.now())) / 1000)
      }));
    }
  }, [lastUpdated]);

  const startPolling = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      fetchLiveData();
    }, intervalMs);
  }, [intervalMs, fetchLiveData]);

  useEffect(() => {
    // Initial fetch on page load
    fetchLiveData();

    if (autoRefresh) {
      startPolling();
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [autoRefresh, startPolling, fetchLiveData]);

  async function generateOnTheFly() {
    setIsGenerating(true);
    try {
      // Ensure we have the freshest data before generating the report
      await fetchLiveData();

      setIsGenerating(false);
      pushEvent("Generated real-time sales & revenue report");

      setReportModalContent({
        title: "Real-Time Report",
        message: `Orders: ${formatNumber(kpis.orders)}\nRevenue (TOTAL): ${formatCurrency(kpis.revenue)}`,
        isError: false
      });
      setShowReportModal(true);
    } catch (err) {
      console.error("Error generating on-the-fly report", err);
      setIsGenerating(false);
      pushEvent("Failed to generate real-time report");
      setReportModalContent({
        title: "Error",
        message: "Failed to generate real-time report. Check console for details.",
        isError: true
      });
      setShowReportModal(true);
    }
  }

  const staleWarning = useMemo(() => ageSec >= 15, [ageSec]);

  // Calculate KPI changes for decision support
  const kpiChanges = useMemo(() => {
    return {
      revenue: kpis.revenue - previousKpis.revenue,
      orders: kpis.orders - previousKpis.orders,
      stockAlerts: kpis.stockAlerts - previousKpis.stockAlerts,
    };
  }, [kpis, previousKpis]);

  // Get trend indicators
  const getTrendIndicator = (change, threshold = 0) => {
    if (change > threshold) return { icon: '↑', color: 'text-green-600', bg: 'bg-green-50', label: 'Increasing' };
    if (change < -threshold) return { icon: '↓', color: 'text-red-600', bg: 'bg-red-50', label: 'Decreasing' };
    return { icon: '→', color: 'text-gray-500', bg: 'bg-gray-50', label: 'Stable' };
  };

  const revenueTrend = getTrendIndicator(kpiChanges.revenue, 100);
  const ordersTrend = getTrendIndicator(kpiChanges.orders, 1);

  // Decision-making insights based on data
  const decisionInsights = useMemo(() => {
    const insights = [];
    const unpaidReceivables = allReceivables.filter(r => (r.status || '').toLowerCase() !== 'paid');
    const unpaidAmount = unpaidReceivables.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const overdueReceivables = unpaidReceivables.filter(r => {
      if (!r.due_date) return false;
      return new Date(r.due_date) < new Date();
    });
    const overdueAmount = overdueReceivables.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    // Revenue insights
    if (kpiChanges.revenue > 1000) {
      insights.push({
        type: 'opportunity',
        priority: 'high',
        icon: '📈',
        title: 'Strong Revenue Growth',
        message: `Revenue increased by ${formatCurrency(kpiChanges.revenue)}. Consider capitalizing on this trend.`,
        action: 'Review successful patterns'
      });
    } else if (kpiChanges.revenue < -1000) {
      insights.push({
        type: 'warning',
        priority: 'high',
        icon: '⚠️',
        title: 'Revenue Decline Detected',
        message: `Revenue decreased by ${formatCurrency(Math.abs(kpiChanges.revenue))}. Investigate causes.`,
        action: 'Analyze recent changes'
      });
    }

    // Order insights
    if (kpiChanges.orders > 5) {
      insights.push({
        type: 'opportunity',
        priority: 'medium',
        icon: '📦',
        title: 'Order Volume Surge',
        message: `${kpiChanges.orders} new orders detected. Monitor inventory levels.`,
        action: 'Check stock availability'
      });
    }

    // Accounts Receivable insights
    if (overdueAmount > 0) {
      insights.push({
        type: 'alert',
        priority: 'high',
        icon: '🔴',
        title: 'Overdue Invoices',
        message: `${overdueReceivables.length} invoice(s) overdue totaling ${formatCurrency(overdueAmount)}.`,
        action: 'Follow up on collections'
      });
    }

    if (unpaidAmount > 0 && unpaidAmount > kpis.revenue * 0.3) {
      insights.push({
        type: 'warning',
        priority: 'medium',
        icon: '💰',
        title: 'High Unpaid Balance',
        message: `Unpaid receivables (${formatCurrency(unpaidAmount)}) represent significant portion of revenue.`,
        action: 'Review collection strategy'
      });
    }

    // Recent activity insights
    const recentOrders = reportData.orders.slice(0, 3);
    if (recentOrders.length > 0) {
      const avgOrderValue = recentOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) / recentOrders.length;
      if (avgOrderValue > 5000) {
        insights.push({
          type: 'opportunity',
          priority: 'medium',
          icon: '💎',
          title: 'High-Value Orders',
          message: `Recent orders average ${formatCurrency(avgOrderValue)}. Premium customer segment active.`,
          action: 'Enhance customer service'
        });
      }
    }

    // Data freshness insight
    if (ageSec > 30) {
      insights.push({
        type: 'alert',
        priority: 'high',
        icon: '🔄',
        title: 'Stale Data Warning',
        message: `Data is ${ageSec} seconds old. Decisions may be based on outdated information.`,
        action: 'Refresh data now'
      });
    }

    // No significant changes
    if (insights.length === 0 && kpiChanges.revenue === 0 && kpiChanges.orders === 0) {
      insights.push({
        type: 'info',
        priority: 'low',
        icon: '✓',
        title: 'System Stable',
        message: 'No significant changes detected. Operations running normally.',
        action: 'Continue monitoring'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [kpiChanges, allReceivables, reportData.orders, kpis.revenue, ageSec]);

  function exportRealTimeToPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52); // green-800
    doc.text('Real-Time Sales & Revenue Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Report metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Last Updated: ${new Date(lastUpdated).toLocaleString()}`, 20, yPosition);
    yPosition += 7;
    
    // Summary statistics
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const revenueText = `Total Revenue: ${formatCurrency(kpis.revenue)}`;
    doc.text(revenueText, 20, yPosition);
    yPosition += 8;
    const ordersText = `Total Orders: ${formatNumber(kpis.orders)}`;
    doc.text(ordersText, 20, yPosition);
    yPosition += 8;
    const receivablesText = `Total Receivables: ${formatCurrency(reportData.receivables.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0))}`;
    doc.text(receivablesText, 20, yPosition);
    yPosition += 15;

    // Recent Sales Orders Table
    if (reportData.orders.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text('Recent Sales Orders', 20, yPosition);
      yPosition += 8;

      const ordersHeaders = [['Order ID', 'Total Amount', 'Status', 'Created At']];
      const ordersData = reportData.orders.map(order => [
        order.id.substring(0, 8) + '...',
        formatCurrency(parseFloat(order.total_amount) || 0),
        order.status || 'PENDING',
        order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: ordersHeaders,
        body: ordersData,
        theme: 'striped',
        headStyles: { 
          fillColor: [22, 101, 52], // green-800
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 4
        },
        bodyStyles: { 
          fontSize: 9,
          textColor: [0, 0, 0],
          cellPadding: 4
        },
        alternateRowStyles: { 
          fillColor: [240, 253, 244] // green-50
        },
        margin: { left: 20, right: 20 },
        styles: { 
          cellPadding: 4,
          overflow: 'linebreak',
          cellWidth: 'auto',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 45, halign: 'left' }, // Order ID
          1: { cellWidth: 45, halign: 'right' }, // Total Amount
          2: { cellWidth: 35, halign: 'center' }, // Status
          3: { cellWidth: 60, halign: 'left' } // Created At
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Recent Accounts Receivable Table
    if (reportData.receivables.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text('Recent Accounts Receivable', 20, yPosition);
      yPosition += 8;

      const receivablesHeaders = [['Invoice #', 'Amount', 'Status', 'Invoice Date', 'Due Date']];
      const receivablesData = reportData.receivables.map(receivable => [
        '#' + (receivable.invoice_number || 'N/A'),
        formatCurrency(parseFloat(receivable.amount) || 0),
        receivable.status || 'PENDING',
        receivable.invoice_date ? new Date(receivable.invoice_date).toLocaleDateString() : 'N/A',
        receivable.due_date ? new Date(receivable.due_date).toLocaleDateString() : 'N/A'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: receivablesHeaders,
        body: receivablesData,
        theme: 'striped',
        headStyles: { 
          fillColor: [22, 101, 52], // green-800
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 4
        },
        bodyStyles: { 
          fontSize: 9,
          textColor: [0, 0, 0],
          cellPadding: 4
        },
        alternateRowStyles: { 
          fillColor: [240, 253, 244] // green-50
        },
        margin: { left: 20, right: 20 },
        styles: { 
          cellPadding: 4,
          overflow: 'linebreak',
          cellWidth: 'auto',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'left' }, // Invoice #
          1: { cellWidth: 40, halign: 'right' }, // Amount
          2: { cellWidth: 30, halign: 'center' }, // Status
          3: { cellWidth: 40, halign: 'left' }, // Invoice Date
          4: { cellWidth: 40, halign: 'left' } // Due Date
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // All Orders Table
    if (allOrders.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text(`All Orders with Invoice Details (${allOrders.length} total)`, 20, yPosition);
      yPosition += 8;

      const allOrdersHeaders = [['Order ID', 'Order Amount', 'Status', 'Created At', 'Invoice #', 'Invoice Amount', 'Invoice Date', 'Due Date']];
      const allOrdersData = [];
      
      allOrders.forEach(order => {
        const invoices = order.invoices || [];
        if (invoices.length > 0) {
          invoices.forEach((invoice, idx) => {
            allOrdersData.push([
              idx === 0 ? order.id : '',
              idx === 0 ? formatCurrency(parseFloat(order.total_amount) || 0) : '',
              idx === 0 ? (order.status || 'PENDING') : '',
              idx === 0 ? (order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A') : '',
              '#' + (invoice.invoice_number || 'N/A'),
              formatCurrency(parseFloat(invoice.amount) || 0),
              invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A',
              invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'
            ]);
          });
        } else {
          allOrdersData.push([
            order.id,
            formatCurrency(parseFloat(order.total_amount) || 0),
            order.status || 'PENDING',
            order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A',
            'No invoice',
            '-',
            '-',
            '-'
          ]);
        }
      });

      autoTable(doc, {
        startY: yPosition,
        head: allOrdersHeaders,
        body: allOrdersData,
        theme: 'striped',
        headStyles: { 
          fillColor: [22, 101, 52], // green-800
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 4
        },
        bodyStyles: { 
          fontSize: 8,
          textColor: [0, 0, 0],
          cellPadding: 4
        },
        alternateRowStyles: { 
          fillColor: [240, 253, 244] // green-50
        },
        margin: { left: 20, right: 20 },
        styles: { 
          cellPadding: 4,
          overflow: 'linebreak',
          cellWidth: 'auto',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 40, halign: 'left' }, // Order ID
          1: { cellWidth: 35, halign: 'right' }, // Order Amount
          2: { cellWidth: 25, halign: 'center' }, // Status
          3: { cellWidth: 45, halign: 'left' }, // Created At
          4: { cellWidth: 30, halign: 'left' }, // Invoice #
          5: { cellWidth: 35, halign: 'right' }, // Invoice Amount
          6: { cellWidth: 35, halign: 'left' }, // Invoice Date
          7: { cellWidth: 35, halign: 'left' } // Due Date
        },
      });
    }

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${pageCount} | Starbucks BI - Real-Time Report`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `Real-Time_Report_${new Date().toISOString().split('T')[0]}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-full text-sm font-bold text-green-800 shadow-lg">
          <span className="w-3 h-3 bg-green-800 rounded-full animate-pulse"></span>
          <span>Live Data Analytics</span>
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight text-green-800">
          Real-Time Data Retrieval
        </h1>
        
        <p className="text-xl text-black max-w-4xl mx-auto leading-relaxed">
          Pull live data from transactions and logs to generate on-the-fly reports without waiting for batch processing.
        </p>
      </div>

      {/* Stale Warning & Data Freshness Info */}
      {staleWarning && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 text-lg">⚠️</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-900">Data Stale Warning - Risk of Outdated Information</h3>
              <p className="text-sm text-red-900">Last update was {ageSec}s ago. Data may not reflect current state. Enable auto-refresh or refresh now to prevent decision-making on outdated data.</p>
            </div>
          </div>
          <button
            onClick={fetchLiveData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Refresh Now
          </button>
        </div>
      )}
      
      {/* Data Source Information Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">ℹ️</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900">Live Data Source</h4>
              <p className="text-xs text-blue-700">
                Connected to Supabase | Last fetched: {dataSourceInfo.lastFetchTime ? new Date(dataSourceInfo.lastFetchTime).toLocaleTimeString() : 'Never'} | 
                Data age: {ageSec}s | Status: {ageSec < 5 ? 'Fresh' : ageSec < 15 ? 'Recent' : 'Stale'}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            ageSec < 5 ? 'bg-green-100 text-green-800' : 
            ageSec < 15 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {ageSec < 5 ? '✓ Fresh' : ageSec < 15 ? '⚠ Recent' : '✗ Stale'}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Live KPIs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-green-800">Live KPIs</h2>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                ageSec < 5 ? 'bg-green-100 text-green-800' : 
                ageSec < 15 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-900'
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
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-emerald-600 text-sm font-medium">Revenue (TOTAL)</div>
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-900">{formatCurrency(kpis.revenue)}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-emerald-600">Total of all orders</div>
                  {kpiChanges.revenue !== 0 && (
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${revenueTrend.bg} ${revenueTrend.color} text-xs font-medium`}>
                      <span>{revenueTrend.icon}</span>
                      <span>{kpiChanges.revenue > 0 ? '+' : ''}{formatCurrency(kpiChanges.revenue)}</span>
                    </div>
                  )}
                </div>
                {kpiChanges.revenue !== 0 && (
                  <div className="absolute top-2 right-2">
                    <div className={`w-2 h-2 rounded-full ${revenueTrend.color.replace('text-', 'bg-').replace('-600', '-500')} animate-pulse`}></div>
                  </div>
                )}
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-blue-600 text-sm font-medium">Orders</div>
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📦</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900">{formatNumber(kpis.orders)}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-blue-600">Total orders generated</div>
                  {kpiChanges.orders !== 0 && (
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${ordersTrend.bg} ${ordersTrend.color} text-xs font-medium`}>
                      <span>{ordersTrend.icon}</span>
                      <span>{kpiChanges.orders > 0 ? '+' : ''}{formatNumber(kpiChanges.orders)}</span>
                    </div>
                  )}
                </div>
                {kpiChanges.orders !== 0 && (
                  <div className="absolute top-2 right-2">
                    <div className={`w-2 h-2 rounded-full ${ordersTrend.color.replace('text-', 'bg-').replace('-600', '-500')} animate-pulse`}></div>
                  </div>
                )}
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
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm text-black"
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

          {/* Generated Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📋</span>
                </div>
                <h2 className="text-2xl font-bold text-green-800">Generated Results</h2>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-600">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </div>
                <button
                  onClick={() => exportRealTimeToPDF()}
                  disabled={reportData.orders.length === 0 && reportData.receivables.length === 0}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium rounded-lg hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <span>📄</span>
                  <span>Export to PDF</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Recent Orders Table */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <span>📦</span>
                  <span>Recent Sales Orders</span>
                  <span className="text-sm font-normal text-slate-500">({reportData.orders.length} shown)</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Order ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {reportData.orders.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-500">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        reportData.orders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-900 font-mono">
                              {order.id.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-emerald-700">
                              {formatCurrency(parseFloat(order.total_amount) || 0)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                order.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status || 'PENDING'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Receivables Table */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <span>💰</span>
                  <span>Recent Accounts Receivable</span>
                  <span className="text-sm font-normal text-slate-500">({reportData.receivables.length} shown)</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice #</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {reportData.receivables.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                            No receivables found
                          </td>
                        </tr>
                      ) : (
                        reportData.receivables.map((receivable) => (
                          <tr key={receivable.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                              #{receivable.invoice_number || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-emerald-700">
                              {formatCurrency(parseFloat(receivable.amount) || 0)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                (receivable.status || '').toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {receivable.status || 'PENDING'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {receivable.invoice_date ? new Date(receivable.invoice_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {receivable.due_date ? new Date(receivable.due_date).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* All Orders Table - Scrollable */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <span>📊</span>
                  <span>All Orders with Invoice Details</span>
                  <span className="text-sm font-normal text-slate-500">({allOrders.length} total orders)</span>
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="overflow-y-auto max-h-[480px]">
                    <table className="w-full">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Order ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Order Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Created At</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice #</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {allOrders.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">
                              No orders found
                            </td>
                          </tr>
                        ) : (
                          allOrders.map((order) => {
                            const invoices = order.invoices || [];
                            // If order has invoices, show one row per invoice, otherwise show one row for the order
                            if (invoices.length > 0) {
                              return invoices.map((invoice, idx) => (
                                <tr key={`${order.id}-${invoice.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 text-sm text-slate-900 font-mono">
                                    {idx === 0 ? order.id : ''}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-emerald-700">
                                    {idx === 0 ? formatCurrency(parseFloat(order.total_amount) || 0) : ''}
                                  </td>
                                  <td className="px-4 py-3">
                                    {idx === 0 ? (
                                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                        order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                        order.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {order.status || 'PENDING'}
                                      </span>
                                    ) : ''}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {idx === 0 ? (order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A') : ''}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                    #{invoice.invoice_number || 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-emerald-700">
                                    {formatCurrency(parseFloat(invoice.amount) || 0)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ));
                            } else {
                              // Order without invoices
                              return (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 text-sm text-slate-900 font-mono">
                                    {order.id}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-emerald-700">
                                    {formatCurrency(parseFloat(order.total_amount) || 0)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                      order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                      order.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {order.status || 'PENDING'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-500 italic">No invoice</td>
                                  <td className="px-4 py-3 text-sm text-slate-500 italic">-</td>
                                  <td className="px-4 py-3 text-sm text-slate-500 italic">-</td>
                                  <td className="px-4 py-3 text-sm text-slate-500 italic">-</td>
                                </tr>
                              );
                            }
                          }).flat()
                        )}
                      </tbody>
                    </table>
                  </div>
                  {allOrders.length > 10 && (
                    <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-600 text-center">
                      Showing all {allOrders.length} orders with invoice details. Scroll to see more.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Decision Making Insights */}
          <div className="bg-white rounded-2xl border-2 border-green-200 shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-800 to-emerald-900 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-800">Decision-Making Insights</h2>
                  <p className="text-sm text-slate-600">Actionable recommendations based on real-time data</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-green-800">{decisionInsights.length} Insight{decisionInsights.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Decision Insights List */}
            <div className="space-y-4">
              {decisionInsights.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-slate-400 text-2xl">📊</span>
                  </div>
                  <p className="text-sm text-slate-600">Analyzing data... Insights will appear here based on current metrics.</p>
                </div>
              ) : (
                decisionInsights.map((insight, index) => {
                  const bgColor = {
                    opportunity: 'from-green-50 to-emerald-50 border-green-200',
                    warning: 'from-yellow-50 to-orange-50 border-yellow-200',
                    alert: 'from-red-50 to-pink-50 border-red-200',
                    info: 'from-blue-50 to-indigo-50 border-blue-200'
                  }[insight.type] || 'from-slate-50 to-slate-100 border-slate-200';

                  const textColor = {
                    opportunity: 'text-green-900',
                    warning: 'text-yellow-900',
                    alert: 'text-red-900',
                    info: 'text-blue-900'
                  }[insight.type] || 'text-slate-900';

                  const priorityBadge = {
                    high: 'bg-red-100 text-red-800 border-red-300',
                    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    low: 'bg-blue-100 text-blue-800 border-blue-300'
                  }[insight.priority] || 'bg-slate-100 text-slate-800 border-slate-300';

                  return (
                    <div key={index} className={`p-5 bg-gradient-to-r ${bgColor} rounded-xl border-2 shadow-sm hover:shadow-md transition-all`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white shadow-sm`}>
                            {insight.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className={`font-bold text-lg ${textColor}`}>{insight.title}</h3>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${priorityBadge}`}>
                                {insight.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-black mb-3">{insight.message}</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-slate-700">💡 Recommended Action:</span>
                              <span className="text-xs font-semibold text-green-700 bg-white px-2 py-1 rounded border border-green-200">
                                {insight.action}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Decision Support Features */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">How to Use Decision Insights</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-600 text-lg">🔍</span>
                    <h4 className="font-semibold text-blue-900">Monitor Trends</h4>
                  </div>
                  <p className="text-xs text-blue-800">
                    Watch trend indicators (↑↓) next to KPIs for real-time changes. Green = positive, Red = negative.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-purple-600 text-lg">⚡</span>
                    <h4 className="font-semibold text-purple-900">Act on Alerts</h4>
                  </div>
                  <p className="text-xs text-purple-800">
                    High-priority insights require immediate attention. Review recommendations and take action.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-green-600 text-lg">📊</span>
                    <h4 className="font-semibold text-green-900">Data-Driven Decisions</h4>
                  </div>
                  <p className="text-xs text-green-800">
                    All insights are based on current data. Refresh frequently for most accurate recommendations.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-orange-600 text-lg">🎯</span>
                    <h4 className="font-semibold text-orange-900">Track Changes</h4>
                  </div>
                  <p className="text-xs text-orange-800">
                    Compare current values with previous state using change indicators and event logs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Recent Events */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Recent Events</h3>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-slate-400 text-lg">📝</span>
                  </div>
                  <p className="text-sm text-black/70">No events yet</p>
                  <p className="text-xs text-black/50 mt-1">Enable auto-refresh to start</p>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm text-black">{event.message}</span>
                      <span className="text-xs text-black/70 flex-shrink-0 ml-2">{event.at}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Anti-stale Safeguards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Data Freshness</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Freshness Indicator</h4>
                  <p className="text-xs text-black/70">Color-coded status for data age</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Auto-refresh Polling</h4>
                  <p className="text-xs text-black/70">Adjustable interval updates</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Stale Warning</h4>
                  <p className="text-xs text-black/70">Banner alerts for inactive data</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Cache-Busting</h4>
                  <p className="text-xs text-black/70">Prevents outdated cached data</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Change Tracking</h4>
                  <p className="text-xs text-black/70">Shows real-time value changes</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Unified Data Source</h4>
                  <p className="text-xs text-black/70">Single source of truth, no data silos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* In-Page Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={reportModalContent.isError ? "text-red-600" : "text-green-800"}>
              {reportModalContent.title}
            </DialogTitle>
            <div className="pt-4">
              <div className="whitespace-pre-line text-black">
                {reportModalContent.message.split('\n').map((line, index) => (
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
                className={reportModalContent.isError 
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


// SUPABASE_URL=https://lawaadzoxwufjbskafzu.supabase.co
// SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd2FhZHpveHd1Zmpic2thZnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTczMTUsImV4cCI6MjA3MzEzMzMxNX0.RFjSoHZOk4r3ioZwxs7a-ZOvsK9C5KcGlitcNm-Ovl0
// PORT=3001

// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=587
// SMTP_USER=jojobinay2333@gmail.com
// SMTP_PASS=riby mnav rfbt xozv # 16‑char app password, not your login
// SMTP_FROM=Reports jojobinay2333@gmail.com