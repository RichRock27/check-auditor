import fs from 'fs';
import Papa from 'papaparse';

const fileContent = fs.readFileSync('/Users/richgreen/.gemini/antigravity/scratch/_ACTIVE_PROJECTS/Check Register/check_register_detail_enhanced-20260129.csv', 'utf8');

Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
        console.log("Parsed rows:", results.data.length);
        console.log("First row keys:", Object.keys(results.data[0]));
        console.log("Sample row 0:", results.data[0]);
        console.log("Sample row 2 (should be first transaction):", results.data[1]); // Row 1 in file is empty, skipped?

        const checks = processRows(results.data);
        console.log("Processed checks count:", checks.length);
        if (checks.length > 0) {
            console.log("First check:", JSON.stringify(checks[0], null, 2));
        } else {
            // Debug why
            console.log("No checks found. Dumping first 5 raw rows to inspect:");
            results.data.slice(0, 5).forEach(r => console.log(r));
        }
    }
});

const processRows = (rows) => {
    const checks = [];
    let currentCheck = null;

    rows.forEach((row, index) => {
        const checkNumInRow = (row['Check #'] || '').trim();
        const payeeInRow = (row['Payee Name'] || '').trim();

        const isHeaderRow = checkNumInRow.length > 0 || payeeInRow.length > 0;

        if (isHeaderRow) {
            if (currentCheck && isValidCheck(currentCheck.checkNumber)) {
                checks.push(currentCheck);
            }
            currentCheck = {
                id: `row-${index}`,
                checkNumber: checkNumInRow,
                date: row['Check Date'],
                payee: payeeInRow,
                amount: row['Payment Amount'],
                memo: row['Check Memo'],
                properties: [],
                status: 'unknown'
            };
        }

        // Split logic
        const propName = (row['Property Name'] || '').trim();
        if (currentCheck && propName.length > 0) {
            currentCheck.properties.push({
                name: propName,
                amount: row['Amount'], // Split amount
                glName: row['GL Account Name'],
                description: row['Description']
            });
        }
    });

    if (currentCheck && isValidCheck(currentCheck.checkNumber)) {
        checks.push(currentCheck);
    }

    // Sort
    checks.sort((a, b) => {
        const numA = parseInt(a.checkNumber, 10) || 0;
        const numB = parseInt(b.checkNumber, 10) || 0;
        return numA - numB;
    });

    return checks;
};

const isValidCheck = (checkNum) => {
    if (!checkNum) return false;
    return /^\d+$/.test(checkNum);
};
