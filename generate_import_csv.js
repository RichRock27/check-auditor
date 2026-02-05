import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the previously parsed decisions
const decisionsPath = path.join(__dirname, 'data/imports/decisions_import.json');
let decisions = {};

try {
    const jsonContent = fs.readFileSync(decisionsPath, 'utf-8');
    decisions = JSON.parse(jsonContent);
} catch (e) {
    console.error("Could not read decisions file, checking CSV directly...");
    process.exit(1);
}

// Map internal status codes to the LABELS the app expects
const statusMap = {
    'ach': 'PAID via ACH',
    'mail': 'MAIL Physical Check'
};

// Create CSV content
const headers = 'Check #,Decision';
const rows = Object.values(decisions).map(d => {
    // Map 'ach' to the actual label used in the app
    const statusLabel = statusMap[d.status] || 'Unknown';
    return `"${d.checkNumber}","${statusLabel}"`;
});

const csvContent = [headers, ...rows].join('\n');

// Save the file
const outputPath = path.join(__dirname, 'data/imports/previous_decisions.csv');
fs.writeFileSync(outputPath, csvContent);

console.log(`✅ Generated importable CSV: ${outputPath}`);
