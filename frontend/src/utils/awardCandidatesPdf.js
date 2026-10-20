const CP1252 = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a],
  [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92],
  [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c],
  [0x017e, 0x9e], [0x0178, 0x9f],
])

const clean = value => String(value ?? '').trim() || 'Not provided'

function toPdfHex(value) {
  const normalized = clean(value).normalize('NFC')
  const bytes = []
  for (const char of normalized) {
    const code = char.codePointAt(0)
    if (code <= 0x7f || (code >= 0xa0 && code <= 0xff)) bytes.push(code)
    else if (CP1252.has(code)) bytes.push(CP1252.get(code))
    else {
      const ascii = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      for (const fallback of ascii) bytes.push(fallback.codePointAt(0) <= 0x7f ? fallback.codePointAt(0) : 0x3f)
    }
  }
  return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function textLine(font, size, x, y, value, color = '0.12 0.18 0.24') {
  return `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm <${toPdfHex(value)}> Tj ET`
}

function wrap(value, maxLength) {
  const words = clean(value).split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    if (line && `${line} ${word}`.length > maxLength) {
      lines.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  return lines
}

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const LEFT = 44
const RIGHT = PAGE_WIDTH - 44
const FOOTER_Y = 30

function startPage(pageNumber, totalCandidates, awardLabel, searchSummary) {
  const commands = []
  let y = PAGE_HEIGHT - 54
  const titleLines = wrap(`Potential Awardee for ${awardLabel}`, 62)
  for (const line of titleLines) {
    commands.push(textLine('F2', 16, LEFT, y, line, '0.04 0.29 0.20'))
    y -= 21
  }
  commands.push(textLine('F1', 10, LEFT, y, `${totalCandidates} ${totalCandidates === 1 ? 'student' : 'students'}`))
  y -= 16
  for (const line of wrap(searchSummary, 94)) {
    commands.push(textLine('F1', 8.5, LEFT, y, line, '0.32 0.38 0.44'))
    y -= 12
  }
  y -= 5
  commands.push(`0.82 0.87 0.90 RG 0.7 w ${LEFT} ${y} m ${RIGHT} ${y} l S`)
  return { pageNumber, commands, y: y - 19 }
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return 'Not available'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? String(Number(numeric.toFixed(2))) : String(value)
}

function candidateLines(candidate) {
  const score = candidate.raw_portfolio_score ?? candidate.raw_score
  const maximum = candidate.computable_max_score ?? candidate.max_computable_score
  const percent = candidate.portfolio_potential_score ?? candidate.potential_score
  const points = `${formatNumber(score)} / ${formatNumber(maximum)} points`
  const scoreLabel = percent === null || percent === undefined || percent === ''
    ? `Score: ${points}`
    : `Score: ${points} (${formatNumber(percent)}%)`
  const details = [
    `Student ID: ${clean(candidate.student_id_number)}`,
    `Program: ${candidate.program_code || candidate.program_name || 'Program unavailable'}`,
    `College: ${candidate.college_code || candidate.college_name || 'College unavailable'}`,
    `Award: ${candidate.award_name || candidate.award_code || 'Award unavailable'}`,
    `Review status: ${candidate.is_candidate ? 'Potential awardee' : 'Below candidate threshold'}`,
  ].flatMap(value => wrap(value, 88))
  return { scoreLabel, details }
}

/** Build a directly downloadable, paginated PDF of the currently filtered OSAD candidates. */
export function buildAwardCandidatesPdf(candidates, { awardLabel, searchSummary = 'Current candidate filters' } = {}) {
  const rows = Array.isArray(candidates) ? candidates : []
  const label = clean(awardLabel || 'All awards')
  const pages = []
  let page = startPage(1, rows.length, label, clean(searchSummary))
  pages.push(page)

  for (const candidate of rows) {
    const { scoreLabel, details } = candidateLines(candidate)
    const blockHeight = 16 + 15 + details.length * 12 + 12
    if (page.y - blockHeight < FOOTER_Y + 14) {
      page = startPage(pages.length + 1, rows.length, label, clean(searchSummary))
      pages.push(page)
    }

    page.commands.push(textLine('F2', 11, LEFT, page.y, clean(candidate.student_name || 'Student name unavailable')))
    page.y -= 16
    page.commands.push(textLine('F2', 9.5, LEFT, page.y, scoreLabel, '0.04 0.45 0.29'))
    page.y -= 15
    for (const line of details) {
      page.commands.push(textLine('F1', 9, LEFT, page.y, line, '0.28 0.34 0.40'))
      page.y -= 12
    }
    page.commands.push(`0.88 0.91 0.93 RG 0.5 w ${LEFT} ${(page.y + 3).toFixed(2)} m ${RIGHT} ${(page.y + 3).toFixed(2)} l S`)
    page.y -= 13
  }

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ]
  const pageIds = []
  pages.forEach((item, index) => {
    item.commands.push(`0.82 0.87 0.90 RG 0.5 w ${LEFT} 46 m ${RIGHT} 46 l S`)
    item.commands.push(textLine('F1', 8, LEFT, FOOTER_Y, `Generated ${new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date())}`, '0.42 0.47 0.52'))
    item.commands.push(textLine('F1', 8, RIGHT - 52, FOOTER_Y, `Page ${index + 1} of ${pages.length}`, '0.42 0.47 0.52'))
    const stream = `${item.commands.join('\n')}\n`
    const contentId = objects.length + 1
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`)
    const pageId = objects.length + 1
    pageIds.push(pageId)
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`)
  })
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`

  let document = '%PDF-1.4\n% AchieveNest Award Candidates\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(document.length)
    document += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = document.length
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) document += `${String(offset).padStart(10, '0')} 00000 n \n`
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Blob([document], { type: 'application/pdf' })
}
