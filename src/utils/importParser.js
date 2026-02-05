// Parse HTML report and extract check decisions
import { STATUS_OPTIONS } from './constants';
import { saveDecision } from './storage';

/**
 * Parse an HTML report file and extract check decisions
 * @param {File} file - The HTML file to parse
 * @returns {Promise<Object>} Object with imported count and any errors
 */
export const parseHTMLReport = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const htmlContent = e.target.result;
                const decisions = extractDecisions(htmlContent);

                // Save all decisions to localStorage
                let importedCount = 0;
                decisions.forEach(({ checkNumber, status }) => {
                    saveDecision(checkNumber, status);
                    importedCount++;
                });

                resolve({
                    success: true,
                    count: importedCount,
                    decisions
                });
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read HTML file'));
        };

        reader.readAsText(file);
    });
};

/**
 * Extract check numbers and decisions from HTML content
 * @param {string} htmlContent - The HTML content
 * @returns {Array} Array of { checkNumber, status } objects
 */
const extractDecisions = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const decisions = [];
    const rows = doc.querySelectorAll('tbody tr');

    rows.forEach(row => {
        try {
            const cells = row.querySelectorAll('td');
            if (cells.length < 3) return;

            // Extract check number (first column, first div)
            const checkNumDiv = cells[0].querySelector('div');
            const checkNumber = checkNumDiv ? checkNumDiv.textContent.trim() : '';

            // Extract status from badge (third column, span with badge class)
            const statusBadge = cells[2].querySelector('.badge');
            const statusLabel = statusBadge ? statusBadge.textContent.trim() : '';

            if (checkNumber && statusLabel) {
                // Map status label back to status ID
                const statusObj = STATUS_OPTIONS.find(s => s.label === statusLabel);
                if (statusObj) {
                    decisions.push({
                        checkNumber,
                        status: statusObj.id
                    });
                }
            }
        } catch (err) {
            console.warn('Error parsing row:', err);
        }
    });

    return decisions;
};

/**
 * Parse CSV report and extract check decisions
 * @param {File} file - The CSV file to parse  
 * @returns {Promise<Object>} Object with imported count and any errors
 */
export const parseCSVReport = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                const decisions = extractDecisionsFromCSV(csvContent);

                // Save all decisions to localStorage
                let importedCount = 0;
                decisions.forEach(({ checkNumber, status }) => {
                    saveDecision(checkNumber, status);
                    importedCount++;
                });

                resolve({
                    success: true,
                    count: importedCount,
                    decisions
                });
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read CSV file'));
        };

        reader.readAsText(file);
    });
};

/**
 * Extract decisions from CSV content
 * @param {string} csvContent - The CSV content
 * @returns {Array} Array of { checkNumber, status } objects
 */
const extractDecisionsFromCSV = (csvContent) => {
    const lines = csvContent.split('\n');
    if (lines.length < 2) return [];

    const decisions = [];

    // Parse header to find column indices
    const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const checkNumIndex = header.findIndex(h => h.toLowerCase().includes('check'));
    const decisionIndex = header.findIndex(h => h.toLowerCase().includes('decision'));

    if (checkNumIndex === -1 || decisionIndex === -1) {
        throw new Error('CSV must have "Check #" and "Decision" columns');
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = line.split(',').map(c => c.replace(/"/g, '').trim());
        const checkNumber = cells[checkNumIndex];
        const statusLabel = cells[decisionIndex];

        if (checkNumber && statusLabel && statusLabel !== 'Unknown') {
            // Map status label back to status ID
            const statusObj = STATUS_OPTIONS.find(s => s.label === statusLabel);
            if (statusObj) {
                decisions.push({
                    checkNumber,
                    status: statusObj.id
                });
            }
        }
    }

    return decisions;
};
