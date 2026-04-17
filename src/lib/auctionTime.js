/** Human-readable countdown label for list cards */
export function formatTimeLeftShort(endsAt) {
  if (!endsAt) return '—'
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return 'Ending soon'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h >= 72) return `${Math.floor(h / 24)}d+ left`
  return `${h}h ${String(m).padStart(2, '0')}m`
}
