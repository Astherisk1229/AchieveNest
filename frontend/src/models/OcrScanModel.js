/**
 * OcrScanModel.js
 * Model representing OCR text extraction data, entity mapping schemas,
 * category classification rule matrices, and zero-fabrication extraction contracts
 * for NDMU Personnel accomplishments.
 */

export default class OcrScanModel {
  /**
   * Official NDMU Rating Sheet Categories
   */
  static CATEGORIES = Object.freeze([
    'A.1 Degree/s',
    'A.2 Active Membership to Prof Orgs',
    'A.3 Attendance to Seminars/Trainings',
    'B.1 Guest Lecturer / Consultant / Judge',
    'B.2 Publication',
    'B.3 Conduct of Research',
    'B.4 Professional Recognition or Awards',
    'B.5 Production of Instructional Materials',
    'B.6 Creative Work',
    'C.1 Extra-Curricular Activities',
    'C.2 Community Involvement'
  ])

  /**
   * Classification Rules & Keyword Matrices for NDMU Categories (Advisory Suggestions Only)
   */
  static CATEGORY_RULES = Object.freeze({
    'A.1 Degree/s': {
      label: 'Area A.1 Educational Qualifications / Degrees',
      highKeywords: [
        'DOCTOR OF PHILOSOPHY', 'PH.D.', 'MASTER OF SCIENCE', 'MASTER OF ARTS',
        'BACHELOR OF SCIENCE', 'BACHELOR OF ARTS', 'DEGREE OF', 'TRANSCRIPT OF RECORDS',
        'DIPLOMA', 'GRADUATED', 'UNITS COMPLETED', 'CONFERRED UPON'
      ],
      mediumKeywords: ['UNIVERSITY', 'COLLEGE', 'GRADUATE SCHOOL', 'ACADEMIC', 'COMMENCEMENT', 'MAGNA CUM LAUDE', 'SUMMA CUM LAUDE'],
      negativeKeywords: ['CERTIFICATE OF PARTICIPATION', 'ATTENDED', 'SPEAKER', 'RESOURCE PERSON']
    },

    'A.2 Active Membership to Prof Orgs': {
      label: 'Area A.2 Membership in Professional Organizations',
      highKeywords: [
        'MEMBERSHIP CERTIFICATE', 'MEMBER IN GOOD STANDING', 'REGULAR MEMBER',
        'OFFICER OF THE BOARD', 'BOARD OF DIRECTORS', 'ELECTED AS', 'MEMBERSHIP DUES',
        'PHILIPPINE COMPUTER SOCIETY', 'PSITE', 'IEEE MEMBER', 'ACM MEMBER'
      ],
      mediumKeywords: ['ORGANIZATION', 'ASSOCIATION', 'CHAPTER', 'SOCIETY', 'FEDERATION', 'COUNCIL', 'CHARTER'],
      negativeKeywords: ['ATTENDED SEMINAR', 'PUBLISHED', 'COMPLETED RESEARCH']
    },

    'A.3 Attendance to Seminars/Trainings': {
      label: 'Area A.3 Attendance to Seminars / Trainings',
      highKeywords: [
        'CERTIFICATE OF PARTICIPATION', 'CERTIFICATE OF ATTENDANCE', 'PARTICIPATED IN',
        'ATTENDED THE SEMINAR', 'COMPLETED THE TRAINING', 'WORKSHOP ON', 'FACULTY DEVELOPMENT PROGRAM',
        'NATIONAL WEBINAR', 'CONTINUING PROFESSIONAL DEVELOPMENT', 'CPD UNITS'
      ],
      mediumKeywords: ['SEMINAR', 'WORKSHOP', 'CONFERENCE', 'TRAINING', 'SYMPOSIUM', 'WEBINAR', 'ATTENDEE'],
      negativeKeywords: ['KEYNOTE SPEAKER', 'RESOURCE SPEAKER', 'GUEST LECTURER', 'INVITED SPEAKER']
    },

    'B.1 Guest Lecturer / Consultant / Judge': {
      label: 'Area B.1 Guest Lecturer / Resource Person / Consultant',
      highKeywords: [
        'KEYNOTE SPEAKER', 'RESOURCE PERSON', 'GUEST LECTURER', 'PLENARY SPEAKER',
        'INVITED SPEAKER', 'SESSION CHAIR', 'PANEL MEMBER', 'JUDGE OF THE',
        'EVALUATOR FOR', 'CONSULTANT FOR'
      ],
      mediumKeywords: ['TALK', 'PRESENTED BY', 'SHARING EXPERTISE', 'GUEST SPEAKER', 'PANELIST', 'MODERATOR'],
      negativeKeywords: ['CERTIFICATE OF PARTICIPATION', 'CERTIFICATE OF ATTENDANCE', 'STUDENT PARTICIPANT']
    },

    'B.2 Publication': {
      label: 'Area B.2 Publication (Papers, Books, Articles)',
      highKeywords: [
        'JOURNAL OF', 'ISSN', 'ISBN', 'PUBLISHED IN', 'SCOPUS', 'IEEE XPLORE',
        'VOLUME', 'ISSUE', 'PEER-REVIEWED', 'PROCEEDINGS OF', 'RESEARCH PAPER',
        'BOOK AUTHOR', 'BOOK CHAPTER'
      ],
      mediumKeywords: ['PUBLICATION', 'ARTICLE', 'DOI', 'PUBLISHER', 'SCHOLARLY', 'MANUSCRIPT'],
      negativeKeywords: ['CERTIFICATE OF PARTICIPATION', 'ATTENDED SEMINAR']
    },

    'B.3 Conduct of Research': {
      label: 'Area B.3 Conduct of Research',
      highKeywords: [
        'GRANT AWARD', 'PRINCIPAL INVESTIGATOR', 'LEAD RESEARCHER', 'CO-INVESTIGATOR',
        'RESEARCH GRANT', 'FUNDED RESEARCH', 'COMPLETED RESEARCH PROJECT',
        'INSTITUTIONAL RESEARCH', 'COMMISSIONED RESEARCH'
      ],
      mediumKeywords: ['RESEARCH', 'STUDY', 'PROJECT', 'FUNDING', 'DOST', 'CHED GRANT', 'NATIONAL RESEARCH'],
      negativeKeywords: ['ATTENDED SEMINAR', 'STUDENT ATHLETE']
    },

    'B.4 Professional Recognition or Awards': {
      label: 'Area B.4 Professional Recognition or Awards',
      highKeywords: [
        'CERTIFICATE OF RECOGNITION', 'AWARD OF EXCELLENCE', 'OUTSTANDING FACULTY',
        'BEST PAPER AWARD', 'PLAQUE OF RECOGNITION', 'HONORABLE MENTION',
        'DISTINGUISHED TEACHER', 'CONFERRED WITH THE AWARD'
      ],
      mediumKeywords: ['AWARD', 'RECOGNITION', 'HONOR', 'OUTSTANDING', 'PLAQUE', 'MEDAL', 'CITATION'],
      negativeKeywords: ['CERTIFICATE OF ATTENDANCE', 'REGULAR MEMBER']
    },

    'B.5 Production of Instructional Materials': {
      label: 'Area B.5 Production of Instructional Materials',
      highKeywords: [
        'INSTRUCTIONAL MATERIAL', 'LABORATORY MANUAL', 'WORKBOOK', 'MODULE',
        'LECTURE NOTES (BOUND)', 'COURSE MANUAL', 'TEACHING GUIDE', 'TEXTBOOK'
      ],
      mediumKeywords: ['SYLLABUS', 'MANUAL', 'BOUND', 'EXERCISES', 'COURSEWARE', 'REVIEWER'],
      negativeKeywords: ['ATTENDED SEMINAR', 'KEYNOTE SPEAKER']
    },

    'B.6 Creative Work': {
      label: 'Area B.6 Creative Work',
      highKeywords: [
        'CREATIVE WORK', 'EXHIBITION', 'PATENT', 'COPYRIGHT REGISTRATION',
        'SOFTWARE ARTIFACT', 'ARTISTIC PERFORMANCE', 'DIGITAL ARCHIVE', 'INVENTION'
      ],
      mediumKeywords: ['CREATIVE', 'DESIGN', 'PERFORMANCE', 'GALLERY', 'EXHIBIT', 'PATENTED'],
      negativeKeywords: ['CERTIFICATE OF ATTENDANCE']
    },

    'C.1 Extra-Curricular Activities': {
      label: 'Area C.1 School Involvement (Extracurricular / Orgs)',
      highKeywords: [
        'CLUB MODERATOR', 'STUDENT ORGANIZATION ADVISER', 'FACULTY ADVISER',
        'WORKING COMMITTEE CHAIR', 'EVENT COACH', 'TRAINER FOR', 'INSTITUTIONAL COMMITTEE'
      ],
      mediumKeywords: ['MODERATOR', 'COACH', 'COMMITTEE', 'ORGANIZATION ADVISER', 'CAMPUS ACTIVITIES'],
      negativeKeywords: ['PUBLISHED IN JOURNAL', 'CPD UNITS']
    },

    'C.2 Community Involvement': {
      label: 'Area C.2 Community & Civic Involvement',
      highKeywords: [
        'OUTREACH PROGRAM', 'COMMUNITY SERVICE', 'CIVIC VOLUNTEER', 'PARISH INVOLVEMENT',
        'CHURCH SERVICE', 'BARANGAY LITERACY', 'EXTENSION PROJECT', 'CHARITY WORK'
      ],
      mediumKeywords: ['COMMUNITY', 'CIVIC', 'OUTREACH', 'EXTENSION', 'VOLUNTEER', 'PARISH', 'LGU'],
      negativeKeywords: ['PUBLISHED IN SCOPUS', 'ATTENDED SEMINAR']
    }
  })

