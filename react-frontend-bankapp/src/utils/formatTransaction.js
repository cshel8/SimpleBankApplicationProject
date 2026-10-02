export function formatTransactionType(actionType) {
  return actionType.charAt(0).toUpperCase() + actionType.slice(1)
}

export function formatTransactionTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString()
}

export function formatTransactionIdentifier(identifier) {
  return identifier ? `…${identifier.slice(-6)}` : '—'
}
