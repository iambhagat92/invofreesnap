#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { generateInvoice } = require('../src/generateInvoice');

(async () => {
  try {
    const argv = yargs(hideBin(process.argv))
      .usage('Usage: $0 --input input.json --output invoice.pdf')
      .option('input', {
        alias: 'i',
        type: 'string',
        describe: 'Path to invoice JSON file',
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        describe: 'Path for output PDF file',
      })
      .help()
      .argv;

    const defaultInput = path.resolve(__dirname, '..', 'sample_invoice.json');
    const inputPath = argv.input ? path.resolve(process.cwd(), argv.input) : defaultInput;

    if (!fs.existsSync(inputPath)) {
      console.error(`Input file not found: ${inputPath}`);
      process.exit(1);
    }

    const outDefault = path.resolve(process.cwd(), 'invoice.pdf');
    const outputPath = argv.output ? path.resolve(process.cwd(), argv.output) : outDefault;

    const raw = fs.readFileSync(inputPath, 'utf8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error('Invalid JSON in input file.');
      process.exit(1);
    }

    await generateInvoice(data, outputPath);
    console.log(`Invoice generated: ${outputPath}`);
  } catch (err) {
    console.error('Error generating invoice:', err.message || err);
    process.exit(1);
  }
})();
