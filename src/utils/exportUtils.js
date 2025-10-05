import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString();
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
  const { reportId, dateFrom, dateTo, department, region, columns, generatedAt, rows } = reportData;
  
  const doc = new jsPDF();
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
  doc.text(`Department: ${department}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Region: ${region}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Columns: ${columns.join(', ')}`, 20, yPosition);
  
  // Add some space before table
  yPosition += 15;
  
  if (rows && rows.length > 0) {
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
    } else {
      // Generic report structure
      tableColumns.push(
        { title: 'Field', dataKey: 'field' },
        { title: 'Value', dataKey: 'value' }
      );
      
      tableRows.push(
        { field: 'Report Type', value: getReportTitle(reportId) },
        { field: 'Date Range', value: `${formatDate(dateFrom)} - ${formatDate(dateTo)}` },
        { field: 'Department', value: department },
        { field: 'Region', value: region },
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
  const { reportId, dateFrom, dateTo, department, region, columns, generatedAt, rows } = reportData;
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for Excel
  let excelData = [];
  let sheetName = getReportTitle(reportId);
  
  if (rows && rows.length > 0) {
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
    } else {
      // Generic report structure
      excelData = [
        ['Report Information', ''],
        ['Report Type', getReportTitle(reportId)],
        ['Date Range', `${formatDate(dateFrom)} - ${formatDate(dateTo)}`],
        ['Department', department],
        ['Region', region],
        ['Generated At', formatDate(generatedAt)],
        ['Columns', columns.join(', ')],
        ['', ''],
        ['Note', 'This is a placeholder report. Data will be populated when backend is implemented.']
      ];
    }
  } else {
    excelData = [
      ['Report Information', ''],
      ['Report Type', getReportTitle(reportId)],
      ['Date Range', `${formatDate(dateFrom)} - ${formatDate(dateTo)}`],
      ['Department', department],
      ['Region', region],
      ['Generated At', formatDate(generatedAt)],
      ['Columns', columns.join(', ')],
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
  const { reportId, dateFrom, dateTo, department, region, columns, generatedAt, rows } = reportData;
  
  let csvContent = '';
  
  if (rows && rows.length > 0) {
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
    } else {
      // Generic report structure
      csvContent = `Report Information,Value\n`;
      csvContent += `Report Type,"${getReportTitle(reportId)}"\n`;
      csvContent += `Date Range,"${formatDate(dateFrom)} - ${formatDate(dateTo)}"\n`;
      csvContent += `Department,"${department}"\n`;
      csvContent += `Region,"${region}"\n`;
      csvContent += `Generated At,"${formatDate(generatedAt)}"\n`;
      csvContent += `Columns,"${columns.join(', ')}"\n`;
      csvContent += `\n`;
      csvContent += `Note,"This is a placeholder report. Data will be populated when backend is implemented."\n`;
    }
  } else {
    csvContent = `Report Information,Value\n`;
    csvContent += `Report Type,"${getReportTitle(reportId)}"\n`;
    csvContent += `Date Range,"${formatDate(dateFrom)} - ${formatDate(dateTo)}"\n`;
    csvContent += `Department,"${department}"\n`;
    csvContent += `Region,"${region}"\n`;
    csvContent += `Generated At,"${formatDate(generatedAt)}"\n`;
    csvContent += `Columns,"${columns.join(', ')}"\n`;
    csvContent += `\n`;
    csvContent += `Status,"No data available for this report."\n`;
  }
  
  // Create and download the CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `${getReportTitle(reportId).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, fileName);
};