  /**
   * Helper to construct a field entry with metadata
   */
  static createFieldEntry(value = '', confidence = null, source = 'not_found', evidenceText = '') {
    const isPresent = value !== undefined && value !== null && String(value).trim() !== ''
    return {
      value: isPresent ? String(value).trim() : '',
      confidence: isPresent ? confidence : null,
      source: isPresent ? source : 'not_found',
      evidenceText: isPresent ? String(evidenceText || value).trim() : ''
    }
  }

  /**
   * Creates a standardized result structure for OCR processing adhering strictly to Zero Fabrication.
   */
  static createExtractionResult({
    evidenceId = null,
    fileName = '',
    fileSizeMB = 0,
    fileType = 'PDF',
    extractedText = '',
    detectedCategory = null,
    confidenceScore = null,
    matchedKeywords = [],
    extractedFields = {},
    rawLines = [],
    pages = [],
    extractionWarnings = []
  }) {
    // Normalizing individual field descriptors
    const rawF = extractedFields || {}
    
    // Ensure helper handles both plain strings and structured objects
    const resolveField = (key, fallbackSource = 'ocr') => {
      const item = rawF[key]
      if (item && typeof item === 'object' && 'value' in item) {
        return OcrScanModel.createFieldEntry(item.value, item.confidence, item.source || fallbackSource, item.evidenceText)
      }
      return OcrScanModel.createFieldEntry(item || '', item ? 80 : null, item ? fallbackSource : 'not_found', item || '')
    }

    const titleField = resolveField('title')
    const issuerField = resolveField('issuer')
    const dateField = resolveField('date')
    const academicYearField = resolveField('academicYear', 'derived')
    const scopeLevelField = resolveField('scopeLevel')
    const specificRoleField = resolveField('specificRole')
    const degreeLevelField = resolveField('degreeLevel')
    const pubTypeField = resolveField('pubType')
    const awardTypeField = resolveField('awardType')
    const matTypeField = resolveField('matType')
    const fundingStatusField = resolveField('fundingStatus')
    const subTypeField = resolveField('subType')

    return {
      id: `ocr-${Date.now()}`,
      evidenceId,
      fileName,
      fileSizeMB,
      fileType,
      extractedText,
      rawText: extractedText,
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: extractedText }],
      
