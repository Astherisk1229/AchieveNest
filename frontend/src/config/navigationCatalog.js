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
  Award,
  Calendar,
  Building2,
  FileCheck2,
  BookOpen,
  User,
  GraduationCap,
  Trophy,
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
  [CANONICAL_ROLES.HR_STAFF]: { label: 'HR Portal', icon: Users, showOnboardingGuide: false },
  [CANONICAL_ROLES.OSAD_STAFF]: { label: 'OSAD Portal', icon: ShieldCheck, showOnboardingGuide: false }
})

export const NAVIGATION_CATALOG = [
  // ==========================================
  // 1. STUDENT PORTAL NAVIGATION
  // ==========================================
  {
    id: 'student-profile',
    label: 'Profile',
    icon: User,
    path: '/student/profile',
    portal: 'student',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.STUDENT],
    requiredActiveContexts: [CANONICAL_ROLES.STUDENT],
    requiredPermissions: ['student.dashboard.read', 'student.achievement.manage']
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
    id: 'student-portfolio-submission',
    label: 'Portfolio Submission',
    icon: FileCheck2,
    path: '/student/portfolio-submissions',
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
    label: 'Profile',
    icon: Home,
    path: '/personnel/dashboard?tab=overview',
    tab: 'overview',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.PERSONNEL],
    requiredPermissions: ['portfolio.personal.read']
  },
  {
    id: 'personnel-portfolio-showcase',
    label: 'Portfolio',
    icon: BookOpen,
    path: '/personnel/portfolio',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.PERSONNEL],
    requiredPermissions: ['portfolio.personal.read']
  },
  // ==========================================
  // 3. PROGRAM COORDINATOR NAVIGATION
  // ==========================================
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
    label: 'Students',
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
    id: 'moderator-events',
    label: 'Events',
    icon: Calendar,
    path: '/personnel/dashboard?tab=events',
    tab: 'events',
    portal: 'personnel',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.PERSONNEL],
    requiredActiveContexts: [CANONICAL_ROLES.ORGANIZATION_MODERATOR],
    requiredPermissions: ['organization.event.manage']
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
    id: 'dean-review-workspace',
    label: 'Faculty Evaluation',
    icon: FileCheck2,
    path: DEAN_ROUTES.FACULTY_EVALUATION,
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
    activePathPrefixes: ['/dean/personnel/'],
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
    label: 'Dashboard',
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
    label: 'Personnel Management',
    icon: Users,
    path: '/hr/personnel-directory',
    activePathPrefixes: ['/hr/personnel/', '/hr/organizational-structure'],
    portal: 'hr',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.HR_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.HR_STAFF],
    requiredPermissions: ['hr.personnel.manage']
  },
  {
    id: 'hr-ranking-cycles',
    label: 'Ranking & Evaluation',
    icon: Calendar,
    path: '/hr/ranking-cycles',
    activePathPrefixes: ['/hr/evaluation-submissions', '/hr/faculty-evaluation-and-ranking', '/hr/verification-queue'],
    portal: 'hr',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.HR_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.HR_STAFF],
    requiredPermissions: ['hr.evaluation.manage']
  },
  {
    id: 'hr-audit-trail',
    label: 'Administration',
    icon: KeyRound,
    path: '/hr/password-resets',
    activePathPrefixes: ['/hr/audit-trail'],
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
    id: 'osad-student-management',
    label: 'Student Management',
    icon: Building2,
    path: '/osad/dashboard?tab=student-management&section=accounts',
    tab: 'student-management',
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
    portal: 'osad',
    workflowFamily: 'evaluation',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.award_candidate.review']
  },
  {
    id: 'osad-award-candidate-review',
    label: 'Award Candidates',
    icon: Trophy,
    path: '/osad/candidates',
    portal: 'osad',
    workflowFamily: 'evaluation',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.award_candidate.review']
  },
  {
    id: 'osad-portfolio-submission-portal',
    label: 'Portfolio Submission Portal',
    icon: FileCheck2,
    path: '/osad/portfolio-submissions',
    portal: 'osad',
    workflowFamily: 'evaluation',
    allowedAccountTypes: [CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN],
    requiredActiveContexts: [CANONICAL_ROLES.OSAD_STAFF],
    requiredPermissions: ['osad.award_candidate.review']
  },

]

