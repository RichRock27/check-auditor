import Papa from 'papaparse';
import { getDecision, getDecisions } from './storage';

export const parseCheckRegister = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    // Check if this is a Decision Import file
                    const firstRow = results.data[0];
                    if (firstRow && (firstRow['Decision'] || firstRow['decision'])) {
                        // This is a decisions file!
                        const count = importDecisionsFromCSV(results.data);
                        resolve({ isDecisionImport: true, count });
                        return;
                    }

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

const importDecisionsFromCSV = (rows) => {
    let count = 0;

    const labelToId = {
        'MAIL Physical Check': 'mail',
        'Check Sent': 'check_sent',
        'NEEDS ACH Payment': 'pay_ach',
        'PAID via ACH': 'void_paid',
        'DUPLICATE - Void & Reverse': 'duplicate',
        'Amount Adjustment Needed': 'adj_needed',
        'Unknown': 'unknown'
    };

    // BATCH UPDATE: Read once, write once
    const decisions = getDecisions();

    rows.forEach(row => {
        // Aggressively trim inputs
        const checkNum = String(row['Check #'] || row['checkNumber'] || '').trim();
        const decisionLabel = String(row['Decision'] || row['decision'] || '').trim();

        if (checkNum && decisionLabel) {
            const statusId = labelToId[decisionLabel] || 'unknown';

            decisions[checkNum] = {
                status: statusId,
                timestamp: new Date().toISOString()
            };
            count++;
        }
    });

    // Write back to storage
    localStorage.setItem('check_auditor_decisions', JSON.stringify(decisions));
    console.log(`Imported ${count} decisions. Storage now has ${Object.keys(decisions).length} items.`);

    return count;
};

const processRows = (rows) => {
    const checks = [];
    let currentCheck = null;

    rows.forEach((row, index) => {
        const checkNumInRow = String(row['Check #'] || '').trim();
        const payeeInRow = (row['Payee Name'] || '').trim();

        // Heuristic: It's a new check if we have a Check Number OR Payee Name (and it's not just a blank line)
        const isHeaderRow = checkNumInRow.length > 0 || payeeInRow.length > 0;

        if (isHeaderRow) {
            // Save previous check if it was valid (had a real check number)
            if (currentCheck && isValidCheck(currentCheck.checkNumber)) {
                checks.push(currentCheck);
            }

            // Start new check
            currentCheck = {
                id: `row-${index}`,
                checkNumber: checkNumInRow,
                date: row['Check Date'],
                payee: payeeInRow,
                amount: row['Payment Amount'],
                memo: row['Check Memo'],
                properties: [],
                status: 'unknown',
                isPreviouslyReviewed: false
            };

            // Load previous decision if exists
            const previousDecision = getDecision(checkNumInRow);

            if (previousDecision) {
                console.log(`MATCH FOUND for check ${checkNumInRow}:`, previousDecision);
                currentCheck.status = previousDecision.status;
                currentCheck.isPreviouslyReviewed = true;
                currentCheck.reviewedAt = previousDecision.timestamp;
            }
        }

        // If it's a split (Property Name is present), add to current check
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
