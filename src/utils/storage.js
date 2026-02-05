// localStorage utilities for persisting check decisions

const STORAGE_KEY = 'check_auditor_decisions';

/**
 * Save a check decision to localStorage
 * @param {string} checkNumber - The check number
 * @param {string} status - The status decision
 */
export const saveDecision = (checkNumber, status) => {
    const decisions = getDecisions();
    decisions[checkNumber] = {
        status,
        timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
};

/**
 * Get all saved decisions from localStorage
 * @returns {Object} Object mapping check numbers to decision data
 */
export const getDecisions = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (err) {
        console.error('Error reading decisions from localStorage:', err);
        return {};
    }
};

/**
 * Get decision for a specific check number
 * @param {string} checkNumber - The check number to lookup
 * @returns {Object|null} Decision object or null if not found
 */
export const getDecision = (checkNumber) => {
    const decisions = getDecisions();
    return decisions[checkNumber] || null;
};

/**
 * Clear a specific decision
 * @param {string} checkNumber - The check number to clear
 */
export const clearDecision = (checkNumber) => {
    const decisions = getDecisions();
    delete decisions[checkNumber];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
};

/**
 * Clear all decisions (with confirmation in calling code)
 */
export const clearAllDecisions = () => {
    localStorage.removeItem(STORAGE_KEY);
};

/**
 * Get count of saved decisions
 * @returns {number} Number of saved decisions
 */
export const getDecisionCount = () => {
    const decisions = getDecisions();
    return Object.keys(decisions).length;
};

/**
 * Export decisions as JSON for backup
 * @returns {string} JSON string of all decisions
 */
export const exportDecisions = () => {
    return JSON.stringify(getDecisions(), null, 2);
};

/**
 * Import decisions from JSON backup
 * @param {string} jsonString - JSON string of decisions
 */
export const importDecisions = (jsonString) => {
    try {
        const decisions = JSON.parse(jsonString);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
        return true;
    } catch (err) {
        console.error('Error importing decisions:', err);
        return false;
    }
};

/**
 * Prune decisions older than a specified number of days
 * @param {number} daysToKeep - Number of days of history to retain (default: 180)
 * @returns {number} Number of decisions pruned
 */
export const pruneOldDecisions = (daysToKeep = 180) => {
    const decisions = getDecisions();
    const now = new Date();
    const cutoff = new Date(now.setDate(now.getDate() - daysToKeep));

    let pruneCount = 0;
    const initialCount = Object.keys(decisions).length;

    Object.keys(decisions).forEach(checkNum => {
        const decision = decisions[checkNum];
        // If decision has a timestamp, check it
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
        console.log(`🧹 History Maintenance: Pruned ${pruneCount} old decisions. (Kept ${initialCount - pruneCount})`);
    } else {
        console.log(`🧹 History Maintenance: No decisions older than ${daysToKeep} days found.`);
    }

    return pruneCount;
};
