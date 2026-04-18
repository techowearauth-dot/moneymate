/**
 * Generates a unique identifier for a transaction to prevent duplicates.
 * Useful for SMS-based transactions.
 */
export const generateTxId = (tx) => {
    if (!tx) return null;
    
    // If it already has a reliable ID (like from backend), use it
    if (tx._id || tx.id) return tx._id || tx.id;
    if (tx.orderId) return tx.orderId;

    // For SMS/Manual entries, create a hash
    const amount = Number(tx.amount || 0).toFixed(2);
    const date = tx.date || tx.timestamp || new Date().getTime();
    const snippet = (tx.text || tx.note || '').substring(0, 20).replace(/\s/g, '');
    
    // We use a simple composite key
    return `TX_${amount}_${date}_${snippet}`;
};

/**
 * Filter to remove duplicates from a list of transactions
 */
export const deduplicateTransactions = (list) => {
    const seen = new Set();
    return list.filter(item => {
        const id = generateTxId(item);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
};
