const fs = require('fs');
const PDFDocument = require('pdfkit');

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function drawTableHeader(doc, x, y, columnWidths) {
  doc.font('Helvetica-Bold').fontSize(10);
  const headers = ['Description', 'Qty', 'Unit Price', 'Amount'];
  let cx = x;
  headers.forEach((h, i) => {
    doc.text(h, cx, y, { width: columnWidths[i], continued: false });
    cx += columnWidths[i];
  });
  doc.moveTo(x, y + 14).lineTo(x + columnWidths.reduce((a, b) => a + b, 0), y + 14).stroke();
}

function drawTableRow(doc, x, y, columnWidths, item) {
  doc.font('Helvetica').fontSize(10);
  const cols = [
    String(item.description || ''),
    String(item.quantity || 0),
    formatCurrency(Number(item.unitPrice || 0)),
    formatCurrency((Number(item.quantity || 0) * Number(item.unitPrice || 0)) || 0),
  ];
  let cx = x;
  cols.forEach((val, i) => {
    const align = i >= 1 ? 'right' : 'left';
    doc.text(val, cx, y, { width: columnWidths[i], align });
    cx += columnWidths[i];
  });
}

function addHeader(doc, data) {
  const vendor = data.vendor || {};
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(24).text('INVOICE', { align: 'right' });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold').text(vendor.name || 'Vendor', 50, 50);
  doc.font('Helvetica').fontSize(10);
  if (vendor.address) doc.text(vendor.address);
  if (vendor.email) doc.text(vendor.email);
  if (vendor.phone) doc.text(vendor.phone);

  const invNum = data.invoiceNumber || 'N/A';
  const invDate = data.date || new Date().toISOString().slice(0, 10);
  doc.font('Helvetica').fontSize(10).text(`Invoice #: ${invNum}`, 400, 90, { align: 'left' });
  doc.text(`Date: ${invDate}`, 400, 105, { align: 'left' });
}

function addBillTo(doc, data) {
  const billTo = data.billTo || {};
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(12).text('Bill To', 50, 150);
  doc.font('Helvetica').fontSize(10);
  doc.text(billTo.name || '');
  if (billTo.address) doc.text(billTo.address);
  if (billTo.email) doc.text(billTo.email);
  if (billTo.phone) doc.text(billTo.phone);
}

function addItemsTable(doc, data) {
  const items = Array.isArray(data.items) ? data.items : [];
  const startY = 220;
  const x = 50;
  const colWidths = [260, 60, 100, 100];

  drawTableHeader(doc, x, startY, colWidths);
  let y = startY + 20;

  items.forEach((item) => {
    drawTableRow(doc, x, y, colWidths, item);
    y += 18;
  });

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.unitPrice || 0)), 0);
  const taxRate = Number(data.taxRate || 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const rightX = x + colWidths[0] + colWidths[1] + colWidths[2];
  const lineWidth = colWidths[3];

  doc.moveDown(1);
  y += 10;
  doc.font('Helvetica').fontSize(10);
  doc.text('Subtotal', rightX, y, { width: lineWidth, align: 'right' });
  doc.text(formatCurrency(subtotal), rightX, y, { width: lineWidth, align: 'right' });
  y += 16;
  doc.text(`Tax (${(taxRate * 100).toFixed(1)}%)`, rightX, y, { width: lineWidth, align: 'right' });
  doc.text(formatCurrency(tax), rightX, y, { width: lineWidth, align: 'right' });
  y += 16;
  doc.font('Helvetica-Bold');
  doc.text('Total', rightX, y, { width: lineWidth, align: 'right' });
  doc.text(formatCurrency(total), rightX, y, { width: lineWidth, align: 'right' });
}

function addFooter(doc, data) {
  const notes = data.notes || 'Thank you for your business!';
  doc.moveDown(2);
  doc.font('Helvetica').fontSize(10).text(notes, 50, 720, { align: 'center' });
}

function validateData(data) {
  if (!data) throw new Error('Missing invoice data');
  if (!Array.isArray(data.items)) throw new Error('"items" must be an array');
}

function generateInvoice(data, outputPath) {
  validateData(data);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);

    stream.on('finish', resolve);
    stream.on('error', reject);

    doc.pipe(stream);

    addHeader(doc, data);
    addBillTo(doc, data);
    addItemsTable(doc, data);
    addFooter(doc, data);

    doc.end();
  });
}

module.exports = { generateInvoice };
