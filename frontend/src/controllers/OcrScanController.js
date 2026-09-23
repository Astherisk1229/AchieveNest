/**
 * OcrScanController.js
 * Controller managing document OCR scanning, security verification,
 * text extraction, intelligent category suggestion, and structured zero-fabrication field extraction.
 *
 * ZERO-FABRICATION RULE:
 * No field may be invented, guessed, defaulted from filename cues, or silently substituted
 * when the source evidence does not support it.
 */

import SecurityController from './SecurityController.js'
import OcrScanModel from '../models/OcrScanModel.js'
import { ocrService } from '../services/ocrService.js'

export default class OcrScanController {
  /**
   * Main entry point to scan an uploaded certificate file.
   * Performs security verification, extracts text, suggests category, and extracts structured fields.
   * @param {File|Blob} file 
   * @returns {Promise<{ success: boolean, result?: object, error?: string }>}
   */
  static async processDocumentScan(file) {
    if (!file) {
      return { success: false, error: 'No file selected for scanning.' }
    }

    // 1. File Upload Security Validation (10MB limit + Magic Byte inspection)
    const securityCheck = await SecurityController.validateFileUpload(file)
    if (!securityCheck.isValid) {
      return { success: false, error: securityCheck.error }
    }

    try {
      // 2. Perform Authentic Text Extraction from File Binary / Text Layer
      const backendDocument = await ocrService.extract(file)
      const textExtraction = {
        text: backendDocument?.text || '',
        lines: (backendDocument?.text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean),
        pages: [],
        warnings: backendDocument?.warnings || []
      }
      const rawText = textExtraction.text || ''
      const rawLines = textExtraction.lines || []
      const pages = textExtraction.pages || [{ pageNumber: 1, text: rawText }]
      const extractionWarnings = textExtraction.warnings || []

      // If document is unreadable or empty, record explicit warning without fabricating data
      if (!rawText.trim()) {
        extractionWarnings.push('No readable text detected in this document. Manual entry is available.')
      }

      // Check for multiple plausible dates to flag potential ambiguity
      const allDates = OcrScanController.extractAllDatesFromText(rawText)
      if (allDates.length > 1) {
        extractionWarnings.push(`Multiple dates detected in document (${allDates.join(', ')}). Please verify the confirmed Date Achieved.`)
      }

      // 3. Perform AI Category Suggestion (Advisory suggestion only)
      const classification = OcrScanController.classifyCategory(rawText)

      // 4. Perform Structured Entity Extraction (Strict Zero Fabrication)
      const extractedFields = OcrScanController.extractFieldsFromText(rawText, rawLines, classification.category)

      // 5. Construct Standardized Result Object
      const fileSizeMB = parseFloat(((file.size || 0) / (1024 * 1024)).toFixed(2))
      const result = OcrScanModel.createExtractionResult({
        evidenceId: file.evidenceId || null,
        fileName: file.name || 'document',
        fileSizeMB,
        fileType: securityCheck.fileType || 'PDF',
        extractedText: rawText,
        detectedCategory: rawText.trim() ? classification.category : null,
        confidenceScore: rawText.trim() ? classification.confidence : 0,
        matchedKeywords: classification.matchedKeywords,
        extractedFields,
        rawLines,
        pages,
        extractionWarnings
      })
      result.documentQuality = backendDocument?.quality || { score: 0, label: 'failed' }
      result.ocrEngine = backendDocument?.engine || 'backend'

      return { success: true, result }
    } catch (err) {
      console.error('OCR Processing Error:', err)
      return {
        success: false,
        error: 'OCR processing error. Your uploaded file remains safely stored. You may enter details manually.'
      }
    }
  }

