/**
 * Portfolio PDF Generation Engine
 * Handles print formatting and multi-page PDF exporting for AchieveNest portfolios.
 */

export const generatePortfolioPdf = (title = 'Student_Portfolio') => {
  // Trigger browser native print renderer configured with clean @media print page breaks
  window.print()
}

export const formatPortfolioDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (e) {
    return dateString
  }
}
