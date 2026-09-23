import { describe, it, expect, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  FACULTY_ACADEMIC_CATEGORIES,
  getFacultyAcademicAccomplishmentSchema,
  formatFacultyAccomplishmentTitle,
  formatFacultyAccomplishmentInstitution
} from '../../../config/facultyAcademicAccomplishmentSchema'
import {
  PORTFOLIO_FORMATS,
  resolvePersonnelPortfolioFormat,
  usesFacultyAcademicPortfolio
} from '../../../utils/personnelPortfolioFormat'
import {
  FACULTY_ACADEMIC_CRITERIA,
  resolveFacultyCriterion,
  normalizeFacultyBookletItems,
  isFacultyAcademicFormat
} from '../../../utils/facultyAcademicBooklet'

describe('AchieveNest — Faculty Academic Accomplishment Entry and Format Separation Suite', () => {

  // =========================================================================
  // 1. NON-NEGOTIABLE SEPARATION RULE & FORMAT RESOLVER
  // =========================================================================
  describe('1. Format Resolver & Non-Negotiable Separation', () => {
    it('resolves "academic" personnel to FACULTY_ACADEMIC format', () => {
      expect(resolvePersonnelPortfolioFormat('academic')).toBe(PORTFOLIO_FORMATS.FACULTY_ACADEMIC)
      expect(resolvePersonnelPortfolioFormat('ACADEMIC')).toBe(PORTFOLIO_FORMATS.FACULTY_ACADEMIC)
      expect(resolvePersonnelPortfolioFormat('faculty_academic')).toBe(PORTFOLIO_FORMATS.FACULTY_ACADEMIC)
      expect(resolvePersonnelPortfolioFormat('teaching_faculty')).toBe(PORTFOLIO_FORMATS.FACULTY_ACADEMIC)
      expect(usesFacultyAcademicPortfolio({ personnel_classification: 'academic' })).toBe(true)
    })

    it('resolves "non_academic" and "non_teaching" personnel to NON_TEACHING format', () => {
      expect(resolvePersonnelPortfolioFormat('non_academic')).toBe(PORTFOLIO_FORMATS.NON_TEACHING)
      expect(resolvePersonnelPortfolioFormat('non_teaching_faculty')).toBe(PORTFOLIO_FORMATS.NON_TEACHING)
      expect(resolvePersonnelPortfolioFormat('non_teaching_personnel')).toBe(PORTFOLIO_FORMATS.NON_TEACHING)
      expect(resolvePersonnelPortfolioFormat('staff')).toBe(PORTFOLIO_FORMATS.NON_TEACHING)
      expect(usesFacultyAcademicPortfolio({ personnel_classification: 'non_academic' })).toBe(false)
      expect(usesFacultyAcademicPortfolio({ personnel_classification: 'non_teaching_faculty' })).toBe(false)
    })

    it('does not infer format from job title or department if classification is present', () => {
      const user = {
        job_title: 'Dean of Information Technology',
        department: 'College of IT',
        personnel_classification: 'academic'
      }
      expect(resolvePersonnelPortfolioFormat(user.personnel_classification)).toBe(PORTFOLIO_FORMATS.FACULTY_ACADEMIC)
    })
  })

  // =========================================================================
  // 2. FACULTY ACADEMIC TAXONOMY (A, B, C AREAS AND SUBCATEGORIES)
  // =========================================================================
  describe('2. Canonical Faculty Academic Taxonomy (Areas A, B, C)', () => {
    it('contains exactly 3 official areas: A, B, C', () => {
      expect(FACULTY_ACADEMIC_CATEGORIES).toHaveLength(3)
      const areaCodes = FACULTY_ACADEMIC_CATEGORIES.map(c => c.code)
      expect(areaCodes).toEqual(['A', 'B', 'C'])
    })

    it('defines Area A with A.1, A.2, A.3 subcategories', () => {
      const areaA = FACULTY_ACADEMIC_CATEGORIES.find(c => c.code === 'A')
      expect(areaA.name).toBe('A. PROFESSIONAL DEVELOPMENT')
      const subKeys = areaA.subcategories.map(s => s.key)
      expect(subKeys).toEqual(['A.1', 'A.2', 'A.3'])
    })

    it('defines Area B with B.1 through B.6 subcategories', () => {
      const areaB = FACULTY_ACADEMIC_CATEGORIES.find(c => c.code === 'B')
      expect(areaB.name).toBe('B. PRODUCTIVITY AND CREATIVE WORK')
      const subKeys = areaB.subcategories.map(s => s.key)
      expect(subKeys).toEqual(['B.1', 'B.2', 'B.3', 'B.4', 'B.5', 'B.6'])
    })

    it('defines Area C with C.1 (a-d), C.2 (a-c), and C.3 subcategories', () => {
      const areaC = FACULTY_ACADEMIC_CATEGORIES.find(c => c.code === 'C')
      expect(areaC.name).toBe('C. SERVICE AND LEADERSHIP')
      const subKeys = areaC.subcategories.map(s => s.key)
      expect(subKeys).toEqual([
        'C.1.a', 'C.1.b', 'C.1.c', 'C.1.d',
        'C.2.a', 'C.2.b', 'C.2.c',
        'C.3'
      ])
    })
  })

  // =========================================================================
  // 3. SCHEMA RESOLVER & TAILORED INPUT FIELDS
  // =========================================================================
  describe('3. Schema Resolver & Tailored Input Fields', () => {
    it('resolves A.1 Education with Course/Degree and School/University', () => {
      const schema = getFacultyAcademicAccomplishmentSchema('A.1')
      expect(schema.subcategoryKey).toBe('A.1')
      expect(schema.primaryField.key).toBe('course_or_degree')
      expect(schema.primaryField.label).toBe('Course / Degree')
      expect(schema.organizationField.key).toBe('school_or_university')
      expect(schema.organizationField.label).toBe('School / University')
    })

    it('resolves A.2 Active Membership with Organization and Conducted/Organized by', () => {
      const schema = getFacultyAcademicAccomplishmentSchema('A.2')
      expect(schema.primaryField.key).toBe('organization')
      expect(schema.primaryField.label).toBe('Organization')
      expect(schema.organizationField.key).toBe('conducted_or_organized_by')
      expect(schema.organizationField.label).toBe('Conducted or Organized by')
    })

    it('resolves A.3 Attendance to Seminar-Workshop/Trainings with Title', () => {
      const schema = getFacultyAcademicAccomplishmentSchema('A.3')
      expect(schema.primaryField.key).toBe('activity_title')
      expect(schema.primaryField.label).toBe('Title')
      expect(schema.organizationField.key).toBe('conducted_or_organized_by')
    })

    it('resolves B.1 Guest Lecturer with Activity and Conducted/Organized by', () => {
      const schema = getFacultyAcademicAccomplishmentSchema('B.1')
      expect(schema.primaryField.key).toBe('activity')
      expect(schema.primaryField.label).toBe('Activity')
      expect(schema.organizationField.key).toBe('conducted_or_organized_by')
      expect(schema.organizationField.label).toBe('Conducted or Organized by')
    })

    it('resolves B.2 Publication with Publication and Granted by', () => {
      const schema = getFacultyAcademicAccomplishmentSchema('B.2')
      expect(schema.primaryField.key).toBe('publication')
      expect(schema.primaryField.label).toBe('Publication')
      expect(schema.organizationField.key).toBe('granted_by')
      expect(schema.organizationField.label).toBe('Granted by')
    })

    it('resolves B.3 Conduct of Research with Research and Granted by', () => {
      const schema = getFacultyAcademicAccomplishmentSchema('B.3')
      expect(schema.primaryField.key).toBe('research')
      expect(schema.primaryField.label).toBe('Research')
      expect(schema.organizationField.key).toBe('granted_by')
    })

    it('resolves B.4 Professional Recognition / Awards with Recognition / Award and Granted by', () => {
      const schema = getFacultyAcademicAccomplishmentSchema('B.4')
      expect(schema.primaryField.key).toBe('recognition_or_award')
      expect(schema.primaryField.label).toBe('Recognition / Award')
      expect(schema.organizationField.key).toBe('granted_by')
    })

    it('resolves B.5 Production of Instructional Materials with Material and Granted by', () => {
      const schema = getFacultyAcademicAccomplishmentSchema('B.5')
      expect(schema.primaryField.key).toBe('material')
      expect(schema.primaryField.label).toBe('Material')
      expect(schema.organizationField.key).toBe('granted_by')
    })

    it('resolves B.6 Creative Work with Creative Work and Granted by', () => {
      const schema = getFacultyAcademicAccomplishmentSchema('B.6')
      expect(schema.primaryField.key).toBe('creative_work')
      expect(schema.primaryField.label).toBe('Creative Work')
      expect(schema.organizationField.key).toBe('granted_by')
    })

    it('resolves C.1.a Moderator of Clubs / Organizations with Club / Organization', () => {
      const schema = getFacultyAcademicAccomplishmentSchema('C.1.a')
      expect(schema.primaryField.key).toBe('club_or_organization')
      expect(schema.primaryField.label).toBe('Club / Organization')
      expect(schema.organizationField.key).toBe('conducted_or_organized_by')
    })

    it('resolves C.2.a, C.2.b, C.2.c with Activity and Conducted / Organized by', () => {
      ['C.2.a', 'C.2.b', 'C.2.c'].forEach((key) => {
        const schema = getFacultyAcademicAccomplishmentSchema(key)
        expect(schema.primaryField.key).toBe('activity')
        expect(schema.primaryField.label).toBe('Activity')
        expect(schema.organizationField.key).toBe('conducted_or_organized_by')
      })
    })

    it('resolves C.3 Years of Service at NDMU', () => {
      const schema = getFacultyAcademicAccomplishmentSchema('C.3')
      expect(schema.subcategoryKey).toBe('C.3')
      expect(schema.primaryField.key).toBe('years_or_service_detail')
      expect(schema.primaryField.label).toBe('Inclusive Dates / Service Detail')
    })
  })

  // =========================================================================
  // 4. ZERO REMARKS INPUT RULE
  // =========================================================================
  describe('4. Strict Zero Remarks Input Rule for Faculty Academic Entry', () => {
    it('ensures no schema in facultyAcademicAccomplishmentSchema includes a remarks field', () => {
      FACULTY_ACADEMIC_CATEGORIES.forEach(cat => {
        cat.subcategories.forEach(sub => {
          const schema = getFacultyAcademicAccomplishmentSchema(sub.key)
          expect(schema.primaryField.key).not.toBe('remarks')
          expect(schema.organizationField?.key).not.toBe('remarks')
        })
      })
    })

    it('ensures FacultyAcademicSubmissionModal.jsx contains zero remarks input fields', () => {
      const modalPath = path.resolve(__dirname, '../modals/FacultyAcademicSubmissionModal.jsx')
      const modalCode = fs.readFileSync(modalPath, 'utf8')
      // Ensure there are no remarks input/textarea elements for faculty
      expect(modalCode).not.toMatch(/name=["']remarks["']/i)
      expect(modalCode).not.toMatch(/id=["']remarks["']/i)
      expect(modalCode).not.toMatch(/placeholder=["'][^"']*remarks[^"']*["']/i)
    })
  })

  // =========================================================================
  // 5. ZERO POINTS BEFORE DEAN EVALUATION RULE
  // =========================================================================
  describe('5. Strict Zero Points Before Dean Evaluation Rule', () => {
    it('ensures FacultyAcademicSubmissionModal does not compute or display claimed/provisional points', () => {
      const modalPath = path.resolve(__dirname, '../modals/FacultyAcademicSubmissionModal.jsx')
      const modalCode = fs.readFileSync(modalPath, 'utf8')
      expect(modalCode).not.toContain('Provisional Pts')
      expect(modalCode).not.toContain('Claimed Pts')
      expect(modalCode).not.toContain('Advisory Pts')
      expect(modalCode).not.toContain('calculatePoints')
    })
  })

  // =========================================================================
  // 6. MODAL WIRING & SEPARATION IN WORKSPACE PAGES
  // =========================================================================
  describe('6. Modal Wiring & Page Integration Separation', () => {
    it('PersonnelPortfolioEditPage imports FacultyAcademicSubmissionModal and branches by user classification', () => {
      const editPagePath = path.resolve(__dirname, '../PersonnelPortfolioEditPage.jsx')
      const editPageCode = fs.readFileSync(editPagePath, 'utf8')
      expect(editPageCode).toContain('FacultyAcademicSubmissionModal')
      expect(editPageCode).toContain('usesFacultyAcademicPortfolio')
      expect(editPageCode).toMatch(/isFacultyAcademic\s*\?\s*\(\s*<FacultyAcademicSubmissionModal/)
    })

    it('PersonnelAchievementsPage branches modal by user classification', () => {
      const achPagePath = path.resolve(__dirname, '../PersonnelAchievementsPage.jsx')
      const achPageCode = fs.readFileSync(achPagePath, 'utf8')
      expect(achPageCode).toContain('FacultyAcademicSubmissionModal')
      expect(achPageCode).toContain('usesFacultyAcademicPortfolio(user)')
    })
  })

  // =========================================================================
  // 7. FACULTY BOOKLET & CRITERIA NORMALIZATION
  // =========================================================================
  describe('7. Faculty Booklet Structure and Mapping', () => {
    it('normalizes Faculty Academic portfolio items into official criterion keys', () => {
      const portfolio = {
        area_a_items: [
          {
            id: 'acc-1',
            category: 'A.1 Education',
            category_code: 'A.1',
            category_metadata: {
              course_or_degree: 'Master of Science in Information Technology',
              school_or_university: 'Notre Dame of Marbel University'
            },
            occurrence_date: '2025-06-15',
            evidence_id: 'ev-1',
            file_name: 'msit_diploma.pdf'
          }
        ],
        area_b_items: [
          {
            id: 'acc-2',
            category: 'B.2 Publication (Scholarly Paper / Article)',
            category_code: 'B.2',
            category_metadata: {
              publication: 'AI in Higher Education Curriculum Design',
              granted_by: 'IEEE Philippine Journal'
            },
            occurrence_date: '2025-11-20',
            evidence_id: 'ev-2',
            file_name: 'ieee_paper.pdf'
          }
        ],
        area_c_items: [
          {
            id: 'acc-3',
            category: 'C.1.a Moderator of Clubs / Organizations',
            category_code: 'C.1.a',
            category_metadata: {
              club_or_organization: 'Junior Philippine Computer Society',
              conducted_or_organized_by: 'NDMU Student Affairs'
            },
            occurrence_date: '2025-09-01'
          }
        ]
      }

      const normalized = normalizeFacultyBookletItems(portfolio)
      expect(normalized).toHaveLength(3)

      const item1 = normalized.find(n => n.accomplishmentId === 'acc-1')
      expect(item1.criterionKey).toBe('A.1')
      expect(item1.title).toBe('Master of Science in Information Technology')
      expect(item1.institution).toBe('Notre Dame of Marbel University')
      expect(item1.evidence.original_filename).toBe('msit_diploma.pdf')

      const item2 = normalized.find(n => n.accomplishmentId === 'acc-2')
      expect(item2.criterionKey).toBe('B.2')
      expect(item2.title).toBe('AI in Higher Education Curriculum Design')
      expect(item2.institution).toBe('IEEE Philippine Journal')

      const item3 = normalized.find(n => n.accomplishmentId === 'acc-3')
      expect(item3.criterionKey).toBe('C.1.1')
      expect(item3.title).toBe('Junior Philippine Computer Society')
    })

    it('preserves evaluator remarks column as empty/evaluator-controlled prior to Dean evaluation', () => {
      const portfolio = {
        items: [
          {
            id: 'acc-unrated',
            category_code: 'A.3',
            category_metadata: {
              activity_title: 'Advanced Web Security Summit',
              conducted_or_organized_by: 'DICT Region XII'
            }
          }
        ]
      }
      const normalized = normalizeFacultyBookletItems(portfolio)
      expect(normalized[0].source.evaluator_remarks).toBeUndefined()
    })
  })
})
