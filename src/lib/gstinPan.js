/**
 * GSTIN structure: 2-digit state + 10-char PAN + entity + Z + check char.
 * e.g. PAN AAPFC5450P → GSTIN 24AAPFC5450P1ZY
 */
export function gstinMatchesPan(gstin, pan) {
  const g = String(gstin).trim().toUpperCase()
  const p = String(pan).trim().toUpperCase()
  if (p.length !== 10 || g.length !== 15) return false
  return g.slice(2, 12) === p
}
