// Script to import previous check decisions from CSV export
// This reads the check register CSV and imports all checks as "previously reviewed"

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvPath = path.join(__dirname, 'data/imports/check_register_detail_enhanced-20260202 (3).csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n');
const checkMap = new Map();

// Skip header (line 0) and empty lines
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma (basic - doesn't handle quoted commas perfectly but should work)
    const cols = line.split(',');
    const checkNum = cols[2] ? cols[2].replace(/"/g, '').trim() : '';

    // Skip empty check numbers or header rows
    if (!checkNum || checkNum === 'Check #') continue;

    // Determine status based on check number format
    let status;
    if (checkNum.includes('ACH') || checkNum.includes('online') || checkNum.includes('ONLINE')) {
        status = 'ach'; // PAID via ACH
    } else if (checkNum.match(/^\d+$/)) {
        status = 'mail'; // Physical check number
    } else {
        status = 'ach'; // Default to ACH for other payment types
    }

    // Store unique checks
    if (!checkMap.has(checkNum)) {
        checkMap.set(checkNum, {
            checkNumber: checkNum,
            status: status,
            timestamp: new Date().toISOString()
        });
    }
}

// Convert to decisions object format
const decisions = {};
for (const [checkNum, data] of checkMap) {
    decisions[checkNum] = {
        status: data.status,
        timestamp: data.timestamp
    };
}

// Output the decisions in localStorage format
console.log('=== IMPORT DECISIONS ===');
console.log(`Total unique checks found: ${Object.keys(decisions).length}`);
console.log('\nDecisions object (copy this to import):');
console.log(JSON.stringify(decisions, null, 2));

// Also save to a file
const outputPath = path.join(__dirname, 'data/imports/decisions_import.json');
fs.writeFileSync(outputPath, JSON.stringify(decisions, null, 2));
console.log(`\n✅ Saved to: ${outputPath}`);
console.log('\nTo import these decisions:');
console.log('1. Open Check Auditor in your browser');
console.log('2. Open browser console (F12)');
console.log('3. Run: localStorage.setItem("check_auditor_decisions", ' + "'" + JSON.stringify(decisions) + "')");
console.log('\nOr use the Import feature in the app if it accepts JSON files.');
