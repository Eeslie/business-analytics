import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString();
};

// Helper function to format currency
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '₱0.00';
  const num = parseFloat(value);
  if (isNaN(num)) return '₱0.00';
  const formatted = `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  // Replace any + signs with ₱ (peso sign)
  return formatted.replace(/\+/g, '₱');
};

// Helper function to get report title
const getReportTitle = (reportId) => {
  const titles = {
    'sales-summary': 'Sales Summary Report',
    'inventory-stock': 'Inventory Stock Report',
    'profit-loss': 'Profit & Loss Report'
  };
  return titles[reportId] || 'Custom Report';
};

// Export to PDF
export const exportToPDF = (reportData) => {
  const { reportId, dateFrom, dateTo, generatedAt, rows, summary } = reportData;
  
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(getReportTitle(reportId), pageWidth / 2, 20, { align: 'center' });
  
  // Report metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPosition = 35;
  
  doc.text(`Generated: ${formatDate(generatedAt)}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Date Range: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`, 20, yPosition);
  yPosition += 8;
 
  
  // Add some space before table
  yPosition += 15;
  
  if (reportId === 'profit-loss' && summary) {
    // Profit & Loss summary table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Profit & Loss Summary', 20, yPosition);
    yPosition += 10;
    
    const summaryData = [
      ['Total Revenue', formatCurrency(summary.totalRevenue)],
      ['Paid Revenue', formatCurrency(summary.paidRevenue)],
      ['Unpaid Revenue', formatCurrency(summary.unpaidRevenue)],
      ['Total Orders', summary.totalOrders?.toString() || '0'],
      ['Paid Orders', summary.paidOrders?.toString() || '0'],
      ['Pending Orders', summary.pendingOrders?.toString() || '0'],
      ['Net Profit (Paid Revenue)', formatCurrency(summary.netProfit)]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      styles: { fontSize: 13 },
      headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 20, right: 20 }
    });
    
    // Add detailed profit & loss table if rows are available
    if (rows && rows.length > 0) {  
      // Start Profit & Loss Detail on a new page
      doc.addPage();

      let yPosition = 20;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Profit & Loss Detail', 20, yPosition);
      yPosition += 5;
      
      const detailHeaders = [['Order ID', 'Order Amount', 'Status', 'Paid Amount (Profit)', 'Unpaid Amount (Loss)', 'Created At']];
      const detailData = rows.map(order => {
        const invoices = order.invoices || [];
        const paidAmount = invoices
          .filter(inv => (inv.status || "").toLowerCase() === "paid")
          .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
        const unpaidAmount = invoices.length > 0
          ? invoices
              .filter(inv => (inv.status || "").toLowerCase() !== "paid")
              .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0)
          : parseFloat(order.total_amount) || 0;
        
        return [
          order.id || '-',
          formatCurrency(parseFloat(order.total_amount) || 0),
          order.status || 'PENDING',
          formatCurrency(paidAmount),
          formatCurrency(unpaidAmount),
          order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'
        ];
      });
      
      autoTable(doc, {
        startY: yPosition + 10,
        head: detailHeaders,
        body: detailData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255], fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 35},
          2: { cellWidth: 30 },
          3: { cellWidth: 40},
          4: { cellWidth: 40},
          5: { cellWidth: 50 }
        }
      });
    }
  } else if (rows && rows.length > 0) {
    // Prepare table data
    const tableColumns = [];
    const tableRows = [];
    
    if (reportId === 'inventory-stock') {
      // Define columns for inventory stock report
      tableColumns.push(
        { title: 'Item Name', dataKey: 'itemName' },
        { title: 'Category', dataKey: 'category' },
        { title: 'Quantity', dataKey: 'quantity' },
        { title: 'Unit', dataKey: 'unit' },
        { title: 'Branch', dataKey: 'branch' },
        { title: 'Warehouse', dataKey: 'warehouse' }
      );
      
      // Transform data for table
      rows.forEach(row => {
        tableRows.push({
          itemName: row.inventory_item?.name || '-',
          category: row.inventory_item?.category || '-',
          quantity: row.qty ?? '-',
          unit: row.inventory_item?.unit_measurement || '-',
          branch: row.branch?.name || '-',
          warehouse: row.warehouse?.name || '-'
        });
      });
    } else if (reportId === 'sales-summary') {
      // Define columns for sales summary report
      tableColumns.push(
        { title: 'Order ID', dataKey: 'orderId' },
        { title: 'Total Amount', dataKey: 'totalAmount' },
        { title: 'Status', dataKey: 'status' },
        { title: 'Created At', dataKey: 'createdAt' },
        { title: 'Invoice Count', dataKey: 'invoiceCount' }
      );
      
      // Transform data for table
      rows.forEach(row => {
        tableRows.push({
          orderId: row.id || '-',
          totalAmount: formatCurrency(parseFloat(row.total_amount) || 0),
          status: row.status || 'PENDING',
          createdAt: row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A',
          invoiceCount: (row.invoices && row.invoices.length) || 0
        });
      });
    } else {
      // Generic report structure
      tableColumns.push(
        { title: 'Field', dataKey: 'field' },
        { title: 'Value', dataKey: 'value' }
      );
      
      tableRows.push(
        { field: 'Report Type', value: getReportTitle(reportId) },
        { field: 'Date Range', value: `${formatDate(dateFrom)} - ${formatDate(dateTo)}` },
        { field: 'Generated At', value: formatDate(generatedAt) }
      );
    }
    
    // Add table
    autoTable(doc, {
      startY: yPosition,
      head: [tableColumns.map(col => col.title)],
      body: tableRows.map(row => tableColumns.map(col => row[col.dataKey])),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 20, right: 20 }
    });
  } else {
    // No data message
    doc.setFontSize(12);
    doc.text('No data available for this report.', 20, yPosition);
  }
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
  }
  
  // Save the PDF
  const fileName = `${getReportTitle(reportId).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Export to Excel
export const exportToExcel = (reportData) => {
  const { reportId, dateFrom, dateTo, generatedAt, rows, summary } = reportData;
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for Excel
  let excelData = [];
  let sheetName = getReportTitle(reportId);
  
  if (reportId === 'profit-loss' && summary) {
    excelData = [
      ['Profit & Loss Summary', ''],
      ['', ''],
      ['Metric', 'Value'],
      ['Total Revenue', formatCurrency(summary.totalRevenue)],
      ['Paid Revenue', formatCurrency(summary.paidRevenue)],
      ['Unpaid Revenue', formatCurrency(summary.unpaidRevenue)],
      ['Total Orders', summary.totalOrders?.toString() || '0'],
      ['Paid Orders', summary.paidOrders?.toString() || '0'],
      ['Pending Orders', summary.pendingOrders?.toString() || '0'],
      ['Net Profit (Paid Revenue)', formatCurrency(summary.netProfit)],
      ['', ''],
      ['Report Information', ''],
      ['Date Range', `${formatDate(dateFrom)} - ${formatDate(dateTo)}`],
      ['Generated At', formatDate(generatedAt)]
    ];
  } else if (rows && rows.length > 0) {
    if (reportId === 'inventory-stock') {
      // Headers for inventory stock report
      const headers = ['Item Name', 'Category', 'Quantity', 'Unit', 'Branch', 'Warehouse'];
      excelData.push(headers);
      
      // Data rows
      rows.forEach(row => {
        excelData.push([
          row.inventory_item?.name || '-',
          row.inventory_item?.category || '-',
          row.qty ?? '-',
          row.inventory_item?.unit_measurement || '-',
          row.branch?.name || '-',
          row.warehouse?.name || '-'
        ]);
      });
    } else if (reportId === 'sales-summary') {
      // Headers for sales summary report
      const headers = ['Order ID', 'Total Amount', 'Status', 'Created At', 'Invoice Count'];
      excelData.push(headers);
      
      // Data rows
      rows.forEach(row => {
        excelData.push([
          row.id || '-',
          formatCurrency(parseFloat(row.total_amount) || 0),
          row.status || 'PENDING',
          row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A',
          (row.invoices && row.invoices.length) || 0
        ]);
      });
    } else {
      // Generic report structure
      excelData = [
        ['Report Information', ''],
        ['Report Type', getReportTitle(reportId)],
        ['Date Range', `${formatDate(dateFrom)} - ${formatDate(dateTo)}`],
        ['Generated At', formatDate(generatedAt)],
        ['', ''],
        ['Note', 'This is a placeholder report. Data will be populated when backend is implemented.']
      ];
    }
  } else {
    excelData = [
      ['Report Information', ''],
      ['Report Type', getReportTitle(reportId)],
      ['Date Range', `${formatDate(dateFrom)} - ${formatDate(dateTo)}`],
      ['Generated At', formatDate(generatedAt)],
      ['', ''],
      ['Status', 'No data available for this report.']
    ];
  }
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  
  // Set column widths
  const colWidths = [];
  if (reportId === 'inventory-stock') {
    colWidths.push({ wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 20 });
  } else if (reportId === 'sales-summary') {
    colWidths.push({ wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 12 });
  } else if (reportId === 'profit-loss') {
    colWidths.push({ wch: 35 }, { wch: 20 });
  } else {
    colWidths.push({ wch: 20 }, { wch: 30 });
  }
  worksheet['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Save the Excel file
  const fileName = `${getReportTitle(reportId).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Export to CSV
export const exportToCSV = (reportData) => {
  const { reportId, dateFrom, dateTo, generatedAt, rows, summary } = reportData;
  
  let csvContent = '';
  
  if (reportId === 'profit-loss' && summary) {
    csvContent = `Profit & Loss Summary\n`;
    csvContent += `\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Total Revenue,"${formatCurrency(summary.totalRevenue)}"\n`;
    csvContent += `Paid Revenue,"${formatCurrency(summary.paidRevenue)}"\n`;
    csvContent += `Unpaid Revenue,"${formatCurrency(summary.unpaidRevenue)}"\n`;
    csvContent += `Total Orders,"${summary.totalOrders?.toString() || '0'}"\n`;
    csvContent += `Paid Orders,"${summary.paidOrders?.toString() || '0'}"\n`;
    csvContent += `Pending Orders,"${summary.pendingOrders?.toString() || '0'}"\n`;
    csvContent += `Net Profit (Paid Revenue),"${formatCurrency(summary.netProfit)}"\n`;
    csvContent += `\n`;
    csvContent += `Profit & Loss Detail\n`;
    csvContent += `\n`;
    csvContent += `Order ID,Order Amount,Status,Paid Amount (Profit),Unpaid Amount (Loss),Created At\n`;
    
    // Add detailed data rows
    if (rows && rows.length > 0) {
      rows.forEach(order => {
        const invoices = order.invoices || [];
        const paidAmount = invoices
          .filter(inv => (inv.status || "").toLowerCase() === "paid")
          .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
        const unpaidAmount = invoices.length > 0
          ? invoices
              .filter(inv => (inv.status || "").toLowerCase() !== "paid")
              .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0)
          : parseFloat(order.total_amount) || 0;
        
        csvContent += `"${(order.id || '-').replace(/"/g, '""')}","${formatCurrency(parseFloat(order.total_amount) || 0)}","${(order.status || 'PENDING').replace(/"/g, '""')}","${formatCurrency(paidAmount)}","${formatCurrency(unpaidAmount)}","${(order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A').replace(/"/g, '""')}"\n`;
      });
    }
    
    csvContent += `\n`;
    csvContent += `Report Information,\n`;
    csvContent += `Date Range,"${formatDate(dateFrom)} - ${formatDate(dateTo)}"\n`;
    csvContent += `Generated At,"${formatDate(generatedAt)}"\n`;
  } else if (rows && rows.length > 0) {
    if (reportId === 'inventory-stock') {
      // Headers for inventory stock report
      const headers = ['Item Name', 'Category', 'Quantity', 'Unit', 'Branch', 'Warehouse'];
      csvContent += headers.join(',') + '\n';
      
      // Data rows
      rows.forEach(row => {
        const csvRow = [
          `"${(row.inventory_item?.name || '-').replace(/"/g, '""')}"`,
          `"${(row.inventory_item?.category || '-').replace(/"/g, '""')}"`,
          `"${(row.qty ?? '-')}"`,
          `"${(row.inventory_item?.unit_measurement || '-').replace(/"/g, '""')}"`,
          `"${(row.branch?.name || '-').replace(/"/g, '""')}"`,
          `"${(row.warehouse?.name || '-').replace(/"/g, '""')}"`
        ];
        csvContent += csvRow.join(',') + '\n';
      });
    } else if (reportId === 'sales-summary') {
      // Headers for sales summary report
      const headers = ['Order ID', 'Total Amount', 'Status', 'Created At', 'Invoice Count'];
      csvContent += headers.join(',') + '\n';
      
      // Data rows
      rows.forEach(row => {
        const csvRow = [
          `"${(row.id || '-').replace(/"/g, '""')}"`,
          `"${formatCurrency(parseFloat(row.total_amount) || 0)}"`,
          `"${(row.status || 'PENDING').replace(/"/g, '""')}"`,
          `"${(row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A').replace(/"/g, '""')}"`,
          `"${((row.invoices && row.invoices.length) || 0)}"`
        ];
        csvContent += csvRow.join(',') + '\n';
      });
    } else {
      // Generic report structure
      csvContent = `Report Information,Value\n`;
      csvContent += `Report Type,"${getReportTitle(reportId)}"\n`;
      csvContent += `Date Range,"${formatDate(dateFrom)} - ${formatDate(dateTo)}"\n`;
      csvContent += `Generated At,"${formatDate(generatedAt)}"\n`;
      csvContent += `\n`;
      csvContent += `Note,"This is a placeholder report. Data will be populated when backend is implemented."\n`;
    }
  } else {
    csvContent = `Report Information,Value\n`;
    csvContent += `Report Type,"${getReportTitle(reportId)}"\n`;
    csvContent += `Date Range,"${formatDate(dateFrom)} - ${formatDate(dateTo)}"\n`;
    csvContent += `Generated At,"${formatDate(generatedAt)}"\n`;
    csvContent += `\n`;
    csvContent += `Status,"No data available for this report."\n`;
  }
  
  // Create and download the CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `${getReportTitle(reportId).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, fileName);
};