      // Advisory Category Classification (Strictly Suggestion Only)
      detectedCategory: detectedCategory || null,
      suggestedCategory: {
        value: detectedCategory || null,
        confidence: confidenceScore || 0,
        matchedKeywords: matchedKeywords || [],
        isSuggestionOnly: true
      },

      confidenceScore: confidenceScore !== null ? confidenceScore : (extractedText.trim() ? 70 : 0),
      matchedKeywords: matchedKeywords || [],

      // Structured Source-Aware Fields Contract
      fields: {
        title: titleField,
        issuer: issuerField,
        dateAchieved: dateField,
        academicYear: academicYearField,
        scopeLevel: scopeLevelField,
        role: specificRoleField,
        degreeLevel: degreeLevelField,
        pubType: pubTypeField,
        awardType: awardTypeField,
        matType: matTypeField,
        fundingStatus: fundingStatusField,
        subType: subTypeField
      },

      // Flat compatibility shape for legacy consumer components
      extractedFields: {
        title: titleField.value,
        issuer: issuerField.value,
        date: dateField.value,
        academicYear: academicYearField.value,
        scopeLevel: scopeLevelField.value,
        specificRole: specificRoleField.value,
        degreeLevel: degreeLevelField.value,
        pubType: pubTypeField.value,
        awardType: awardTypeField.value,
        matType: matTypeField.value,
        fundingStatus: fundingStatusField.value,
        subType: subTypeField.value
      },

      extractionWarnings: Array.isArray(extractionWarnings) ? extractionWarnings : [],
      rawLines: Array.isArray(rawLines) ? rawLines : [],
      scannedAt: new Date().toISOString()
    }
  }
}