  /**
   * Intelligent NDMU Category Classifier using weighted keyword matrix matching
   * @param {string} text 
   * @returns {{ category: string, confidence: number, matchedKeywords: string[] }}
   */
  static classifyCategory(text) {
    if (!text || text.trim() === '') {
      return {
        category: null,
        confidence: 0,
        matchedKeywords: []
      }
    }
    const uppercaseText = text.toUpperCase()
    const rules = OcrScanModel.CATEGORY_RULES

    let maxScore = -999
    let bestCategory = 'A.3 Attendance to Seminars/Trainings'
    let bestMatches = []
    const ranked = []

    for (const [catKey, rule] of Object.entries(rules)) {
      let score = 0
      const matched = []

      // High confidence keywords (+25 pts each)
      for (const kw of rule.highKeywords) {
        if (uppercaseText.includes(kw)) {
          score += 25
          matched.push(kw)
        }
      }

      // Medium confidence keywords (+10 pts each)
      for (const kw of rule.mediumKeywords) {
        if (uppercaseText.includes(kw)) {
          score += 10
          if (matched.length < 4) matched.push(kw)
        }
      }

      // Negative keywords (-30 pts penalty)
      for (const kw of rule.negativeKeywords) {
        if (uppercaseText.includes(kw)) {
          score -= 30
        }
      }

      if (score > maxScore) {
        maxScore = score
        bestCategory = catKey
        bestMatches = matched
      }
      ranked.push({ category: catKey, score, matchedKeywords: matched })
    }

    if (maxScore <= 0) {
      return {
        category: null,
        confidence: 0,
        matchedKeywords: []
        , alternatives: []
      }
    }

    // Evidence-proportional score. There is deliberately no confidence floor.
    const confidence = Math.min(98, Math.round(35 + (63 * (1 - Math.exp(-maxScore / 45)))))

    let alternatives = ranked
      .filter((candidate) => candidate.category !== bestCategory && candidate.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ category, matchedKeywords }) => ({ category, matchedKeywords }))
    const genericRecognition = /CERTIFICATE OF (?:RECOGNITION|APPRECIATION)/.test(uppercaseText)
      && !/(AWARDEE|WINNER|RECIPIENT|NOMINEE|RESOURCE PERSON|GUEST LECTURER|JUDGE|SPEAKER|RENDERED SERVICE|VOLUNTEER)/.test(uppercaseText)
    if (genericRecognition) {
      alternatives = ['B.1 Guest Lecturer / Consultant / Judge', 'C.1 Extra-Curricular Activities', 'C.2 Community Involvement']
        .filter((category) => category !== bestCategory)
        .map((category) => ({ category, matchedKeywords: [] }))
    }

    return {
      category: bestCategory,
      confidence,
      matchedKeywords: bestMatches,
      alternatives
    }
  }

  /**
   * Structured entity extractor for Certificate Titles, Issuers, Dates, Scope, and Roles.
   * STRICT ZERO-FABRICATION POLICY: Fields not present in actual evidence text remain completely blank.
   * Filenames are NEVER inspected or used for extraction.
   * Missing dates do NOT default to today's date.
   * Missing scopes do NOT default to National.
   * Missing issuers do NOT default to NDMU.
   */
  static extractFieldsFromText(rawText, rawLines, category = null) {
    if (!rawText || rawText.trim() === '') {
      return {
        title: '',
        issuer: '',
        date: '',
        academicYear: '',
        scopeLevel: '',
        specificRole: '',
        degreeLevel: '',
        pubType: '',
        awardType: '',
        matType: '',
        fundingStatus: '',
        subType: '',
        additionalDetails: ''
      }
    }

    const uppercaseText = rawText.toUpperCase()

    // 1. Extract Explicit Date
    const extractedDate = OcrScanController.extractDateFromText(rawText)
    const academicYear = extractedDate ? OcrScanController.inferAcademicYear(extractedDate) : ''

    // 2. Extract Scope Level (Only if explicitly stated in text)
    let scopeLevel = ''
    if (uppercaseText.includes('INTERNATIONAL') || uppercaseText.includes('GLOBAL')) {
      scopeLevel = 'International'
    } else if (uppercaseText.includes('REGIONAL') || uppercaseText.includes('REGION XII')) {
      scopeLevel = 'Regional'
    } else if (uppercaseText.includes('CITY LEVEL') || uppercaseText.includes('LOCAL COMMUNITY') || uppercaseText.includes('MUNICIPAL')) {
      scopeLevel = 'City / Local'
    } else if (uppercaseText.includes('IN-HOUSE') || uppercaseText.includes('INSTITUTIONAL LEVEL') || uppercaseText.includes('CAMPUS-WIDE')) {
      scopeLevel = 'In-House'
    } else if (uppercaseText.includes('NATIONAL')) {
      scopeLevel = 'National'
    }

    // 3. Extract Issuer / Organization (Preserve extracted phrasing without fabricating unstated location)
    let issuer = ''
    const issuerTriggers = [
      'CONFERRED BY:', 'ISSUED BY:', 'ORGANIZED BY:', 'PRESENTED BY:',
      'PUBLISHED BY:', 'CONFERRING BODY:', 'ORGANIZER:'
    ]
    for (let i = 0; i < rawLines.length; i++) {
      const lineUpper = rawLines[i].toUpperCase()
      for (const trigger of issuerTriggers) {
        if (lineUpper.includes(trigger)) {
          const after = rawLines[i].substring(lineUpper.indexOf(trigger) + trigger.length).trim()
          if (after.length > 3) {
            issuer = after
            break
          } else if (i + 1 < rawLines.length && rawLines[i + 1].length > 3) {
            issuer = rawLines[i + 1].trim()
            break
          }
        }
      }
      if (issuer) break
    }

    if (!issuer) {
      if (uppercaseText.includes('NOTRE DAME OF MARBEL UNIVERSITY')) issuer = 'Notre Dame of Marbel University'
      else if (uppercaseText.includes('PHILIPPINE COMPUTER SOCIETY')) issuer = 'Philippine Computer Society'
      else if (uppercaseText.includes('DEPARTMENT OF SCIENCE AND TECHNOLOGY')) issuer = 'Department of Science and Technology'
      else if (uppercaseText.includes('COMMISSION ON HIGHER EDUCATION')) issuer = 'Commission on Higher Education'
      else if (uppercaseText.includes('PSITE')) issuer = 'PSITE'
      else if (uppercaseText.includes('IEEE')) issuer = 'IEEE'
      else if (uppercaseText.includes('ATENEO DE MANILA UNIVERSITY')) issuer = 'Ateneo de Manila University'
      else if (uppercaseText.includes('CHED')) issuer = 'CHED'
      else if (uppercaseText.includes('DOST')) issuer = 'DOST'
    }

    // 4. Extract Primary Title (Look for trigger phrases or prominent header line)
    let title = ''
    const titleTriggers = [
      'TITLE:', 'TOPIC:', 'DEGREE OF', 'PARTICIPATED IN THE', 'WORKSHOP ON',
      'PUBLISHED IN', 'PROJECT TITLE:', 'AWARDED TO', 'FOR BEING', 'SEMINAR ON',
      'ENTITLED:', 'THE PAPER ENTITLED'
    ]

    for (let i = 0; i < rawLines.length; i++) {
      const lineUpper = rawLines[i].toUpperCase()
      for (const trigger of titleTriggers) {
        if (lineUpper.includes(trigger)) {
          const afterTrigger = rawLines[i].substring(lineUpper.indexOf(trigger) + trigger.length).trim()
          if (afterTrigger.length > 5) {
            title = afterTrigger
            break
          } else if (i + 1 < rawLines.length && rawLines[i + 1].length > 4) {
            title = rawLines[i + 1].trim()
            break
          }
        }
      }
      if (title) break
    }

    // Heuristic: Candidate line if triggers not found
    if (!title && rawLines.length >= 2) {
      const candidateLine = rawLines.find(l => 
        l.length > 10 && 
        !l.toUpperCase().includes('CERTIFICATE') && 
        !l.toUpperCase().includes('NOTRE DAME') &&
        !l.toUpperCase().includes('THIS IS TO CERTIFY')
      )
      if (candidateLine) title = candidateLine
    }

    // 5. Tailored Category Fields (Only populated when explicit text keywords exist)
    let degreeLevel = ''
    if (uppercaseText.includes('DOCTOR OF PHILOSOPHY') || uppercaseText.includes('PH.D. DEGREE') || uppercaseText.includes('DOCTORAL DEGREE')) {
      degreeLevel = 'Ph.D. Degree Holder'
    } else if (uppercaseText.includes('MASTER OF SCIENCE') || uppercaseText.includes('MASTER OF ARTS') || uppercaseText.includes("MASTER'S DEGREE")) {
      degreeLevel = "Master's Degree Holder"
    } else if (uppercaseText.includes('COMPLETED UNITS') || uppercaseText.includes('DOCTORAL UNITS')) {
      degreeLevel = 'Ph.D. Units'
    }

    const unitsMatch = rawText.match(/\b(?:completed\s+)?(\d{1,3})\s+(?:graduate\s+|doctoral\s+|master'?s?\s+)?units(?:\s+completed)?\b/i)
    const unitsCompleted = unitsMatch && Number(unitsMatch[1]) <= 300 ? unitsMatch[1] : ''

    const degreeEntities = category?.startsWith('A.1')
      ? OcrScanController.extractDegreeEntities(rawText, rawLines)
      : null
    if (degreeEntities) {
      degreeLevel = degreeEntities.degreeLevel.value
      title = degreeEntities.degreeTitle.value
      issuer = degreeEntities.institution.value
    }

    let pubType = ''
    if (uppercaseText.includes('PUBLISHED BOOK') || uppercaseText.includes('MONOGRAPH') || uppercaseText.includes('ISBN')) {
      pubType = 'Book'
    } else if (uppercaseText.includes('JOURNAL') || uppercaseText.includes('SCOPUS') || uppercaseText.includes('IEEE') || uppercaseText.includes('SCHOLARLY PAPER')) {
      pubType = 'Scholarly Paper'
    } else if (uppercaseText.includes('ARTICLE')) {
      pubType = 'Article'
    }

    let specificRole = ''
    if (uppercaseText.includes('KEYNOTE SPEAKER') || uppercaseText.includes('PLENARY SPEAKER')) {
      specificRole = 'Keynote Speaker'
    } else if (uppercaseText.includes('RESOURCE PERSON') || uppercaseText.includes('RESOURCE SPEAKER') || uppercaseText.includes('GUEST LECTURER')) {
      specificRole = 'Resource Person'
    } else if (uppercaseText.includes('JUDGE') || uppercaseText.includes('PANELIST')) {
      specificRole = 'Judge'
    } else if (uppercaseText.includes('FACILITATOR') || uppercaseText.includes('TRAINER')) {
      specificRole = 'Facilitator'
    } else if (uppercaseText.includes('PARTICIPANT') || uppercaseText.includes('ATTENDEE') || uppercaseText.includes('PARTICIPATED') || uppercaseText.includes('ATTENDED')) {
      specificRole = 'Participant'
    } else if (uppercaseText.includes('LEAD RESEARCHER') || uppercaseText.includes('PRINCIPAL INVESTIGATOR')) {
      specificRole = 'Lead Researcher'
    }

    let awardType = ''
    if (uppercaseText.includes('AWARDEE') || uppercaseText.includes('AWARD OF EXCELLENCE') || uppercaseText.includes('OUTSTANDING')) {
      awardType = 'Awardee'
    } else if (uppercaseText.includes('NOMINEE') || uppercaseText.includes('FINALIST')) {
      awardType = 'Finalist'
    }

    let fundingStatus = ''
    if (uppercaseText.includes('EXTERNALLY FUNDED')) {
      fundingStatus = 'Externally Funded Research Project'
    } else if (uppercaseText.includes('INSTITUTIONAL RESEARCH') || uppercaseText.includes('INSTITUTIONALLY FUNDED')) {
      fundingStatus = 'Completed Institutional Research'
    } else if (uppercaseText.includes('DEPARTMENTAL RESEARCH')) {
      fundingStatus = 'Departmental Research'
    }

    let matType = ''
    if (uppercaseText.includes('WORKBOOK') || uppercaseText.includes('LABORATORY MANUAL') || uppercaseText.includes('LECTURE NOTES')) {
      matType = 'Workbooks / Exercises / Lecture Notes (Bound)'
    }

    let subType = ''
    if (uppercaseText.includes('MODERATOR') || uppercaseText.includes('CLUB ADVISER')) {
      subType = 'C.1.1 Moderator of Clubs / Organizations'
    } else if (uppercaseText.includes('CHURCH') || uppercaseText.includes('COMMUNITY') || uppercaseText.includes('PARISH')) {
      subType = 'C.2.1 Community Service / Outreach'
    }

    return {
      title: title || '',
      issuer: issuer || '',
      date: extractedDate || '',
      academicYear: academicYear || '',
      scopeLevel: scopeLevel || '',
      specificRole: specificRole || '',
      degreeLevel: degreeLevel || '',
      unitsCompleted,
      pubType: pubType || '',
      awardType: awardType || '',
      matType: matType || '',
      fundingStatus: fundingStatus || '',
      subType: subType || '',
      additionalDetails: title ? `Extracted via AchieveNest OCR Engine on ${new Date().toLocaleDateString()}` : '',
      fieldMetadata: degreeEntities ? {
        title: degreeEntities.degreeTitle,
        issuer: degreeEntities.institution,
        degreeLevel: degreeEntities.degreeLevel,
        date: degreeEntities.date,
        unitsCompleted: { value: unitsCompleted, confidence: unitsCompleted ? 90 : 0, source: unitsCompleted ? 'ocr' : 'not_found', evidenceText: unitsMatch?.[0] || '' }
      } : {}
    }
  }

  static extractDegreeEntities(rawText, rawLines = []) {
    const lines = rawLines.length ? rawLines : rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    const institutionPattern = /\b(university|college|institute|academy|school|polytechnic|conservatory)\b/i
    const recipientPattern = /^(?:dr\.?|mr\.?|ms\.?|mrs\.?)\s+[\p{L}\p{M}.' -]{3,}$/iu
    const degreePattern = /\b((?:doctor of (?:philosophy|education)|master(?: of| in) [\p{L}\p{M} &-]+|bachelor(?: of| in) [\p{L}\p{M} &-]+)(?:[ \t]*\([^\n)]{2,12}\))?(?:[ \t]+in[ \t]+[\p{L}\p{M} &-]+)?)/giu

    const institutionLine = lines.find(line => institutionPattern.test(line) && !/doctor|master|bachelor/i.test(line)) || ''
    const degreeMatches = Array.from(rawText.matchAll(degreePattern)).map(match => match[1]).sort((a, b) => b.length - a.length)
    const degreeEvidence = degreeMatches[0] || ''
    let degreeTitle = degreeEvidence.replace(/\s*\((?:Ph\.?D\.?|Ed\.?D\.?)\)\s*/i, ' ').replace(/\s+/g, ' ').trim()
    if (institutionPattern.test(degreeTitle) || recipientPattern.test(degreeTitle)) degreeTitle = ''

    const level = OcrScanController.resolveDegreeLevel(degreeEvidence || rawText)
    const date = OcrScanController.extractDateFromText(rawText)
    return {
      degreeLevel: { ...level, source: level.value ? 'ocr' : 'not_found', evidenceText: level.matchedAlias || '' },
      degreeTitle: { value: degreeTitle, confidence: degreeTitle ? 96 : 0, source: degreeTitle ? 'ocr' : 'not_found', evidenceText: degreeEvidence },
      institution: { value: institutionLine, confidence: institutionLine ? 94 : 0, source: institutionLine ? 'ocr' : 'not_found', evidenceText: institutionLine },
      date: { value: date, confidence: date ? 96 : 0, source: date ? 'ocr' : 'not_found', evidenceText: date }
    }
  }

  static resolveDegreeLevel(text = '') {
    const normalized = text.toLowerCase().replace(/[^a-z]+/g, ' ').trim()
    const aliases = [
      { value: 'Ph.D. Degree Holder', patterns: ['doctor of philosophy', 'phd', 'ph d', 'doctorate'], confidence: 98 },
      { value: "Master's Degree Holder", patterns: ['master of science', 'master of arts', 'master in', 'mba', 'm s', 'm a'], confidence: 97 }
    ]
    for (const option of aliases) {
      const match = option.patterns.find(alias => normalized.includes(alias))
      if (match) return { value: option.value, confidence: option.confidence, matchedAlias: match }
    }
    return { value: '', confidence: 0, matchedAlias: null }
  }

  /**
   * Helper to parse date string from raw OCR text.
   * Returns empty string if no valid date is found. Never defaults to current date.
   * Validates calendar boundaries (month 1-12, days 1-31).
   * @param {string} text 
   * @returns {string} ISO Date (YYYY-MM-DD) or empty string
   */
  static extractDateFromText(text) {
    if (!text) return ''

    // 1. Regex for YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = text.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/)
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10)
      const m = parseInt(isoMatch[2], 10)
      const d = parseInt(isoMatch[3], 10)
      if (OcrScanController.isValidCalendarDate(y, m, d)) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      }
    }

    // 2. Regex for Month DD, YYYY (e.g. August 14, 2025 or September 4, 2026)
    const monthMatch = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+([0-2]?\d|3[01]),?\s+(20\d{2})\b/i)
    if (monthMatch) {
      const dateObj = new Date(monthMatch[0])
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getFullYear()
        const m = dateObj.getMonth() + 1
        const d = dateObj.getDate()
        if (OcrScanController.isValidCalendarDate(y, m, d)) {
          return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        }
      }
    }

    // 3. Regex for DD Month YYYY (e.g. 14 August 2025)
    const dayMonthMatch = text.match(/\b([0-2]?\d|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i)
    if (dayMonthMatch) {
      const dateObj = new Date(dayMonthMatch[0])
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getFullYear()
        const m = dateObj.getMonth() + 1
        const d = dateObj.getDate()
        if (OcrScanController.isValidCalendarDate(y, m, d)) {
          return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        }
      }
    }

    return ''
  }

  /**
   * Helper to find all distinct valid dates in raw text to detect potential ambiguity.
   * @param {string} text
   * @returns {string[]} Deduplicated array of ISO dates (YYYY-MM-DD)
   */
  static extractAllDatesFromText(text) {
    if (!text) return []
    const dates = new Set()

    // 1. Match ISO dates (YYYY-MM-DD or YYYY/MM/DD)
    const isoRegex = /\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/g
    let match
    while ((match = isoRegex.exec(text)) !== null) {
      const y = parseInt(match[1], 10)
      const m = parseInt(match[2], 10)
      const d = parseInt(match[3], 10)
      if (OcrScanController.isValidCalendarDate(y, m, d)) {
        dates.add(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
      }
    }

    // 2. Match Month DD, YYYY
    const monthRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+([0-2]?\d|3[01]),?\s+(20\d{2})\b/gi
    while ((match = monthRegex.exec(text)) !== null) {
      const dateObj = new Date(match[0])
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getFullYear()
        const m = dateObj.getMonth() + 1
        const d = dateObj.getDate()
        if (OcrScanController.isValidCalendarDate(y, m, d)) {
          dates.add(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
        }
      }
    }

    // 3. Match DD Month YYYY
    const dayMonthRegex = /\b([0-2]?\d|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/gi
    while ((match = dayMonthRegex.exec(text)) !== null) {
      const dateObj = new Date(match[0])
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getFullYear()
        const m = dateObj.getMonth() + 1
        const d = dateObj.getDate()
        if (OcrScanController.isValidCalendarDate(y, m, d)) {
          dates.add(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
        }
      }
    }

    return Array.from(dates)
  }

  /**
   * Helper to validate calendar date boundaries (e.g. rejects Feb 30/31).
   */
  static isValidCalendarDate(year, month, day) {
    if (month < 1 || month > 12) return false
    if (day < 1 || day > 31) return false
    const daysInMonth = new Date(year, month, 0).getDate()
    return day <= daysInMonth
  }

  /**
   * Helper to infer Academic Year strictly from confirmed date string.
   * If dateStr is empty/invalid, returns empty string.
   * @param {string} dateStr
   * @returns {string}
   */
  static inferAcademicYear(dateStr) {
    if (!dateStr || String(dateStr).trim() === '') return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const startYear = month >= 6 ? year : year - 1
    return `AY ${startYear}-${startYear + 1}`
  }
}
