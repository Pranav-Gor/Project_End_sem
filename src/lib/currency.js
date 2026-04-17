/** Indian Rupees — use across the app for auction amounts */
export function formatINR(amount, options = {}) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  }).format(Number(amount))
}

/** For bid inputs that need paise / decimals */
export function formatINRDecimal(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount))
}

/** e.g. +₹2,500 or −₹1,000 for ledger lines */
export function formatINRSigned(amount, direction = 'in') {
  const s = formatINR(Math.abs(Number(amount)))
  const sign = direction === 'in' ? '+' : '−'
  return `${sign}${s}`
}
