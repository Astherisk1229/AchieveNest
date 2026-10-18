// Keep the request contract and duplicate-click guard separate from dialog state.
export async function submitPortfolioReturn(instructions, inFlight, request) {
  const reason = String(instructions || '').trim()
  if (!reason || inFlight.current) return false
  inFlight.current = true
  try {
    await request(reason)
    return true
  } finally {
    inFlight.current = false
  }
}
