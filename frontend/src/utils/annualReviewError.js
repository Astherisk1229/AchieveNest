export const annualReviewRequestError = (failure, fallback = 'This report could not be processed. Review it and try again.') => {
  const payload = failure?.response?.data || failure?.data || failure
  const code = String(payload?.error?.code || payload?.code || '').toUpperCase()
  const serverMessage = payload?.error?.message || payload?.messages?.error || payload?.message
  if (failure?.isNetworkError || (!failure?.response && !payload?.error && /connect|network/i.test(String(failure?.message || '')))) {
    return { title: 'Unable to reach the server', message: "We couldn't connect to AchieveNest. Check your connection and try again." }
  }
  if (code === 'INVALID_FILE_SIZE' || code === 'UPLOAD_TOO_LARGE') {
    return { title: 'Workbook is too large', message: 'Maximum file size: 10 MB. Choose another file.' }
  }
  if (code === 'WORKBOOK_PERSONNEL_MISMATCH') {
    return { title: 'Workbook does not match this personnel', message: serverMessage || 'Choose another file for the selected personnel.' }
  }
  if (['UNSUPPORTED_TEMPLATE', 'MISSING_SUMMARY_SHEET', 'MISSING_PERSONNEL_NAME', 'INVALID_RATING', 'MALFORMED_WORKBOOK', 'INVALID_FILE_TYPE'].includes(code)) {
    return { title: 'Unsupported annual review format', message: serverMessage || 'The required “SUMMARY 1st & 2nd” worksheet could not be verified.' }
  }
  if (serverMessage) return { title: 'Annual review could not be inspected', message: serverMessage }
  return { title: 'Annual review could not be inspected', message: fallback }
}
