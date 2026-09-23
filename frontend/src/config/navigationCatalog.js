/**
 * navigationCatalog.js
 * Central Navigation Catalog for AchieveNest.
 * 
 * Security Rule:
 * Every catalog item defines allowed account types, required permissions, and allowed active contexts.
 * Visual components MUST use permissionResolver to filter items BEFORE rendering JSX.
 * Unauthorized links must NEVER be present in the DOM (no CSS `display: none` or hidden classes).
 */

import {
  Home,
  ShieldCheck,
  Users,
  FolderKanban,
  Award,
  Calendar,
  QrCode,
  Sparkles,
  Building2,
  FileCheck2,
  BookOpen,
  User,
  GraduationCap,
  Trophy,
  ListTree,
  FileSpreadsheet,
  KeyRound,
  BriefcaseBusiness,
  HeartHandshake
} from 'lucide-react'
import { CANONICAL_ROLES, CANONICAL_ACCOUNT_TYPES } from '../utils/roleContext'
import { DEAN_ROUTES } from './deanRoutes'

export const WORKSPACE_NAVIGATION = Object.freeze({
  [CANONICAL_ROLES.STUDENT]: { label: 'Student Portal', icon: GraduationCap },
  [CANONICAL_ROLES.PERSONNEL]: { label: 'Personnel Portal', icon: User },
  [CANONICAL_ROLES.PROGRAM_COORDINATOR]: { label: 'Program Coordinator', icon: BriefcaseBusiness },
  [CANONICAL_ROLES.ORGANIZATION_MODERATOR]: { label: 'Organization Moderator', icon: HeartHandshake },
  [CANONICAL_ROLES.DEAN]: { label: 'Dean Portal', icon: Building2 },
  [CANONICAL_ROLES.DEPARTMENT_HEAD]: { label: 'Department Head', icon: Building2 },
  [CANONICAL_ROLES.HR_STAFF]: { label: 'HR Portal', icon: Users, showOnboardingGuide: true },
  [CANONICAL_ROLES.OSAD_STAFF]: { label: 'OSAD Portal', icon: ShieldCheck, showOnboardingGuide: true }
})

