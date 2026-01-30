export const STATUS_OPTIONS = [
    { id: 'mail', label: 'MAIL Physical Check', color: '#10B981', icon: 'Mail' }, // Green
    { id: 'pay_ach', label: 'NEEDS ACH Payment', color: '#38BDF8', icon: 'CreditCard' }, // Blue
    { id: 'void_paid', label: 'PAID via ACH', color: '#F59E0B', icon: 'XCircle' }, // Orange
    { id: 'duplicate', label: 'DUPLICATE - Void & Reverse', color: '#EF4444', icon: 'Ban' }, // Red
    { id: 'adj_needed', label: 'Amount Adjustment Needed', color: '#8B5CF6', icon: 'DollarSign' }, // Purple
    { id: 'unknown', label: 'Unknown', color: '#94A3B8', icon: 'HelpCircle' }, // Gray
];

export const CSV_HEADERS = [
    { label: 'Check #', key: 'checkNumber' },
    { label: 'Payee', key: 'payee' },
    { label: 'Date', key: 'date' },
    { label: 'Amount', key: 'amount' },
    { label: 'Decision', key: 'statusLabel' }, // We'll map status ID to Label for export
    { label: 'Memo', key: 'memo' },
    { label: 'Property List', key: 'propertySummary' }
];
