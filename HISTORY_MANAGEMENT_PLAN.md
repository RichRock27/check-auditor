# Check Auditor - History Management Strategy

## Objective
Prevent `localStorage` from hitting quota limits (usually 5MB) and maintain application performance by automatically removing obsolete decision data.

## Retention Policy
**Retention Period:** 180 Days (approx. 6 months).

**Rationale:** 
- Check decisions are keyed by `Check Number`.
- Check numbers are unique and chronological.
- Once a check period (month) is audited + reconciled, that specific check number is rarely queried again.
- A 6-month buffer allows for quarterly reviews or re-auditing recent history without keeping data forever.

## Implementation Plan

### 1. New Utility Function: `pruneOldDecisions(daysToKeep)`
Located in: `src/utils/storage.js`

**Logic:**
```javascript
export const pruneOldDecisions = (daysToKeep = 180) => {
    const decisions = getDecisions();
    const now = new Date();
    const cutoff = new Date(now.setDate(now.getDate() - daysToKeep));
    
    let pruneCount = 0;
    const initialCount = Object.keys(decisions).length;

    Object.keys(decisions).forEach(checkNum => {
        const decision = decisions[checkNum];
        // If no timestamp (legacy data), treat as 'now' or prune? 
        // Decision: Treat as 'now' to be safe, or migrate. 
        if (decision.timestamp) {
            const decisionDate = new Date(decision.timestamp);
            if (decisionDate < cutoff) {
                delete decisions[checkNum];
                pruneCount++;
            }
        }
    });

    if (pruneCount > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
        console.log(`Pruned ${pruneCount} old decisions. (Kept ${initialCount - pruneCount})`);
    }
};
```

### 2. Startup Hook
Located in: `src/App.jsx`

Add to the existing `useEffect`:
```javascript
useEffect(() => {
    // 1. Auto-Seed Logic (Repair)
    // ... existing logic ...

    // 2. Maintenance (Prune)
    pruneOldDecisions(180); 
}, []);
```

### 3. "VIP" Data Protection
The 96 seeded checks in `INITIAL_DECISIONS` have fixed timestamps (e.g., `2026-02-03`). 
*   **Risk:** Eventually, these will naturally "expire" and get pruned.
*   **Fix:** When seeding, update their `timestamp` to `new Date().toISOString()`, OR exclude the seed list from pruning logic.
*   **Recommended Fix:** Let them expire naturally. If the database becomes empty (due to pruning), the Auto-Seed logic will kick in again and restore them fresh! This creates a perfect self-healing cycle.

## Future Considerations
- **Export/Archive:** Add a feature to "Archive Old Decisions" to a downloadable JSON file before pruning, for compliance.
- **Configurable Limit:** Allow user to set "Days to Keep" in a Settings modal.
