const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

function getMoneyFormatter(data) {
  const locale = data.locale || 'en-US';
  const currency = data.currency || 'USD';
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
  return (n) => formatter.format(n);
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

function drawTableRow(doc, x, y, columnWidths, item, formatMoney) {
  doc.font('Helvetica').fontSize(10);
  const qty = Number(item.quantity || 0);
  const unit = Number(item.unitPrice || 0);
  const cols = [
    String(item.description || ''),
    String(qty),
    formatMoney(unit),
    formatMoney(qty * unit || 0),
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

  // Optional logo
  if (vendor.logo && fs.existsSync(path.resolve(vendor.logo))) {
    try {
      doc.image(path.resolve(vendor.logo), 50, 40, { height: 40 });
    } catch (_) {
      // ignore invalid logo errors
    }
  }

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

function addItemsTable(doc, data, formatMoney) {
  const items = Array.isArray(data.items) ? data.items : [];
  const startY = 220;
  const x = 50;
  const colWidths = [260, 60, 100, 100];

  drawTableHeader(doc, x, startY, colWidths);
  let y = startY + 20;

  items.forEach((item) => {
    drawTableRow(doc, x, y, colWidths, item, formatMoney);
    y += 18;
  });

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.unitPrice || 0)), 0);

  // Discounts
  const discountRate = Number(data.discountRate || 0); // 0..1
  const discountAmountExplicit = Number(data.discountAmount || 0);
  const computedDiscount = discountRate > 0 ? subtotal * discountRate : 0;
  const discount = Math.max(computedDiscount, discountAmountExplicit, 0);

  const taxableBase = Math.max(subtotal - discount, 0);

  // Taxes: support array of { name, rate } or single taxRate
  let taxes = [];
  if (Array.isArray(data.taxes) && data.taxes.length) {
    taxes = data.taxes.map(t => ({
      name: t.name || 'Tax',
      rate: Number(t.rate || 0),
      amount: taxableBase * Number(t.rate || 0)
    }));
  } else {
    const taxRate = Number(data.taxRate || 0);
    taxes = taxRate ? [{ name: `Tax (${(taxRate * 100).toFixed(1)}%)`, rate: taxRate, amount: taxableBase * taxRate }] : [];
  }

  const taxTotal = taxes.reduce((s, t) => s + t.amount, 0);
  const total = taxableBase + taxTotal;

  const labelX = x + colWidths[0] + colWidths[1];
  const labelWidth = colWidths[2];
  const valueX = labelX + labelWidth;
  const valueWidth = colWidths[3];

  doc.moveDown(1);
  y += 10;
  doc.font('Helvetica').fontSize(10);
  doc.text('Subtotal', labelX, y, { width: labelWidth, align: 'right' });
  doc.text(formatMoney(subtotal), valueX, y, { width: valueWidth, align: 'right' });
  y += 16;

  if (discount > 0) {
    const discLabel = discountRate ? `Discount (${(discountRate * 100).toFixed(1)}%)` : 'Discount';
    doc.text(discLabel, labelX, y, { width: labelWidth, align: 'right' });
    doc.text(`- ${formatMoney(discount)}`, valueX, y, { width: valueWidth, align: 'right' });
    y += 16;
  }

  taxes.forEach(t => {
    const label = t.name || `Tax (${(t.rate * 100).toFixed(1)}%)`;
    doc.text(label, labelX, y, { width: labelWidth, align: 'right' });
    doc.text(formatMoney(t.amount), valueX, y, { width: valueWidth, align: 'right' });
    y += 16;
  });

  doc.font('Helvetica-Bold');
  doc.text('Total', labelX, y, { width: labelWidth, align: 'right' });
  doc.text(formatMoney(total), valueX, y, { width: valueWidth, align: 'right' });
}

function addFooter(doc, data) {
  const notes = data.notes || 'Thank you for your business!';
  doc.moveDown(2);
  doc.font('Helvetica').fontSize(10).text(notes, 50, 720, { align: 'center' });
}

function validateData(data) {
  if (!data) throw new Error('Missing invoice data');
  if (!Array.isArray(data.items)) throw new Error('\"items\" must be an array');
}

function generateInvoice(data, outputPath) {
  validateData(data);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);

    stream.on('finish', resolve);
    stream.on('error', reject);

    doc.pipe(stream);

    const formatMoney = getMoneyFormatter(data);

    addHeader(doc, data);
    addBillTo(doc, data);
    addItemsTable(doc, data, formatMoney);
    addFooter(doc, data);

    doc.end();
  });
}

module.exports = { generateInvoice };
