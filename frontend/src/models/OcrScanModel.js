/**
 * OcrScanModel.js
 * Model representing OCR text extraction data, entity mapping schemas,
 * category classification rule matrices, and confidence rating criteria for NDMU Personnel accomplishments.
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
   * Classification Rules & Keyword Matrices for NDMU Categories
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
      negativeKeywords: ['CERTIFICATE OF PARTICIPATION', 'ATTENDED', 'SPEAKER', 'RESOURCE PERSON'],
      defaultRole: 'Degree Holder'
    },

    'A.2 Active Membership to Prof Orgs': {
      label: 'Area A.2 Membership in Professional Organizations',
      highKeywords: [
        'MEMBERSHIP CERTIFICATE', 'MEMBER IN GOOD STANDING', 'REGULAR MEMBER',
        'OFFICER OF THE BOARD', 'BOARD OF DIRECTORS', 'ELECTED AS', 'MEMBERSHIP DUES',
        'PHILIPPINE COMPUTER SOCIETY', 'PSITE', 'IEEE MEMBER', 'ACM MEMBER'
      ],
      mediumKeywords: ['ORGANIZATION', 'ASSOCIATION', 'CHAPTER', 'SOCIETY', 'FEDERATION', 'COUNCIL', 'CHARTER'],
      negativeKeywords: ['ATTENDED SEMINAR', 'PUBLISHED', 'COMPLETED RESEARCH'],
      defaultRole: 'Regular Member'
    },

    'A.3 Attendance to Seminars/Trainings': {
      label: 'Area A.3 Attendance to Seminars / Trainings',
      highKeywords: [
        'CERTIFICATE OF PARTICIPATION', 'CERTIFICATE OF ATTENDANCE', 'PARTICIPATED IN',
        'ATTENDED THE SEMINAR', 'COMPLETED THE TRAINING', 'WORKSHOP ON', 'FACULTY DEVELOPMENT PROGRAM',
        'NATIONAL WEBINAR', 'CONTINUING PROFESSIONAL DEVELOPMENT', 'CPD UNITS'
      ],
      mediumKeywords: ['SEMINAR', 'WORKSHOP', 'CONFERENCE', 'TRAINING', 'SYMPOSIUM', 'WEBINAR', 'ATTENDEE'],
      negativeKeywords: ['KEYNOTE SPEAKER', 'RESOURCE SPEAKER', 'GUEST LECTURER', 'INVITED SPEAKER'],
      defaultRole: 'Participant'
    },

    'B.1 Guest Lecturer / Consultant / Judge': {
      label: 'Area B.1 Guest Lecturer / Resource Person / Consultant',
      highKeywords: [
        'KEYNOTE SPEAKER', 'RESOURCE PERSON', 'GUEST LECTURER', 'PLENARY SPEAKER',
        'INVITED SPEAKER', 'SESSION CHAIR', 'PANEL MEMBER', 'JUDGE OF THE',
        'EVALUATOR FOR', 'CONSULTANT FOR'
      ],
      mediumKeywords: ['TALK', 'PRESENTED BY', 'SHARING EXPERTISE', 'GUEST SPEAKER', 'PANELIST', 'MODERATOR'],
      negativeKeywords: ['CERTIFICATE OF PARTICIPATION', 'CERTIFICATE OF ATTENDANCE', 'STUDENT PARTICIPANT'],
      defaultRole: 'Resource Person'
    },

    'B.2 Publication': {
      label: 'Area B.2 Publication (Papers, Books, Articles)',
      highKeywords: [
        'JOURNAL OF', 'ISSN', 'ISBN', 'PUBLISHED IN', 'SCOPUS', 'IEEE XPLORE',
        'VOLUME', 'ISSUE', 'PEER-REVIEWED', 'PROCEEDINGS OF', 'RESEARCH PAPER',
        'BOOK AUTHOR', 'BOOK CHAPTER'
      ],
      mediumKeywords: ['PUBLICATION', 'ARTICLE', 'DOI', 'PUBLISHER', 'SCHOLARLY', 'MANUSCRIPT'],
      negativeKeywords: ['CERTIFICATE OF PARTICIPATION', 'ATTENDED SEMINAR'],
      defaultRole: 'Author'
    },

    'B.3 Conduct of Research': {
      label: 'Area B.3 Conduct of Research',
      highKeywords: [
        'GRANT AWARD', 'PRINCIPAL INVESTIGATOR', 'LEAD RESEARCHER', 'CO-INVESTIGATOR',
        'RESEARCH GRANT', 'FUNDED RESEARCH', 'COMPLETED RESEARCH PROJECT',
        'INSTITUTIONAL RESEARCH', 'COMMISSIONED RESEARCH'
      ],
      mediumKeywords: ['RESEARCH', 'STUDY', 'PROJECT', 'FUNDING', 'DOST', 'CHED GRANT', 'NATIONAL RESEARCH'],
      negativeKeywords: ['ATTENDED SEMINAR', 'STUDENT ATHLETE'],
      defaultRole: 'Lead Researcher'
    },

    'B.4 Professional Recognition or Awards': {
      label: 'Area B.4 Professional Recognition or Awards',
      highKeywords: [
        'CERTIFICATE OF RECOGNITION', 'AWARD OF EXCELLENCE', 'OUTSTANDING FACULTY',
        'BEST PAPER AWARD', 'PLAQUE OF RECOGNITION', 'HONORABLE MENTION',
        'DISTINGUISHED TEACHER', 'CONFERRED WITH THE AWARD'
      ],
      mediumKeywords: ['AWARD', 'RECOGNITION', 'HONOR', 'OUTSTANDING', 'PLAQUE', 'MEDAL', 'CITATION'],
      negativeKeywords: ['CERTIFICATE OF ATTENDANCE', 'REGULAR MEMBER'],
      defaultRole: 'Awardee'
    },

    'B.5 Production of Instructional Materials': {
      label: 'Area B.5 Production of Instructional Materials',
      highKeywords: [
        'INSTRUCTIONAL MATERIAL', 'LABORATORY MANUAL', 'WORKBOOK', 'MODULE',
        'LECTURE NOTES (BOUND)', 'COURSE MANUAL', 'TEACHING GUIDE', 'TEXTBOOK'
      ],
      mediumKeywords: ['SYLLABUS', 'MANUAL', 'BOUND', 'EXERCISES', 'COURSEWARE', 'REVIEWER'],
      negativeKeywords: ['ATTENDED SEMINAR', 'KEYNOTE SPEAKER'],
      defaultRole: 'Author / Creator'
    },

    'B.6 Creative Work': {
      label: 'Area B.6 Creative Work',
      highKeywords: [
        'CREATIVE WORK', 'EXHIBITION', 'PATENT', 'COPYRIGHT REGISTRATION',
        'SOFTWARE ARTIFACT', 'ARTISTIC PERFORMANCE', 'DIGITAL ARCHIVE', 'INVENTION'
      ],
      mediumKeywords: ['CREATIVE', 'DESIGN', 'PERFORMANCE', 'GALLERY', 'EXHIBIT', 'PATENTED'],
      negativeKeywords: ['CERTIFICATE OF ATTENDANCE'],
      defaultRole: 'Creator'
    },

    'C.1 Extra-Curricular Activities': {
      label: 'Area C.1 School Involvement (Extracurricular / Orgs)',
      highKeywords: [
        'CLUB MODERATOR', 'STUDENT ORGANIZATION ADVISER', 'FACULTY ADVISER',
        'WORKING COMMITTEE CHAIR', 'EVENT COACH', 'TRAINER FOR', 'INSTITUTIONAL COMMITTEE'
      ],
      mediumKeywords: ['MODERATOR', 'COACH', 'COMMITTEE', 'ORGANIZATION ADVISER', 'CAMPUS ACTIVITIES'],
      negativeKeywords: ['PUBLISHED IN JOURNAL', 'CPD UNITS'],
      defaultRole: 'Adviser / Moderator'
    },

    'C.2 Community Involvement': {
      label: 'Area C.2 Community & Civic Involvement',
      highKeywords: [
        'OUTREACH PROGRAM', 'COMMUNITY SERVICE', 'CIVIC VOLUNTEER', 'PARISH INVOLVEMENT',
        'CHURCH SERVICE', 'BARANGAY LITERACY', 'EXTENSION PROJECT', 'CHARITY WORK'
      ],
      mediumKeywords: ['COMMUNITY', 'CIVIC', 'OUTREACH', 'EXTENSION', 'VOLUNTEER', 'PARISH', 'LGU'],
      negativeKeywords: ['PUBLISHED IN SCOPUS', 'ATTENDED SEMINAR'],
      defaultRole: 'Volunteer / Coordinator'
    }
  })

  /**
   * Creates a standardized result structure for OCR processing.
   */
  static createExtractionResult({
    fileName = '',
    fileSizeMB = 0,
    fileType = 'PDF',
    extractedText = '',
    detectedCategory = 'A.3 Attendance to Seminars/Trainings',
    confidenceScore = 85,
    matchedKeywords = [],
    extractedFields = {},
    rawLines = []
  }) {
    return {
      id: `ocr-${Date.now()}`,
      fileName,
      fileSizeMB,
      fileType,
      extractedText,
      detectedCategory,
      confidenceScore,
      matchedKeywords,
      extractedFields: {
        title: extractedFields.title || '',
        issuer: extractedFields.issuer || '',
        date: extractedFields.date || new Date().toISOString().split('T')[0],
        academicYear: extractedFields.academicYear || 'AY 2025-2026',
        scopeLevel: extractedFields.scopeLevel || 'National',
        specificRole: extractedFields.specificRole || '',
        additionalDetails: extractedFields.additionalDetails || '',
        degreeLevel: extractedFields.degreeLevel || 'Ph.D. Degree Holder',
        pubType: extractedFields.pubType || 'Scholarly Paper',
        awardType: extractedFields.awardType || 'Awardee',
        matType: extractedFields.matType || 'Workbooks / Exercises / Lecture Notes (Bound)',
        fundingStatus: extractedFields.fundingStatus || 'Completed Institutional Research',
        subType: extractedFields.subType || 'C.1.1 Moderator of Clubs / Organizations'
      },
      rawLines,
      scannedAt: new Date().toISOString()
    }
  }
}
