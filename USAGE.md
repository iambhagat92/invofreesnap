# Usage

This project provides a simple Node.js CLI to generate invoice PDFs from a JSON file.

## Quickstart

From the repository root:

- Using the sample data:

  node "invofreesnap\bin\invoicegen.js" --input "invofreesnap\sample_invoice.json" --output "invofreesnap\invoice.pdf"

- Using your own JSON:

  node "invofreesnap\bin\invoicegen.js" --input "path\to\your_invoice.json" --output "invofreesnap\invoice.pdf"

## JSON schema

Top-level fields supported:
- invoiceNumber: string
- date: string (e.g., 2025-09-27)
- vendor: { name, address, email, phone, logo? }
- billTo: { name, address, email, phone }
- items: array of { description, quantity, unitPrice }
- taxes?: array of { name?, rate } (rate in 0..1)
- taxRate?: number (fallback if taxes array is not provided)
- discountRate?: number (0..1)
- discountAmount?: number (absolute)
- currency?: string (ISO code, default USD)
- locale?: string (BCP-47, default en-US)
- notes?: string

Example:

{
  "invoiceNumber": "INV-1001",
  "date": "2025-09-27",
  "vendor": {
    "name": "InvoFreeSnap Inc.",
    "address": "123 Example St",
    "email": "billing@example.com",
    "phone": "+1 555-123-4567",
    "logo": "./logo.png"
  },
  "billTo": { "name": "Acme Corp.", "address": "456 Client Ave", "email": "ap@acme.com", "phone": "+1 555-987-6543" },
  "items": [
    { "description": "Design services", "quantity": 10, "unitPrice": 50 },
    { "description": "Hosting (monthly)", "quantity": 1, "unitPrice": 25 }
  ],
  "discountRate": 0.05,
  "taxes": [ { "name": "VAT", "rate": 0.08 }, { "name": "Service Tax", "rate": 0.02 } ],
  "currency": "USD",
  "locale": "en-US",
  "notes": "Thanks for your business!"
}
