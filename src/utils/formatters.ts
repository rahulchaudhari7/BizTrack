import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import NepaliDate from 'nepali-date-converter';

/**
 * Format amounts using Nepal's customary comma system:
 * e.g., 500 -> 500, 1500 -> 1,500, 25000 -> 25,000, 150000 -> 1,50,000, 2500000 -> 25,00,000
 */
export function formatNepalNumber(num: number): string {
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const fixed = absNum.toFixed(2);
  const [intPart, decPart] = fixed.split('.');

  if (intPart.length <= 3) {
    const formatted = intPart + (Number(decPart) > 0 ? `.${decPart}` : '');
    return isNegative ? `-${formatted}` : formatted;
  }

  const lastThree = intPart.substring(intPart.length - 3);
  const remaining = intPart.substring(0, intPart.length - 3);

  // Group by 2 digits for remaining
  const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const result = `${formattedRemaining},${lastThree}${Number(decPart) > 0 ? `.${decPart}` : ''}`;

  return isNegative ? `-${result}` : result;
}

export function formatCurrency(amount: number | undefined | null, symbol: string = 'रु'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${symbol} 0`;
  }
  const formatted = formatNepalNumber(amount);
  return amount < 0 ? `-${symbol} ${formatted.replace('-', '')}` : `${symbol} ${formatted}`;
}

export function toBSDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    // @ts-ignore
    const nepDate = new (NepaliDate.default || NepaliDate)(d);
    return `${nepDate.format('YYYY-MM-DD')} BS`;
  } catch (err) {
    return '';
  }
}

export function formatDate(dateStr: string | Date | undefined, includeBS: boolean = false): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';

  const adDate = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (includeBS) {
    const bs = toBSDate(d);
    return bs ? `${adDate} (${bs})` : adDate;
  }

  return adDate;
}

export function formatDateTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function exportToCSV(rows: Array<Record<string, any>>, filename: string): void {
  if (!rows || !rows.length) {
    alert('No data to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          let val = row[header];
          if (val === null || val === undefined) val = '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate official Nepal Tax Invoice PDF
 */
export function generateInvoicePDF(business: any, sale: any): void {
  const doc = new jsPDF();
  const currencySymbol = business?.currencySymbol || 'रु';

  const dateAD = formatDate(sale.saleDate);
  const dateBS = toBSDate(sale.saleDate);

  // Business Header
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(business?.businessName || 'BizTrack Business', 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(business?.fullAddress || `${business?.municipality || 'Kathmandu'}, ${business?.province || 'Nepal'}`, 14, 26);
  doc.text(`Phone: ${business?.phone || '-'} | Email: ${business?.email || '-'}`, 14, 31);
  if (business?.panNumber) {
    doc.text(`PAN / TPID: ${business.panNumber} ${business?.vatEnabled ? `| VAT No: ${business.vatNumber || business.panNumber}` : ''}`, 14, 36);
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  // INVOICE Title Badge
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text(business?.vatEnabled ? 'TAX INVOICE' : 'INVOICE / BILL', 14, 48);

  // Invoice Meta
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Invoice No: ${sale.invoiceNumber || 'INV-001'}`, 130, 48);
  doc.text(`Date (AD): ${dateAD}`, 130, 53);
  if (dateBS) {
    doc.text(`Date (BS): ${dateBS}`, 130, 58);
  }

  // Customer Details Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 52, 110, 26, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO:', 17, 57);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(sale.customerName || 'Walk-in Customer', 17, 63);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  if (sale.customerPhone) doc.text(`Phone: ${sale.customerPhone}`, 17, 68);
  if (sale.customerPan) doc.text(`Buyer PAN: ${sale.customerPan}`, 17, 73);
  if (sale.customerAddress) doc.text(`Address: ${sale.customerAddress}`, 17, 78);

  // Items Table
  const tableData = [
    [
      '1',
      sale.productName,
      `${sale.quantity} ${sale.unit || 'Piece'}`,
      formatCurrency(sale.sellingPrice, currencySymbol),
      sale.discount > 0 ? formatCurrency(sale.discount, currencySymbol) : '0',
      formatCurrency(sale.subtotal, currencySymbol),
    ],
  ];

  autoTable(doc, {
    startY: 84,
    head: [['S.N.', 'Item / Description', 'Quantity', 'Rate', 'Discount', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 36, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Payment Status & Totals Summary
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Method: ${sale.paymentMethod || 'Cash'}`, 14, finalY + 4);
  doc.text(`Payment Status: ${sale.paymentStatus || 'Paid'}`, 14, finalY + 9);
  if (sale.notes) doc.text(`Notes: ${sale.notes}`, 14, finalY + 14);

  // Financial Breakdown
  const rightX = 130;
  const valueX = 196;

  doc.text('Subtotal:', rightX, finalY + 4);
  doc.text(formatCurrency(sale.subtotal, currencySymbol), valueX, finalY + 4, { align: 'right' });

  if (sale.isVatApplicable && sale.vatAmount > 0) {
    doc.text(`VAT (${sale.vatRate || 13}%):`, rightX, finalY + 9);
    doc.text(formatCurrency(sale.vatAmount, currencySymbol), valueX, finalY + 9, { align: 'right' });
  }

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total:', rightX, finalY + 16);
  doc.text(formatCurrency(sale.totalAmount, currencySymbol), valueX, finalY + 16, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Amount Received:', rightX, finalY + 22);
  doc.text(formatCurrency(sale.amountPaid, currencySymbol), valueX, finalY + 22, { align: 'right' });

  if (sale.amountDue > 0) {
    doc.setTextColor(225, 29, 72);
    doc.text('Remaining Due:', rightX, finalY + 28);
    doc.text(formatCurrency(sale.amountDue, currencySymbol), valueX, finalY + 28, { align: 'right' });
  }

  // Footer
  const footerY = 270;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Thank you for your business!', 105, footerY, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Computer Generated Invoice • BizTrack Nepal', 105, footerY + 5, { align: 'center' });

  doc.save(`${sale.invoiceNumber || 'invoice'}.pdf`);
}

/**
 * Generate Comprehensive Nepal Business Financial PDF Report
 */
export function generateFinancialPDFReport(
  business: any,
  summary: any,
  monthlyData: any[],
  categories: any[],
  topProducts: any[]
): void {
  const doc = new jsPDF();
  const currencySymbol = business?.currencySymbol || 'रु';
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const todayBS = toBSDate(new Date());

  // Header Title
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text(business?.businessName || 'BizTrack Business', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Financial Performance & Profit Analysis Report`, 14, 26);
  doc.text(`Date: ${today} (${todayBS}) | Base: ${business?.municipality || 'Kathmandu'}, Nepal`, 14, 32);

  // Financial Summary Cards Section
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Key Financial Summary', 14, 42);

  const summaryData = [
    ['Total Sales', formatCurrency(summary.totalSales || summary.totalIncome, currencySymbol)],
    ['Business Operating Expenses', formatCurrency(summary.businessExpenses, currencySymbol)],
    ['Cost of Goods Sold (Purchases)', formatCurrency(summary.purchaseCosts, currencySymbol)],
    ['Personal Expenses (Non-Business)', formatCurrency(summary.personalExpenses, currencySymbol)],
    [
      'Net Profit / (Loss)',
      `${summary.isProfit ? '+' : '-'}${formatCurrency(summary.isProfit ? summary.netProfit : summary.netLoss, currencySymbol)}`,
    ],
    ['Profit Margin', `${summary.profitMargin || 0}%`],
    ['Accounts Receivable (Customer Due)', formatCurrency(summary.outstandingReceivables || 0, currencySymbol)],
    ['Accounts Payable (Supplier Due)', formatCurrency(summary.outstandingPayables || 0, currencySymbol)],
    ['Current Stock Valuation', formatCurrency(summary.currentStockValue || 0, currencySymbol)],
  ];

  if (summary.vatEnabled) {
    summaryData.push(['VAT Collected', formatCurrency(summary.vatCollected || 0, currencySymbol)]);
  }

  autoTable(doc, {
    startY: 46,
    head: [['Financial Metric', 'Amount (रु NPR)']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 14, right: 14 },
  });

  // Monthly Breakdown Section
  let currentY = (doc as any).lastAutoTable.finalY + 12;

  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Monthly Financial Trends', 14, currentY);

  const monthlyRows = (monthlyData || []).map((m) => [
    m.label,
    formatCurrency(m.income, currencySymbol),
    formatCurrency(m.businessExpense, currencySymbol),
    formatCurrency(m.purchaseCost, currencySymbol),
    formatCurrency(m.netProfit, currencySymbol),
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Month', 'Income', 'Business Exp', 'Stock Cost', 'Net Profit']],
    body: monthlyRows,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: 14, right: 14 },
  });

  // Top Products Section
  currentY = (doc as any).lastAutoTable.finalY + 12;
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Product Performance & Inventory Stock', 14, currentY);

  const productRows = (topProducts || []).slice(0, 10).map((p) => [
    p.name,
    `${p.currentStock} ${p.unit || 'units'}`,
    p.totalUnitsSold.toString(),
    formatCurrency(p.totalRevenue, currencySymbol),
    formatCurrency(p.totalProfit, currencySymbol),
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Product Name', 'Current Stock', 'Sold', 'Revenue', 'Profit']],
    body: productRows.length ? productRows : [['No products sold yet', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${(business?.businessName || 'biztrack').toLowerCase().replace(/\s+/g, '_')}_nepal_report.pdf`);
}
