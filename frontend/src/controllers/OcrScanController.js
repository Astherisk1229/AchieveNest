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
      const textExtraction = await OcrScanController.extractTextFromFile(file)
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
   * Extracts text content from genuine PDF or image files without fabrication.
   * Extracts genuine text layers from PDF streams or text readers.
   * @param {File|Blob} file
   * @returns {Promise<{ text: string, lines: string[], pages: Array<{pageNumber: number, text: string}>, warnings: string[] }>}
   */
  static async extractTextFromFile(file) {
    if (!file) {
      return { text: '', lines: [], pages: [], warnings: ['No file provided.'] }
    }

    const fileName = (file.name || '').toLowerCase()
    const isPdf = fileName.endsWith('.pdf') || (file.type && file.type.includes('pdf'))

    return new Promise((resolve) => {
      if (typeof FileReader === 'undefined') {
        resolve({ text: '', lines: [], pages: [], warnings: ['FileReader API not available.'] })
        return
      }

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const buffer = e.target.result
          let extractedText = ''
          const warnings = []

          if (isPdf) {
            // Extract text from PDF buffer
            extractedText = OcrScanController.extractTextFromPdfBuffer(buffer)
            if (!extractedText.trim()) {
              warnings.push('PDF does not contain an embedded text layer. Please enter accomplishment details manually.')
            }
          } else {
            // For images or plain text files
            if (typeof buffer === 'string') {
              extractedText = buffer
            } else {
              const decoder = new TextDecoder('utf-8', { fatal: false })
              extractedText = decoder.decode(buffer)
            }
          }

          // Clean lines
          const lines = extractedText
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l.length > 0)

          resolve({
            text: extractedText.trim(),
            lines,
            pages: [{ pageNumber: 1, text: extractedText.trim() }],
            warnings
          })
        } catch (err) {
          resolve({
            text: '',
            lines: [],
            pages: [],
            warnings: ['Failed to extract text from file binary.']
          })
        }
      }

      reader.onerror = () => {
        resolve({
          text: '',
          lines: [],
          pages: [],
          warnings: ['Error reading file stream.']
        })
      }

      // Read as ArrayBuffer for binary inspection
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Parses PDF binary stream to extract embedded text tokens and Tj/TJ strings.
   * @param {ArrayBuffer} buffer 
   * @returns {string}
   */
  static extractTextFromPdfBuffer(buffer) {
    if (!buffer) return ''
    try {
      const decoder = new TextDecoder('utf-8', { fatal: false })
      const rawString = decoder.decode(buffer)
      
      const textChunks = []

      // 1. Search for literal text inside parentheses before Tj: (Some Text) Tj
      const tjRegex = /\(([^)]+)\)\s*Tj/g
      let match
      while ((match = tjRegex.exec(rawString)) !== null) {
        const cleaned = match[1].replace(/\\([()\\])/g, '$1').trim()
        if (cleaned) textChunks.push(cleaned)
      }

      // 2. Search for array text tokens before TJ: [(Some) 20 (Text)] TJ
      const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g
      while ((match = arrayTjRegex.exec(rawString)) !== null) {
        const inner = match[1]
        const subStrings = []
        const innerMatchRegex = /\(([^)]+)\)/g
        let subMatch
        while ((subMatch = innerMatchRegex.exec(inner)) !== null) {
          const cleaned = subMatch[1].replace(/\\([()\\])/g, '$1').trim()
          if (cleaned) subStrings.push(cleaned)
        }
        if (subStrings.length > 0) {
          textChunks.push(subStrings.join(' '))
        }
      }

      // 3. Search for plain text stream blocks: BT ... ET
      if (textChunks.length === 0) {
        const btRegex = /BT([\s\S]*?)ET/g
        while ((match = btRegex.exec(rawString)) !== null) {
          const block = match[1]
          const subTextRegex = /\(([^)]+)\)/g
          let subMatch
          while ((subMatch = subTextRegex.exec(block)) !== null) {
            const cleaned = subMatch[1].replace(/\\([()\\])/g, '$1').trim()
            if (cleaned) textChunks.push(cleaned)
          }
        }
      }

      // 4. Fallback if PDF was created in ASCII/plain representation
      if (textChunks.length === 0) {
        const plainLines = rawString.split(/\r?\n/)
        for (const line of plainLines) {
          const trimmed = line.trim()
          if (
            trimmed.length > 4 &&
            !trimmed.startsWith('%') &&
            !trimmed.startsWith('xref') &&
            !trimmed.startsWith('trailer') &&
            !trimmed.startsWith('startxref') &&
            !trimmed.includes('endobj') &&
            !trimmed.includes('/Type') &&
            !trimmed.includes('/Filter') &&
            !trimmed.includes('/Length')
          ) {
            textChunks.push(trimmed)
          }
        }
      }

      return textChunks.join('\n').trim()
    } catch (err) {
      return ''
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
    }

    if (maxScore <= 0) {
      return {
        category: null,
        confidence: 0,
        matchedKeywords: []
      }
    }

    // Calculate confidence percentage (min 60%, max 98%)
    let confidence = 65
    if (maxScore >= 50) confidence = 95
    else if (maxScore >= 35) confidence = 88
    else if (maxScore >= 20) confidence = 78
    else if (maxScore >= 10) confidence = 70

    return {
      category: bestCategory,
      confidence,
      matchedKeywords: bestMatches
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
  static extractFieldsFromText(rawText, rawLines) {
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
      pubType: pubType || '',
      awardType: awardType || '',
      matType: matType || '',
      fundingStatus: fundingStatus || '',
      subType: subType || '',
      additionalDetails: title ? `Extracted via AchieveNest OCR Engine on ${new Date().toLocaleDateString()}` : ''
    }
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