export const NAVIGATION_CATALOG = [
  // ==========================================
  // 1. STUDENT PORTAL NAVIGATION
  // ==========================================
  {
    id: 'student-dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/student/dashboard',
    portal: 'student',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.STUDENT],
    requiredActiveContexts: [CANONICAL_ROLES.STUDENT],
    requiredPermissions: ['student.dashboard.read']
  },
  {
    id: 'student-achievements',
    label: 'Achievements',
    icon: Award,
    path: '/student/achievements',
    portal: 'student',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.STUDENT],
    requiredActiveContexts: [CANONICAL_ROLES.STUDENT],
    requiredPermissions: ['student.achievement.manage']
  },
  {
    id: 'student-portfolio',
    label: 'Portfolio',
    icon: BookOpen,
    path: '/student/portfolio',
    portal: 'student',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.STUDENT],
    requiredActiveContexts: [CANONICAL_ROLES.STUDENT],
    requiredPermissions: ['student.portfolio.read']
  },
  {
    id: 'student-account',
    label: 'Account',
    icon: User,
    path: '/student/account',
    portal: 'student',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.STUDENT],
    requiredActiveContexts: [CANONICAL_ROLES.STUDENT],
    requiredPermissions: ['student.account.manage']
  },

  // ==========================================
  // 2. PERSONNEL PORTAL NAVIGATION
  // ==========================================
  {
    id: 'personnel-dashboard-overview',
    label: 'Dashboard Overview',
    icon: Home,
    path: '/personnel/dashboard?tab=overview',
    tab: 'overview',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.PERSONNEL, CANONICAL_ROLES.DEPARTMENT_HEAD],
    requiredPermissions: ['portfolio.personal.read']
  },
  {
    id: 'personnel-portfolio-edit',
    label: 'Edit Portfolio',
    icon: FolderKanban,
    path: '/personnel/portfolio/edit',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.PERSONNEL, CANONICAL_ROLES.DEPARTMENT_HEAD],
    requiredPermissions: ['portfolio.personal.update']
  },
  {
    id: 'personnel-portfolio-showcase',
    label: 'Portfolio',
    icon: BookOpen,
    path: '/personnel/portfolio',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.PERSONNEL, CANONICAL_ROLES.DEPARTMENT_HEAD],
    requiredPermissions: ['portfolio.personal.read']
  },
  {
    id: 'personnel-rank-placement',
    label: 'Rank & Placement',
    icon: ListTree,
    path: '/personnel/rank-placement',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.PERSONNEL],
    requiredPermissions: ['portfolio.personal.read']
  },
  {
    id: 'personnel-account',
    label: 'Account',
    icon: User,
    path: '/personnel/account',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.PERSONNEL, CANONICAL_ROLES.DEPARTMENT_HEAD],
    requiredPermissions: ['personnel.account.manage']
  },

  // ==========================================
  // 3. PROGRAM COORDINATOR NAVIGATION
  // ==========================================
  {
    id: 'coordinator-dashboard-overview',
    label: 'Dashboard Overview',
    icon: Home,
    path: '/personnel/dashboard?tab=overview',
    tab: 'overview',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.PROGRAM_COORDINATOR],
    requiredPermissions: ['achievement.student.verify']
  },
  {
    id: 'coordinator-verification-workspace',
    label: 'Verification Workspace',
    icon: ShieldCheck,
    path: '/personnel/dashboard?tab=workspace',
    tab: 'workspace',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.PROGRAM_COORDINATOR],
    requiredPermissions: ['achievement.student.verify']
  },
  {
    id: 'coordinator-student-roster',
    label: 'Student Roster & Dossiers',
    icon: Users,
    path: '/personnel/dashboard?tab=students',
    tab: 'students',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.PROGRAM_COORDINATOR],
    requiredPermissions: ['achievement.student.verify']
  },

  // ==========================================
  // 4. ORGANIZATION MODERATOR NAVIGATION
  // ==========================================
  {
    id: 'moderator-dashboard-overview',
    label: 'Dashboard Overview',
    icon: Home,
    path: '/personnel/dashboard?tab=overview',
    tab: 'overview',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.ORGANIZATION_MODERATOR],
    requiredPermissions: ['organization.event.manage']
  },
  {
    id: 'moderator-events',
    label: 'Events & Activities',
    icon: Calendar,
    path: '/personnel/dashboard?tab=events',
    tab: 'events',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.ORGANIZATION_MODERATOR],
    requiredPermissions: ['organization.event.manage']
  },
  {
    id: 'moderator-attendance',
    label: 'Attendance Management',
    icon: QrCode,
    path: '/personnel/dashboard?tab=attendance',
    tab: 'attendance',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.ORGANIZATION_MODERATOR],
    requiredPermissions: ['organization.attendance.manage']
  },
  {
    id: 'moderator-certificates',
    label: 'Digital Certificates',
    icon: Sparkles,
    path: '/personnel/dashboard?tab=certificates',
    tab: 'certificates',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.ORGANIZATION_MODERATOR],
    requiredPermissions: ['organization.certificate.issue']
  },
  {
    id: 'moderator-profile',
    label: 'Organization Profile',
    icon: Building2,
    path: '/personnel/dashboard?tab=profile',
    tab: 'profile',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.ORGANIZATION_MODERATOR],
    requiredPermissions: ['organization.event.manage']
  },

  // ==========================================
  // 5. DEAN NAVIGATION
  // ==========================================
  {
    id: 'dean-dashboard-overview',
    label: 'Dean Dashboard',
    icon: Home,
    path: DEAN_ROUTES.DASHBOARD,
    portal: 'dean',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.DEAN],
    requiredPermissions: ['college.faculty.review']
  },
  {
    id: 'dean-annual-review-eligibility',
    label: 'Annual Review & Eligibility',
    icon: ShieldCheck,
    path: DEAN_ROUTES.ANNUAL_REVIEW_ELIGIBILITY,
    portal: 'dean',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.DEAN],
    requiredPermissions: ['college.faculty.review']
  },
  {
    id: 'dean-review-workspace',
    label: 'Faculty Ranking Reviews',
    icon: FileCheck2,
    path: DEAN_ROUTES.FACULTY_RANKING_REVIEWS,
    portal: 'dean',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.DEAN],
    requiredPermissions: ['college.faculty.review']
  },
  {
    id: 'dean-faculty-roster',
    label: 'College Personnel Roster',
    icon: Users,
    path: DEAN_ROUTES.COLLEGE_PERSONNEL,
    portal: 'dean',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.DEAN],
    requiredPermissions: ['college.faculty.review']
  },

  // ==========================================
  // 6. HR STAFF NAVIGATION
  // ==========================================
  {
    id: 'hr-dashboard',
    label: 'HR Dashboard',
    icon: Home,
    path: '/hr/dashboard',
    tab: 'overview',
    portal: 'hr',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.HR_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.HR_STAFF],
    requiredPermissions: ['hr.evaluation.manage']
  },
  {
    id: 'hr-personnel-directory',
    label: 'Personnel Directory',
    icon: Users,
    path: '/hr/personnel-directory',
    portal: 'hr',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.HR_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.HR_STAFF],
    requiredPermissions: ['hr.personnel.manage']
  },
  {
    id: 'hr-organizational-structure',
    label: 'Organizational Structure',
    icon: Building2,
    path: '/hr/organizational-structure',
    portal: 'hr',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.HR_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.HR_STAFF],
    requiredPermissions: ['hr.personnel.manage']
  },
  {
    id: 'hr-ranking-cycles',
    label: 'Ranking Cycles',
    icon: Calendar,
    path: '/hr/ranking-cycles',
    portal: 'hr',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.HR_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.HR_STAFF],
    requiredPermissions: ['hr.evaluation.manage']
  },
  {
    id: 'hr-password-resets',
    label: 'Password Resets',
    icon: KeyRound,
    path: '/hr/password-resets',
    portal: 'hr',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.HR_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.HR_STAFF],
    requiredPermissions: ['hr.personnel.manage']
  },
  {
    id: 'hr-audit-trail',
    label: 'HR Audit Trail',
    icon: ShieldCheck,
    path: '/hr/audit-trail',
    portal: 'hr',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.HR_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.HR_STAFF],
    requiredPermissions: ['hr.evaluation.manage']
  },

  // ==========================================
  // 7. OSAD STAFF NAVIGATION
  // ==========================================
  // Group 1: Overview
  {
    id: 'osad-dashboard',
    label: 'OSAD Dashboard',
    icon: Home,
    path: '/osad/dashboard',
    tab: 'overview',
    portal: 'osad',
    workflowFamily: 'overview',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.academic_structure.manage']
  },

  // Group 2: Student & Institutional Setup
  {
    id: 'osad-academic-structure',
    label: 'Academic Structure',
    icon: Building2,
    path: '/osad/dashboard?tab=academic-structure',
    tab: 'academic-structure',
    portal: 'osad',
    workflowFamily: 'setup',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.academic_structure.manage']
  },
  {
    id: 'osad-student-accounts',
    label: 'Student Accounts',
    icon: Users,
    path: '/osad/dashboard?tab=accounts',
    tab: 'accounts',
    portal: 'osad',
    workflowFamily: 'setup',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.academic_structure.manage']
  },
  {
    id: 'osad-student-organizations',
    label: 'Student Organizations',
    icon: Users,
    path: '/osad/dashboard?tab=organizations',
    tab: 'organizations',
    portal: 'osad',
    workflowFamily: 'setup',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.academic_structure.manage']
  },
  {
    id: 'osad-password-resets',
    label: 'Password Resets',
    icon: KeyRound,
    path: '/osad/dashboard?tab=password-resets',
    tab: 'password-resets',
    portal: 'osad',
    workflowFamily: 'setup',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.academic_structure.manage']
  },

  // Group 3: Portfolio & Evaluation
  {
    id: 'osad-award-categories',
    label: 'Awards & Scoring Criteria',
    icon: Award,
    path: '/osad/awards',
    tab: 'awards',
    portal: 'osad',
    workflowFamily: 'evaluation',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.award_candidate.review']
  },
  {
    id: 'osad-award-candidate-review',
    label: 'Award Candidate Review',
    icon: Trophy,
    path: '/osad/dashboard?tab=candidate-review',
    tab: 'candidate-review',
    portal: 'osad',
    workflowFamily: 'evaluation',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.award_candidate.review']
  },

  // Group 4: Events & Certificates
  {
    id: 'osad-certificate-templates',
    label: 'Certificate Templates',
    icon: Sparkles,
    path: '/osad/dashboard?tab=certificate-templates',
    tab: 'certificate-templates',
    portal: 'osad',
    workflowFamily: 'credentials',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.certificate_template.manage']
  },

  // Group 5: Governance & Reports
  {
    id: 'osad-accreditation-reports',
    label: 'Accreditation Reports',
    icon: FileSpreadsheet,
    path: '/osad/dashboard?tab=reports',
    tab: 'reports',
    portal: 'osad',
    workflowFamily: 'governance',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.academic_structure.manage']
  },
  {
    id: 'osad-activity-log',
    label: 'OSAD Activity Log',
    icon: ShieldCheck,
    path: '/osad/dashboard?tab=audit',
    tab: 'audit',
    portal: 'osad',
    workflowFamily: 'governance',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.academic_structure.manage']
  }
]

