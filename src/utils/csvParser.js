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
    // Group by Txn
    const groups = {};

    rows.forEach(row => {
        const txn = row['Txn'];
        if (txn) {
            if (!groups[txn]) {
                groups[txn] = [];
            }
            groups[txn].push(row);
        }
    });

    const checks = [];

    Object.values(groups).forEach(groupRows => {
        // Find header (has Payee Name or Bank Account)
        // Heuristic: The row with Payee Name is the header.
        const header = groupRows.find(r => r['Payee Name'] && r['Payee Name'].trim() !== '') || groupRows[0];

        if (!header) return;

        const checkNum = (header['Check #'] || '').trim();

        // Filter for actual check numbers (digits only)
        if (!/^\d+$/.test(checkNum)) {
            return;
        }

        const checkData = {
            id: header['Txn'], // Use Txn as ID
            checkNumber: checkNum,
            date: header['Check Date'],
            payee: header['Payee Name'],
            amount: header['Payment Amount'],
            memo: header['Check Memo'],
            properties: [],
            status: 'unknown' // Default status
        };

        // Find splits (rows with 'Property Name')
        groupRows.forEach(row => {
            const propName = row['Property Name'];
            if (propName) {
                checkData.properties.push({
                    name: propName,
                    amount: row['Amount'],
                    glName: row['GL Account Name'],
                    description: row['Description']
                });
            }
        });

        // Sort splits slightly? No, keeping order is fine.

        checks.push(checkData);
    });

    // Sort checks by number
    checks.sort((a, b) => {
        const numA = parseInt(a.checkNumber, 10) || 0;
        const numB = parseInt(b.checkNumber, 10) || 0;
        return numA - numB;
    });

    return checks;
};
