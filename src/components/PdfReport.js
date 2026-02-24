import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Minimal PDF generator using jspdf
export const generateExecutiveReport = (executive, performance) => {
  const doc = new jsPDF();
  appendExecutiveReport(doc, executive, performance, true);
  return doc;
};

// Append an executive's report pages to an existing jsPDF instance.
export const appendExecutiveReport = (doc, executive, performance, addCover = false) => {
  if (!doc) return;

  // Page 1 - Cover (optional)
  if (addCover) {
    doc.setFontSize(20);
    doc.text('Company Logo', 14, 20);
    doc.setFontSize(12);
    doc.text('Company Motto: Excellence in Collections', 14, 30);
    doc.setFontSize(14);
    doc.text(`Executive: ${executive.firstName || ''} ${executive.lastName || ''}`, 14, 44);
    doc.addPage();
  }

  // Overall summary
  doc.setFontSize(16);
  doc.text('Overall Performance Summary', 14, 20);
  const rows = [
    ['Total POS', `₹${(performance.totalPOS || 0).toLocaleString()}`],
    ['Total Cases', performance.totalCases || 0],
    ['Total Paid Cases', performance.totalPaidCases || 0],
    ['Total RB Cases', performance.rbCount || 0],
    ['Total Norm Cases', performance.normCount || 0],
  ];
  autoTable(doc, { startY: 36, head: [['Metric', 'Value']], body: rows });
  doc.addPage();

  // Banks
  (performance.bankBreakdown || []).forEach((bank, idx) => {
    if (!addCover && idx === 0 && doc.internal.getNumberOfPages() > 0) {
      // if not adding cover and doc already has pages, add a new one
      doc.addPage();
    }
    doc.setFontSize(14);
    doc.text(`Bank: ${bank.bankName}`, 14, 20);
    autoTable(doc, { startY: 28, head: [['Metric', 'Value']], body: [
      ['Total Cases', bank.totalCases || 0],
      ['Resolved', bank.resolvedCount || 0],
      ['RB', bank.rbCount || 0],
      ['Norm', bank.normCount || 0],
    ] });

    // Products table
    const prodBody = [];
    (bank.products || []).forEach(p => {
      prodBody.push([
        p.productName || '-',
        p.totalCases || 0,
        `₹${(p.totalPOS || 0).toLocaleString()}`,
        `${((p.countNotFlowRate || 0) * 100).toFixed(1)}%`,
        `${((p.posNotFlowRate || 0) * 100).toFixed(1)}%`,
      ]);
    });

    autoTable(doc, { startY: doc.autoTable ? doc.autoTable.previous.finalY + 8 : 60, head: [['Product', 'Cases', 'POS', 'Count % Not Flow', 'POS % Not Flow']], body: prodBody });
    doc.addPage();
  });
};
