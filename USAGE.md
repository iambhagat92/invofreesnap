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


Example:

{
  "invoiceNumber": "INV-1001",
  "date": "2025-09-27",

  "notes": "Thanks for your business!"
}
