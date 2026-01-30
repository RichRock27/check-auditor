import Papa from 'papaparse';

export const parseCheckRegister = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const checks = processRows(results.data);
                    resolve(checks);
                } catch (err) {
                    reject(err);
                }
            },
            error: (err) => {
                reject(err);
            }
        });
    });
};

const processRows = (rows) => {
    const checks = [];
    let currentCheck = null;

    rows.forEach((row, index) => {
        // Identify a "Header" row vs a "Split" row
        // In the new format, Header rows have values in 'Check #' or 'Payee Name'
        // Split rows have those empty, but have 'Property Name'

        // Some header rows might also have the first split on the SAME line? 
        // Looking at the sample:
        // Line 16 (header): ... "24,547.85","","","" ... Property Name is empty.
        // Line 3 (header): ... Property Name is empty.
        // So Header rows are distinct from Split rows in this export.

        const checkNumInRow = (row['Check #'] || '').trim();
        const payeeInRow = (row['Payee Name'] || '').trim();

        // Heuristic: It's a new check if we have a Check Number OR Payee Name (and it's not just a blank line)
        // Sometimes Check # is 'ONLINE TRANSFER', so we filter later.
        const isHeaderRow = checkNumInRow.length > 0 || payeeInRow.length > 0;

        if (isHeaderRow) {
            // Save previous check if it was valid (had a real check number)
            if (currentCheck && isValidCheck(currentCheck.checkNumber)) {
                checks.push(currentCheck);
            } else if (currentCheck) {
                // It was a non-check transaction (e.g. online transfer), we skip it based on user rules
                // But wait, the user wants us to filter for *actual* check numbers.
                // We'll accumulate everything and filter at the end or push conditionally.
            }

            // Start new check
            currentCheck = {
                id: `row-${index}`, // fallback ID since Txn is gone
                checkNumber: checkNumInRow,
                date: row['Check Date'],
                payee: payeeInRow,
                amount: row['Payment Amount'],
                memo: row['Check Memo'],
                properties: [],
                status: 'unknown'
            };
        }

        // If it's a split (Property Name is present), add to current check
        // Note: The header row usually has empty Property Name, but if it HAD one, we'd want to capture it too.
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

    // Push the final check
    if (currentCheck && isValidCheck(currentCheck.checkNumber)) {
        checks.push(currentCheck);
    }

    // Final Sort
    checks.sort((a, b) => {
        const numA = parseInt(a.checkNumber, 10) || 0;
        const numB = parseInt(b.checkNumber, 10) || 0;
        return numA - numB;
    });

    return checks;
};

const isValidCheck = (checkNum) => {
    if (!checkNum) return false;
    // User only wants physical checks (digits), not "ONLINE TRANSFER" or "ACH Batch"
    return /^\d+$/.test(checkNum);
};
