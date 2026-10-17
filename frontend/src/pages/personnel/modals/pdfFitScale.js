export function calculatePdfFitScale(pageWidth, pageHeight, availableWidth, availableHeight) {
  if (![pageWidth, pageHeight, availableWidth, availableHeight].every(value => Number.isFinite(value) && value > 0)) return 0
  return Math.min(availableWidth / pageWidth, availableHeight / pageHeight)
}
