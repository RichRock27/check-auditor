import React, { useState, useMemo } from 'react';
import DropZone from './components/DropZone';
import CheckCard from './components/CheckCard';
import { parseCheckRegister } from './utils/csvParser';
import { generateReport, downloadCSV } from './utils/reportGenerator';
import { Download, PieChart, CheckCircle2 } from 'lucide-react';
import './App.css';

function App() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const handleFile = async (file) => {
    setLoading(true);
    try {
      const data = await parseCheckRegister(file);
      setChecks(data);
      // Automatically expand the first one if exists
      if (data.length > 0) setExpandedId(data[0].id);
    } catch (err) {
      alert("Error parsing CSV: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (id, newStatus) => {
    setChecks(prev => prev.map(c =>
      c.id === id ? { ...c, status: newStatus } : c
    ));
    // Auto-collapse and expand next one? Optional but nice workflow.
    // Let's implement auto-advance for speed.
    const idx = checks.findIndex(c => c.id === id);
    if (idx !== -1 && idx < checks.length - 1) {
      // Wait a tiny bit for UI feedback
      setTimeout(() => setExpandedId(checks[idx + 1].id), 300);
    } else {
      // If last one, just collapse
      setTimeout(() => setExpandedId(null), 300);
    }
  };

  const handleExport = () => {
    const csvContent = generateReport(checks);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `check_audit_report_${dateStr}.csv`);
  };

  const progress = useMemo(() => {
    if (checks.length === 0) return 0;
    const completed = checks.filter(c => c.status !== 'Unknown').length;
    return Math.round((completed / checks.length) * 100);
  }, [checks]);

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 40 }}>
        <div>
          <h1 style={{ background: 'linear-gradient(90deg, #38BDF8, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.5rem', fontWeight: 700 }}>Check Auditor Pro</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Process check registers with speed and precision.</p>
        </div>

        {checks.length > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{progress}%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>AUDIT COMPLETE</div>
          </div>
        )}
      </header>

      {checks.length === 0 ? (
        <DropZone onFileLoaded={handleFile} />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <div style={{ color: 'var(--text-secondary)' }}>
              Found <strong>{checks.length}</strong> physical checks to review.
            </div>
            <button
              onClick={handleExport}
              style={{
                background: 'var(--success)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              <Download size={18} />
              Export Report
            </button>
          </div>

          <div className="check-list">
            {checks.map(check => (
              <CheckCard
                key={check.id}
                check={check}
                onStatusChange={updateStatus}
                expanded={expandedId === check.id}
                onToggleExpand={() => setExpandedId(expandedId === check.id ? null : check.id)}
              />
            ))}
          </div>
        </>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>Processing...</div>
      )}
    </div>
  );
}

export default App;
