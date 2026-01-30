import { CSV_HEADERS, STATUS_OPTIONS } from './constants';

export const generateReport = (checks) => {
    const headerRow = CSV_HEADERS.map(h => h.label).join(',');

    const rows = checks.map(check => {
        // Find label for status
        const statusObj = STATUS_OPTIONS.find(s => s.id === check.status) || STATUS_OPTIONS.find(s => s.id === 'unknown');
        const statusLabel = statusObj ? statusObj.label : 'Unknown';

        // Summarize properties
        const propertySummary = check.properties
            .map(p => `${p.name} ($${p.amount})`)
            .join(' | ');

        return CSV_HEADERS.map(header => {
            let val = '';
            if (header.key === 'statusLabel') val = statusLabel;
            else if (header.key === 'propertySummary') val = propertySummary;
            else val = check[header.key] || '';

            // Escape quotes
            const stringVal = String(val).replace(/"/g, '""');
            return `"${stringVal}"`;
        }).join(',');
    });

    return [headerRow, ...rows].join('\n');
};

export const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
