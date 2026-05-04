export function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function truncate(text, length = 100) {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

export function estimateTokens(text) {
  // Simple estimation: words * 1.3
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words * 1.3)
}
