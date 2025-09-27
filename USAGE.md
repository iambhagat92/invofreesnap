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
- vendor: { name, address, email, phone }
- billTo: { name, address, email, phone }
- items: array of { description, quantity, unitPrice }
- taxRate: number (e.g., 0.1 for 10%)
- notes: string

Example:

{
  "invoiceNumber": "INV-1001",
  "date": "2025-09-27",
  "vendor": { "name": "InvoFreeSnap Inc.", "address": "123 Example St", "email": "billing@example.com", "phone": "+1 555-123-4567" },
  "billTo": { "name": "Acme Corp.", "address": "456 Client Ave", "email": "ap@acme.com", "phone": "+1 555-987-6543" },
  "items": [ { "description": "Design services", "quantity": 10, "unitPrice": 50 }, { "description": "Hosting (monthly)", "quantity": 1, "unitPrice": 25 } ],
  "taxRate": 0.1,
  "notes": "Thanks for your business!"
}
