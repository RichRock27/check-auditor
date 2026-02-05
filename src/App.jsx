import React, { useState, useMemo, useEffect } from 'react';
import DropZone from './components/DropZone';
import CheckCard from './components/CheckCard';
import EasterEgg from './components/EasterEgg';
import { parseCheckRegister } from './utils/csvParser';
import { generateReport, downloadCSV, generateHTMLReport, downloadHTML } from './utils/reportGenerator';
import { saveDecision, clearAllDecisions, getDecisionCount, getDecisions, pruneOldDecisions } from './utils/storage';
import { parseHTMLReport, parseCSVReport } from './utils/importParser';
import { INITIAL_DECISIONS } from './utils/initialData';
import { Download, FileCode, Filter, Trash2, Sparkles, Upload } from 'lucide-react';
import './App.css';

function App() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [showOnlyNew, setShowOnlyNew] = useState(false);

  // Auto-seed decisions if empty or missing key data
  useEffect(() => {
    const existing = getDecisions();
    // Repair: If empty OR if our test check (14723) is missing or unknown, force a re-seed
    if ((Object.keys(existing).length === 0 || !existing['14723'] || existing['14723'].status === 'unknown') && INITIAL_DECISIONS) {
      console.log(`Seeding/Repairing ${Object.keys(INITIAL_DECISIONS).length} initial decisions...`);
      localStorage.setItem('check_auditor_decisions', JSON.stringify(INITIAL_DECISIONS));
    }

    // Maintenance: Prune old history
    pruneOldDecisions(180); // Keep 6 months of history
  }, []);

  const handleFile = async (file) => {
    setLoading(true);
    try {
      const data = await parseCheckRegister(file);

      if (data.isDecisionImport) {
        alert(`✅ Successfully imported ${data.count} decisions! \n\nNow upload your check register CSV.`);
        return;
      }

      setChecks(data);
      // Automatically expand the first NEW one if exists
      const firstNew = data.find(c => !c.isPreviouslyReviewed);
      if (firstNew) setExpandedId(firstNew.id);
      else if (data.length > 0) setExpandedId(data[0].id);
    } catch (err) {
      alert("Error parsing CSV: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (id, newStatus) => {
    const check = checks.find(c => c.id === id);
    if (check) {
      // Save decision to localStorage
      saveDecision(check.checkNumber, newStatus);
    }

    setChecks(prev => prev.map(c =>
      c.id === id ? { ...c, status: newStatus, isPreviouslyReviewed: true } : c
    ));

    // Auto-advance to next NEW check (or next check if all reviewed)
    const idx = checks.findIndex(c => c.id === id);
    if (idx !== -1 && idx < checks.length - 1) {
      // Find next unreviewed check
      const remainingChecks = checks.slice(idx + 1);
      const nextNew = remainingChecks.find(c => !c.isPreviouslyReviewed && c.status === 'unknown');
      const nextCheck = nextNew || checks[idx + 1];
      setTimeout(() => setExpandedId(nextCheck.id), 300);
    } else {
      setTimeout(() => setExpandedId(null), 300);
    }
  };

  const handleClearHistory = () => {
    if (confirm(`Are you sure you want to clear all saved decisions? You have ${getDecisionCount()} saved decisions.`)) {
      clearAllDecisions();
      // Reset all checks to unknown
      setChecks(prev => prev.map(c => ({
        ...c,
        status: 'unknown',
        isPreviouslyReviewed: false,
        reviewedAt: undefined
      })));
      alert('Decision history cleared!');
    }
  };

  const handleImportReport = async () => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.csv';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setLoading(true);
      try {
        let result;
        if (file.name.endsWith('.html')) {
          result = await parseHTMLReport(file);
        } else if (file.name.endsWith('.csv')) {
          result = await parseCSVReport(file);
        } else {
          throw new Error('Please select an HTML or CSV report file');
        }

        if (result.success) {
          alert(`✅ Successfully imported ${result.count} check decisions!\n\nYour decisions have been saved. Upload a check register CSV to see them applied.`);

          // If we have checks loaded, refresh them with new decisions
          if (checks.length > 0) {
            const refreshed = checks.map(check => {
              const decision = result.decisions.find(d => d.checkNumber === check.checkNumber);
              if (decision) {
                return {
                  ...check,
                  status: decision.status,
                  isPreviouslyReviewed: true,
                  reviewedAt: new Date().toISOString()
                };
              }
              return check;
            });
            setChecks(refreshed);
          }
        }
      } catch (err) {
        alert('Error importing report: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    input.click();
  };

  const handleExport = () => {
    const csvContent = generateReport(checks);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `check_audit_report_${dateStr}.csv`);
  };

  const handleHTMLExport = () => {
    const htmlContent = generateHTMLReport(checks);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadHTML(htmlContent, `check_audit_report_${dateStr}.html`);
  };

  const stats = useMemo(() => {
    const total = checks.length;
    const newChecks = checks.filter(c => !c.isPreviouslyReviewed).length;
    const previouslyReviewed = checks.filter(c => c.isPreviouslyReviewed).length;
    const completed = checks.filter(c => c.status !== 'unknown').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, newChecks, previouslyReviewed, completed, progress };
  }, [checks]);

  const displayedChecks = useMemo(() => {
    return showOnlyNew ? checks.filter(c => !c.isPreviouslyReviewed) : checks;
  }, [checks, showOnlyNew]);

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 40 }}>
        <div>
          <h1 style={{ background: 'linear-gradient(90deg, #38BDF8, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.5rem', fontWeight: 700 }}>Check Auditor Pro</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Process check registers with speed and precision.</p>
        </div>

        {checks.length > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{stats.progress}%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>AUDIT COMPLETE</div>
          </div>
        )}
      </header>

      {checks.length === 0 ? (
        <DropZone onFileLoaded={handleFile} />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                Found <strong>{checks.length}</strong> total checks
                {stats.newChecks > 0 && (
                  <span style={{ marginLeft: 8, color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={14} />
                    <strong>{stats.newChecks}</strong> new
                  </span>
                )}
                {stats.previouslyReviewed > 0 && (
                  <span style={{ marginLeft: 8, color: '#94A3B8' }}>
                    (<strong>{stats.previouslyReviewed}</strong> previously reviewed)
                  </span>
                )}
              </div>
              {stats.previouslyReviewed > 0 && (
                <button
                  onClick={() => setShowOnlyNew(!showOnlyNew)}
                  style={{
                    background: showOnlyNew ? 'var(--success)' : 'var(--bg-secondary)',
                    color: showOnlyNew ? 'white' : 'var(--text-primary)',
                    border: showOnlyNew ? 'none' : '1px solid var(--border)',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  <Filter size={14} />
                  {showOnlyNew ? `Showing ${stats.newChecks} New` : 'Show Only New'}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {stats.previouslyReviewed > 0 && (
                <button
                  onClick={handleClearHistory}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: '#EF4444',
                    border: '1px solid var(--border)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                  title={`Clear ${getDecisionCount()} saved decision(s)`}
                >
                  <Trash2 size={16} />
                  Clear History
                </button>
              )}
              <button
                onClick={handleImportReport}
                style={{
                  background: 'var(--bg-secondary)',
                  color: '#3B82F6',
                  border: '1px solid var(--border)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
                title="Import decisions from previous HTML or CSV report"
              >
                <Upload size={16} />
                Import Report
              </button>
              <button
                onClick={handleHTMLExport}
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
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
                <FileCode size={18} />
                Online Report
              </button>
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
                Export CSV
              </button>
            </div>
          </div>

          <div className="check-list">
            {displayedChecks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <Sparkles size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
                <div style={{ fontSize: '1.2rem' }}>All checks have been previously reviewed!</div>
                <div style={{ marginTop: 8 }}>Toggle the filter to see all checks.</div>
              </div>
            ) : (
              displayedChecks.map(check => (
                <CheckCard
                  key={check.id}
                  check={check}
                  onStatusChange={updateStatus}
                  expanded={expandedId === check.id}
                  onToggleExpand={() => setExpandedId(expandedId === check.id ? null : check.id)}
                />
              ))
            )}
          </div>
        </>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>Processing...</div>
      )}
      <EasterEgg />
    </div>
  );
}

export default App;
