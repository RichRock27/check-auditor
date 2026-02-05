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

export const generateHTMLReport = (checks) => {
    const dateStr = new Date().toLocaleDateString();

    // Create styles
    const styles = `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: #f8fafc; color: #1e293b; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        h1 { margin: 0 0 10px 0; color: #0f172a; }
        .meta { color: #64748b; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .amount { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; color: white; font-size: 0.85rem; font-weight: 500; white-space: nowrap; }
        .memo { color: #64748b; font-size: 0.9rem; margin-top: 4px; }
        .props { font-size: 0.85rem; color: #475569; margin-top: 4px; }
        tr:last-child td { border-bottom: none; }
    `;

    // Generate Rows
    const rows = checks.map(check => {
        const status = STATUS_OPTIONS.find(s => s.id === check.status) || STATUS_OPTIONS.find(s => s.id === 'unknown');
        const properties = check.properties.map(p => `${p.name} ($${p.amount})`).join(', ');

        return `
            <tr>
                <td>
                    <div style="font-weight:600">${check.checkNumber}</div>
                    <div style="color:#94a3b8; font-size:0.8rem">${check.date}</div>
                </td>
                <td>
                    <div style="font-weight:600">${check.payee}</div>
                    ${check.memo ? `<div class="memo">${check.memo}</div>` : ''}
                </td>
                <td>
                    <span class="badge" style="background-color: ${status.color}">${status.label}</span>
                </td>
                <td class="amount">
                    ${check.amount}
                </td>
                <td>
                   ${properties ? `<div class="props">${properties}</div>` : '<span style="color:#cbd5e1">-</span>'}
                </td>
            </tr>
        `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Audit Report - ${dateStr}</title>
    <style>${styles}</style>
</head>
<body>
    <div class="container">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
            <div>
                <h1>Check Register Audit Report</h1>
                <div class="meta">Generated: ${new Date().toLocaleString()}</div>
            </div>
            <div style="text-align:right">
                 <div style="font-size:2rem; font-weight:700; color:#3b82f6">${checks.length}</div>
                 <div style="color:#64748b; font-size:0.9rem">ITEMS</div>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Check #</th>
                    <th>Payee / Memo</th>
                    <th>Decision</th>
                    <th>Amount</th>
                    <th>Properties</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    </div>
</body>
</html>
    `;
};

export const downloadHTML = (content, filename) => {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8;' });
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
