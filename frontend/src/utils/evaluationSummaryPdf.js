const CP1252 = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a],
  [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92],
  [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c],
  [0x017e, 0x9e], [0x0178, 0x9f],
])

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const LEFT = 44
const RIGHT = PAGE_WIDTH - 44
const CONTENT_BOTTOM = 48

function pdfText(value) {
  const bytes = []
  for (const char of String(value ?? '').normalize('NFC')) {
    const code = char.codePointAt(0)
    if (code <= 0x7f || (code >= 0xa0 && code <= 0xff)) bytes.push(code)
    else if (CP1252.has(code)) bytes.push(CP1252.get(code))
    else {
      const fallback = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      for (const replacement of fallback) bytes.push(replacement.codePointAt(0) <= 0x7f ? replacement.codePointAt(0) : 0x3f)
    }
  }
  return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function wrap(value, maxLength) {
  const text = String(value ?? '').trim() || 'Not available'
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if (line && `${line} ${word}`.length > maxLength) {
      lines.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  return lines
}

function text(font, size, x, y, value, color = '0.12 0.16 0.22', align = 'left') {
  const estimatedWidth = String(value).length * size * 0.5
  const textX = align === 'right' ? x - estimatedWidth : align === 'center' ? x - estimatedWidth / 2 : x
  return `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${textX.toFixed(2)} ${y.toFixed(2)} Tm <${pdfText(value)}> Tj ET`
}

function line(x1, y1, x2, y2, color = '0.78 0.82 0.85', width = 0.6) {
  return `${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`
}

function createPage(pages, studentName, awardName, continued = false) {
  const page = { commands: [], y: PAGE_HEIGHT - 50 }
  if (pages.length === 0) {
    page.commands.push(text('F2', 10, PAGE_WIDTH / 2, page.y, 'ACHIEVENEST', '0.02 0.40 0.29', 'center'))
    page.y -= 24
    page.commands.push(text('F2', 18, PAGE_WIDTH / 2, page.y, 'STUDENT EVALUATION SUMMARY', '0.05 0.09 0.16', 'center'))
    page.y -= 18
  } else {
    page.commands.push(text('F2', 13, LEFT, page.y, `STUDENT EVALUATION SUMMARY${continued ? ' (CONTINUED)' : ''}`, '0.05 0.09 0.16'))
    page.y -= 17
    page.commands.push(text('F1', 9, LEFT, page.y, `${studentName}  |  ${awardName}`, '0.30 0.36 0.42'))
    page.y -= 17
  }
  page.commands.push(line(LEFT, page.y, RIGHT, page.y, '0.05 0.09 0.16', 1.1))
  page.y -= 22
  pages.push(page)
  return page
}

function studentFields(page, fields) {
  for (const field of fields) {
    const labelLines = wrap(`${field.label}:`, 27)
    const valueLines = wrap(field.value, 62)
    const count = Math.max(labelLines.length, valueLines.length)
    for (let index = 0; index < count; index += 1) {
      if (labelLines[index]) page.commands.push(text('F2', 9.5, LEFT, page.y, labelLines[index], '0.28 0.34 0.40'))
      if (valueLines[index]) page.commands.push(text('F1', 9.5, 175, page.y, valueLines[index]))
      page.y -= 13
    }
    page.y -= 2
  }
  page.y -= 3
  page.commands.push(line(LEFT, page.y, RIGHT, page.y))
  page.y -= 21
}

function addTableHeader(page) {
  const x1 = LEFT
  const x2 = 278
  const x3 = 486
  page.commands.push(text('F2', 9, x1 + 3, page.y, 'Achievement / Evidence'))
  page.commands.push(text('F2', 9, x2 + 3, page.y, 'Criterion'))
  page.commands.push(text('F2', 9, RIGHT - 3, page.y, 'Points', '0.12 0.16 0.22', 'right'))
  page.y -= 7
  page.commands.push(line(x1, page.y, RIGHT, page.y, '0.55 0.60 0.65', 0.8))
  page.y -= 15
  return { x1, x2, x3 }
}

function addTableRow(page, columns, row) {
  const achievement = wrap(row.evidence, 36)
  const criterion = wrap(row.criterion, 31)
  const rowHeight = Math.max(achievement.length, criterion.length, 1) * 12 + 8
  achievement.forEach((value, index) => page.commands.push(text('F1', 9, columns.x1 + 3, page.y - (index * 12), value, '0.18 0.23 0.29')))
  criterion.forEach((value, index) => page.commands.push(text('F1', 9, columns.x2 + 3, page.y - (index * 12), value, '0.18 0.23 0.29')))
  page.commands.push(text('F1', 9, RIGHT - 3, page.y, row.points, '0.18 0.23 0.29', 'right'))
  page.y -= rowHeight
  page.commands.push(line(columns.x1, page.y, RIGHT, page.y, '0.87 0.89 0.91', 0.45))
  page.y -= 5
}

function makePdf(pages) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ]
  const pageIds = []
  pages.forEach((page, index) => {
    page.commands.push(text('F1', 8, LEFT, 27, 'AchieveNest  |  Student Evaluation Summary', '0.42 0.47 0.52'))
    page.commands.push(text('F1', 8, RIGHT, 27, `Page ${index + 1} of ${pages.length}`, '0.42 0.47 0.52', 'right'))
    const stream = `${page.commands.join('\n')}\n`
    const contentId = objects.length + 1
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`)
    const pageId = objects.length + 1
    pageIds.push(pageId)
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`)
  })
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`

  let document = '%PDF-1.4\n% AchieveNest Evaluation Summary\n'
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

/** Build a directly downloadable, paginated PDF matching the on-screen evaluation report. */
export function buildEvaluationSummaryPdf(model) {
  const pages = []
  const studentName = model?.fields?.find(field => field.label === 'Student Name')?.value || 'Student'
  const awardName = model?.section?.name || 'Award'
  let page = createPage(pages, studentName, awardName)
  studentFields(page, model?.fields || [])
  page.commands.push(text('F2', 12, LEFT, page.y, String(awardName).toUpperCase(), '0.05 0.09 0.16'))
  page.y -= 8
  page.commands.push(line(LEFT, page.y, RIGHT, page.y, '0.05 0.09 0.16', 0.8))
  page.y -= 18

  let columns = addTableHeader(page)
  const rows = model?.section?.rows || []
  if (rows.length === 0) {
    page.commands.push(text('F1', 9, columns.x1 + 3, page.y, 'No approved achievements have earned points for this award.', '0.30 0.36 0.42'))
    page.y -= 18
    page.commands.push(line(columns.x1, page.y, RIGHT, page.y, '0.87 0.89 0.91', 0.45))
    page.y -= 14
  }

  for (const row of rows) {
    const rowLineCount = Math.max(wrap(row.evidence, 36).length, wrap(row.criterion, 31).length, 1)
    const needed = rowLineCount * 12 + 17
    if (page.y - needed < CONTENT_BOTTOM + 115) {
      page = createPage(pages, studentName, awardName, true)
      page.commands.push(text('F2', 11, LEFT, page.y, String(awardName).toUpperCase(), '0.05 0.09 0.16'))
      page.y -= 20
      columns = addTableHeader(page)
    }
    addTableRow(page, columns, row)
  }

  const summaryLines = [
    ['Total', model?.section?.total || 'Not available', true],
    ['Portfolio Potential Score', model?.section?.portfolioPotentialScore || 'Not available'],
    ['Qualification Threshold', model?.section?.qualificationThreshold || 'Not available'],
    ['Status', model?.section?.status || 'Not available', true],
  ]
  const summaryHeight = 75 + (model?.humanOnlyCriteria?.length ? 28 : 0)
  if (page.y - summaryHeight < CONTENT_BOTTOM + 15) page = createPage(pages, studentName, awardName, true)
  page.y -= 1
  for (const [label, value, bold] of summaryLines) {
    page.commands.push(text(bold ? 'F2' : 'F1', 9, 330, page.y, label, bold ? '0.05 0.09 0.16' : '0.25 0.30 0.36'))
    page.commands.push(text(bold ? 'F2' : 'F1', 9, RIGHT, page.y, value, bold ? '0.05 0.09 0.16' : '0.25 0.30 0.36', 'right'))
    page.y -= 14
  }
  if (model?.humanOnlyCriteria?.length) {
    page.y -= 4
    for (const value of wrap(`Not scored by the system: ${model.humanOnlyCriteria.join('; ')}.`, 88)) {
      page.commands.push(text('F1', 8.5, LEFT, page.y, value, '0.30 0.36 0.42'))
      page.y -= 12
    }
  }
  page.y -= 18
  for (const value of wrap('Generated by AchieveNest from approved achievements. Potential candidate status is identified automatically from the award criteria.', 88)) {
    page.commands.push(text('F1', 8, PAGE_WIDTH / 2, page.y, value, '0.42 0.47 0.52', 'center'))
    page.y -= 11
  }

  return makePdf(pages)
}

export function evaluationSummaryPdfFilename(studentName, awardName) {
  const safePart = value => String(value || '').trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `Student-Evaluation-Summary-${safePart(studentName) || 'Student'}-${safePart(awardName) || 'Award'}.pdf`
}
