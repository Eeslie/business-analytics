"use client";

import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const TEMPLATES = [
  { id: "audit-trail", name: "Audit Trail", description: "Create audit trails and financial statements" },
  { id: "financial-statement", name: "Financial Statement", description: "Ensure format compliance with local/legal standards" },
];

const MOCK_HISTORY = [
  { id: "RPT-00121", template: "Audit Trail", period: new Date().toLocaleDateString(), created: new Date().toLocaleString(), status: "Generated" },
  { id: "RPT-00115", template: "Financial Statement", period: new Date().toLocaleDateString(), created: new Date(Date.now() - 86400000).toLocaleString(), status: "Approved" },
  { id: "RPT-00106", template: "Audit Trail", period: new Date(Date.now() - 172800000).toLocaleDateString(), created: new Date(Date.now() - 172800000).toLocaleString(), status: "Archived" },
];

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

function formatCurrency(num) {
  const formatted = `₱${formatNumber(num)}`;
  // Replace any + signs with ₱ (peso sign)
  return formatted.replace(/\+/g, '₱');
}

export default function ComplianceReportsPage() {
  const [templateId, setTemplateId] = useState("audit-trail");
  const [auditEvents, setAuditEvents] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "", isError: false });
  const [ordersData, setOrdersData] = useState([]);
  const [receivablesData, setReceivablesData] = useState([]);
  const [kpis, setKpis] = useState({ revenue: 0, orders: 0 });
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportType, setReportType] = useState(null); // 'audit-trail' or 'financial-statement'

  const template = useMemo(() => TEMPLATES.find((t) => t.id === templateId), [templateId]);

  // Fetch orders data from real-time API
  useEffect(() => {
    async function fetchOrdersData() {
      try {
        setLoading(true);
        const res = await fetch("/api/realtime-kpis?range=all");
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const data = await res.json();
        
        setKpis({
          revenue: data?.kpis?.revenue ?? 0,
          orders: data?.kpis?.orders ?? 0,
        });
        setOrdersData(data?.allOrders || []);
        setReceivablesData(data?.allReceivables || []);
      } catch (err) {
        console.error("Failed to fetch orders data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrdersData();
  }, []);

  function appendAudit(message) {
    setAuditEvents((prev) => [{ id: Math.random().toString(36).slice(2), message, at: new Date().toLocaleString() }, ...prev].slice(0, 10));
  }

  function generateAuditTrail() {
    setReportType('audit-trail');
    setReportGenerated(true);
    appendAudit("Generated audit trail for financial transactions and access logs");
    setModalContent({
      title: "Audit Trail Created",
      message: "Audit trail created. Entries are immutable and time-stamped. View the report below.",
      isError: false
    });
    setShowModal(true);
    
    // Scroll to report section after a brief delay
    setTimeout(() => {
      const reportSection = document.getElementById('report-section');
      if (reportSection) {
        reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  }

  function generateFinancialStatement() {
    setReportType('financial-statement');
    setReportGenerated(true);
    appendAudit("Generated financial statement report");
    setModalContent({
      title: "Financial Statement Created",
      message: "Financial statement generated. View the report below.",
      isError: false
    });
    setShowModal(true);
    
    // Scroll to report section after a brief delay
    setTimeout(() => {
      const reportSection = document.getElementById('report-section');
      if (reportSection) {
        reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  }

  function exportAuditTrailPDF() {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('AUDIT TRAIL REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Report metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Total Orders: ${formatNumber(kpis.orders)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Total Revenue: ${formatCurrency(kpis.revenue)}`, 20, yPosition);
    yPosition += 15;

    // Audit Trail Entries
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('Transaction Audit Trail', 20, yPosition);
    yPosition += 8;

    const auditHeaders = [['Timestamp', 'Order ID', 'Amount', 'Status', 'Invoice #', 'Invoice Date']];
    const auditData = [];

    ordersData.forEach(order => {
      const invoices = order.invoices || [];
      if (invoices.length > 0) {
        invoices.forEach(invoice => {
          auditData.push([
            order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A',
            order.id || 'N/A',
            formatCurrency(parseFloat(order.total_amount) || 0),
            order.status || 'PENDING',
            '#' + (invoice.invoice_number || 'N/A'),
            invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'
          ]);
        });
      } else {
        auditData.push([
          order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A',
          order.id || 'N/A',
          formatCurrency(parseFloat(order.total_amount) || 0),
          order.status || 'PENDING',
          'No invoice',
          'N/A'
        ]);
      }
    });

    autoTable(doc, {
      startY: yPosition,
      head: auditHeaders,
      body: auditData,
      theme: 'striped',
      headStyles: { 
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 6
      },
      bodyStyles: { 
        fontSize: 9,
        textColor: [0, 0, 0],
        cellPadding: 5
      },
      alternateRowStyles: { 
        fillColor: [240, 253, 244]
      },
      margin: { left: 15, right: 20, top: 15 },
      styles: { 
        cellPadding: 5,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      columnStyles: {
        0: { cellWidth: 50, cellPadding: { top: 6, bottom: 6, left: 5, right: 5 } },
        1: { cellWidth: 60, cellPadding: { top: 6, bottom: 6, left: 5, right: 5 } },
        2: { cellWidth: 40, halign: 'left', cellPadding: { top: 6, bottom: 6, left: 5, right: 5 } },
        3: { cellWidth: 40, halign: 'center', cellPadding: { top: 6, bottom: 6, left: 5, right: 5 } },
        4: { cellWidth: 40, cellPadding: { top: 6, bottom: 6, left: 5, right: 5 } },
        5: { cellWidth: 40, cellPadding: { top: 6, bottom: 6, left: 5, right: 5 } }
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${pageCount} | Compliance & Regulatory Reporting`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    const fileName = `Audit_Trail_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    appendAudit(`Exported Audit Trail as PDF`);
  }

  function exportFinancialStatementPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('FINANCIAL STATEMENT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Report metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Reporting Period: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('Financial Summary', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Revenue:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(kpis.revenue), 80, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Total Orders:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatNumber(kpis.orders), 80, yPosition);
    yPosition += 8;

    const totalReceivables = receivablesData.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Receivables:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(totalReceivables), 80, yPosition);
    yPosition += 15;

    // Orders Breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('Orders Breakdown', 20, yPosition);
    yPosition += 8;

    const ordersHeaders = [['Order ID', 'Amount', 'Status', 'Created Date']];
    const ordersDataTable = ordersData.slice(0, 50).map(order => [
      order.id.substring(0, 12) + '...',
      formatCurrency(parseFloat(order.total_amount) || 0),
      order.status || 'PENDING',
      order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: ordersHeaders,
      body: ordersDataTable,
      theme: 'striped',
      headStyles: { 
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 4
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: [0, 0, 0],
        cellPadding: 3
      },
      alternateRowStyles: { 
        fillColor: [240, 253, 244]
      },
      margin: { left: 20, right: 20 },
      styles: { 
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40, halign: 'left' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 45 }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Receivables Section
    if (receivablesData.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text('Accounts Receivable', 20, yPosition);
      yPosition += 8;

      const receivablesHeaders = [['Invoice #', 'Amount', 'Status', 'Invoice Date', 'Due Date']];
      const receivablesDataTable = receivablesData.slice(0, 50).map(receivable => [
        '#' + (receivable.invoice_number || 'N/A'),
        formatCurrency(parseFloat(receivable.amount) || 0),
        receivable.status || 'PENDING',
        receivable.invoice_date ? new Date(receivable.invoice_date).toLocaleDateString() : 'N/A',
        receivable.due_date ? new Date(receivable.due_date).toLocaleDateString() : 'N/A'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: receivablesHeaders,
        body: receivablesDataTable,
        theme: 'striped',
        headStyles: { 
          fillColor: [22, 101, 52],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 4
        },
        bodyStyles: { 
          fontSize: 8,
          textColor: [0, 0, 0],
          cellPadding: 3
        },
        alternateRowStyles: { 
          fillColor: [240, 253, 244]
        },
        margin: { left: 20, right: 20 },
        styles: { 
          cellPadding: 3,
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 35, halign: 'left' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 40 },
          4: { cellWidth: 40 }
        }
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${pageCount} | Compliance & Regulatory Reporting`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    const fileName = `Financial_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    appendAudit(`Exported Financial Statement as PDF`);
  }

  function exportAuditTrailExcel() {
    const workbook = XLSX.utils.book_new();
    
    // Prepare data
    const excelData = [
      ['AUDIT TRAIL REPORT'],
      ['Generated:', new Date().toLocaleString()],
      ['Total Orders:', kpis.orders],
      ['Total Revenue:', formatCurrency(kpis.revenue)],
      [''],
      ['Timestamp', 'Order ID', 'Amount', 'Status', 'Invoice #', 'Invoice Date']
    ];

    ordersData.forEach(order => {
      const invoices = order.invoices || [];
      if (invoices.length > 0) {
        invoices.forEach(invoice => {
          excelData.push([
            order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A',
            order.id,
            parseFloat(order.total_amount) || 0,
            order.status || 'PENDING',
            invoice.invoice_number || 'N/A',
            invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'
          ]);
        });
      } else {
        excelData.push([
          order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A',
          order.id,
          parseFloat(order.total_amount) || 0,
          order.status || 'PENDING',
          'No invoice',
          'N/A'
        ]);
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    worksheet['!cols'] = [
      { wch: 22 }, // Timestamp
      { wch: 40 }, // Order ID
      { wch: 18 }, // Amount
      { wch: 16 }, // Status
      { wch: 20 }, // Invoice #
      { wch: 20 }  // Invoice Date
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Trail');
    XLSX.writeFile(workbook, `Audit_Trail_${new Date().toISOString().split('T')[0]}.xlsx`);
    appendAudit(`Exported Audit Trail as Excel`);
  }

  function exportFinancialStatementExcel() {
    const workbook = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['FINANCIAL STATEMENT'],
      ['Generated:', new Date().toLocaleString()],
      ['Reporting Period:', new Date().toLocaleDateString()],
      [''],
      ['Financial Summary'],
      ['Total Revenue:', kpis.revenue],
      ['Total Orders:', kpis.orders],
      ['Total Receivables:', receivablesData.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)],
      [''],
      ['Orders Breakdown'],
      ['Order ID', 'Amount', 'Status', 'Created Date']
    ];

    ordersData.forEach(order => {
      summaryData.push([
        order.id,
        parseFloat(order.total_amount) || 0,
        order.status || 'PENDING',
        order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'
      ]);
    });

    summaryData.push(['']);
    summaryData.push(['Accounts Receivable']);
    summaryData.push(['Invoice #', 'Amount', 'Status', 'Invoice Date', 'Due Date']);

    receivablesData.forEach(receivable => {
      summaryData.push([
        receivable.invoice_number || 'N/A',
        parseFloat(receivable.amount) || 0,
        receivable.status || 'PENDING',
        receivable.invoice_date ? new Date(receivable.invoice_date).toLocaleDateString() : 'N/A',
        receivable.due_date ? new Date(receivable.due_date).toLocaleDateString() : 'N/A'
      ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Financial Summary');
    
    XLSX.writeFile(workbook, `Financial_Statement_${new Date().toISOString().split('T')[0]}.xlsx`);
    appendAudit(`Exported Financial Statement as Excel`);
  }

  async function exportReport(kind) {
    setExporting(true);
    try {
      if (templateId === "audit-trail") {
        if (kind === "pdf") {
          exportAuditTrailPDF();
        } else if (kind === "xlsx") {
          exportAuditTrailExcel();
        }
      } else if (templateId === "financial-statement") {
        if (kind === "pdf") {
          exportFinancialStatementPDF();
        } else if (kind === "xlsx") {
          exportFinancialStatementExcel();
        }
      }
      
      setModalContent({
        title: "Export Successful",
        message: `Exported ${template?.name} as ${kind.toUpperCase()}`,
        isError: false
      });
      setShowModal(true);
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
      <div className="text-center space-y-6">
        <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-full text-sm font-bold text-green-800 shadow-lg">
          <span className="w-3 h-3 bg-green-800 rounded-full"></span>
          <span>Compliance & Regulatory</span>
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight text-green-800">
          Compliance & Regulatory Reporting
        </h1>
        
        <p className="text-xl text-black max-w-4xl mx-auto leading-relaxed">
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

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Select Template</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {template && (
                  <p className="mt-2 text-sm text-slate-600">{template.description}</p>
                )}
              </div>

              {/* Data Summary */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <h3 className="text-sm font-semibold text-green-800 mb-3">Data Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-600">Total Orders</div>
                    <div className="text-lg font-bold text-green-900">
                      {loading ? 'Loading...' : formatNumber(kpis.orders)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Total Revenue</div>
                    <div className="text-lg font-bold text-green-900">
                      {loading ? 'Loading...' : formatCurrency(kpis.revenue)}
                    </div>
                  </div>
                </div>
              </div>
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
                onClick={generateFinancialStatement}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                <span>💰</span>
                <span>Create Financial Statement</span>
              </button>
              
              <button
                disabled={loading || exporting || ordersData.length === 0}
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
                disabled={loading || exporting || ordersData.length === 0}
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

          {/* Generated Reports Section */}
          {reportGenerated && (
            <div id="report-section" className="bg-white rounded-2xl border-2 border-green-200 shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-800 to-emerald-900 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-800">
                      {reportType === 'audit-trail' ? 'Audit Trail Report' : 'Financial Statement Report'}
                    </h2>
                    <p className="text-sm text-slate-600">Generated: {new Date().toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setReportGenerated(false);
                    setReportType(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕ Close Report
                </button>
              </div>

              {/* Report Summary */}
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-slate-600 mb-1">Total Orders</div>
                    <div className="text-lg font-bold text-green-900">{formatNumber(kpis.orders)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600 mb-1">Total Revenue</div>
                    <div className="text-lg font-bold text-green-900">{formatCurrency(kpis.revenue)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600 mb-1">Total Receivables</div>
                    <div className="text-lg font-bold text-green-900">
                      {formatCurrency(receivablesData.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600 mb-1">Report Type</div>
                    <div className="text-lg font-bold text-green-900 capitalize">
                      {reportType === 'audit-trail' ? 'Audit Trail' : 'Financial Statement'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Trail Table */}
              {reportType === 'audit-trail' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center space-x-2">
                      <span>📋</span>
                      <span>Transaction Audit Trail</span>
                      <span className="text-sm font-normal text-slate-500">({ordersData.length} orders)</span>
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Timestamp</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Order ID</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Invoice #</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Invoice Date</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {ordersData.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                                  No orders found
                                </td>
                              </tr>
                            ) : (
                              ordersData.map((order) => {
                                const invoices = order.invoices || [];
                                if (invoices.length > 0) {
                                  return invoices.map((invoice, idx) => (
                                    <tr key={`${order.id}-${invoice.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-4 py-3 text-sm text-slate-900">
                                        {idx === 0 ? (order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A') : ''}
                                      </td>
                                      <td className="px-4 py-3 text-sm font-mono text-slate-900">
                                        {idx === 0 ? order.id || 'N/A' : ''}
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
                                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                        #{invoice.invoice_number || 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-600">
                                        {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}
                                      </td>
                                    </tr>
                                  ));
                                } else {
                                  return (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-4 py-3 text-sm text-slate-900">
                                        {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-sm font-mono text-slate-900">
                                        {order.id || 'N/A'}
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
                                      <td className="px-4 py-3 text-sm text-slate-500 italic">No invoice</td>
                                      <td className="px-4 py-3 text-sm text-slate-500 italic">N/A</td>
                                    </tr>
                                  );
                                }
                              }).flat()
                            )}
                          </tbody>
                        </table>
                      </div>
                      {ordersData.length > 0 && (
                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-600">
                          Showing {ordersData.length} order{ordersData.length !== 1 ? 's' : ''} with all invoice details. Scroll to see more.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Statement Tables */}
              {reportType === 'financial-statement' && (
                <div className="space-y-6">
                  {/* Orders Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center space-x-2">
                      <span>📦</span>
                      <span>Orders Breakdown</span>
                      <span className="text-sm font-normal text-slate-500">({ordersData.length} orders)</span>
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Order ID</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Created Date</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {ordersData.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-500">
                                  No orders found
                                </td>
                              </tr>
                            ) : (
                              ordersData.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 text-sm font-mono text-slate-900">{order.id}</td>
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
                                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {ordersData.length > 0 && (
                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-600">
                          Showing all {ordersData.length} orders. Scroll to see more.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accounts Receivable */}
                  {receivablesData.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center space-x-2">
                        <span>💰</span>
                        <span>Accounts Receivable</span>
                        <span className="text-sm font-normal text-slate-500">({receivablesData.length} invoices)</span>
                      </h3>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                          <table className="w-full">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Invoice #</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Invoice Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider border-b border-slate-200">Due Date</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                              {receivablesData.map((receivable) => (
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
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-600">
                          Showing all {receivablesData.length} receivables. Scroll to see more.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Audit Trail Events Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🔍</span>
              </div>
              <h2 className="text-2xl font-bold text-green-800">Audit Trail Events</h2>
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-sm text-black"
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
                onClick={() => {
                  setModalContent({
                    title: "Retention Policy",
                    message: "Retention policy: 7 years (example)",
                    isError: false
                  });
                  setShowModal(true);
                }}
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

      {/* In-Page Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={modalContent.isError ? "text-red-600" : "text-green-800"}>
              {modalContent.title}
            </DialogTitle>
            <div className="pt-4">
              <div className="whitespace-pre-line text-black">
                {modalContent.message}
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button 
                className={modalContent.isError 
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

