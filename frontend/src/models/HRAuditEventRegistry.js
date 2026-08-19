/**
 * HRAuditEventRegistry.js
 * Centralized registry mapping machine-readable HR audit event codes to canonical categories,
 * human-readable labels, and semantic pastel tones under the minimalist-ui design system.
 */

export const AUDIT_CATEGORIES = {
  ACCOUNT: {
    key: 'ACCOUNT',
    label: 'Account Management',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
  },
  SECURITY: {
    key: 'SECURITY',
    label: 'Credentials and Security',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
  },
  EVALUATION: {
    key: 'EVALUATION',
    label: 'Faculty Evaluations',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
  },
  RANK_ASSIGNMENT: {
    key: 'RANK_ASSIGNMENT',
    label: 'Rank and Assignments',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
  },
  SYSTEM: {
    key: 'SYSTEM',
    label: 'System and Other',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  }
}

export const EVENT_REGISTRY = {
  // Account Management Events
  PERSONNEL_ACCOUNT_CREATED: {
    code: 'PERSONNEL_ACCOUNT_CREATED',
    label: 'Personnel Account Created',
    category: AUDIT_CATEGORIES.ACCOUNT,
    aliases: ['PERSONNEL_REGISTERED']
  },
  PERSONNEL_REGISTERED: {
    code: 'PERSONNEL_REGISTERED',
    label: 'Personnel Registered',
    category: AUDIT_CATEGORIES.ACCOUNT,
    aliases: ['PERSONNEL_ACCOUNT_CREATED']
  },
  PERSONNEL_UPDATE: {
    code: 'PERSONNEL_UPDATE',
    label: 'Personnel Record Updated',
    category: AUDIT_CATEGORIES.ACCOUNT
  },

  // Credentials & Security Events
  PERSONNEL_PASSWORD_RESET_APPROVED: {
    code: 'PERSONNEL_PASSWORD_RESET_APPROVED',
    label: 'Personnel Password Reset Approved',
    category: AUDIT_CATEGORIES.SECURITY,
    aliases: ['CREDENTIAL_RESET_ISSUED']
  },
  CREDENTIAL_RESET_ISSUED: {
    code: 'CREDENTIAL_RESET_ISSUED',
    label: 'Credential Reset Issued',
    category: AUDIT_CATEGORIES.SECURITY,
    aliases: ['PERSONNEL_PASSWORD_RESET_APPROVED']
  },

  // Faculty Evaluation Events
  HR_REVIEW_STARTED: {
    code: 'HR_REVIEW_STARTED',
    label: 'Evaluation Review Started',
    category: AUDIT_CATEGORIES.EVALUATION
  },
  HR_REVIEW_READY_FOR_FINALIZATION: {
    code: 'HR_REVIEW_READY_FOR_FINALIZATION',
    label: 'Evaluation Ready for Finalization',
    category: AUDIT_CATEGORIES.EVALUATION
  },
  HR_SCORE_SEAL_APPLIED: {
    code: 'HR_SCORE_SEAL_APPLIED',
    label: 'Faculty Evaluation Finalized & Sealed',
    category: AUDIT_CATEGORIES.EVALUATION,
    aliases: ['ACCOMPLISHMENT_SEALED']
  },
  ACCOMPLISHMENT_SEALED: {
    code: 'ACCOMPLISHMENT_SEALED',
    label: 'Accomplishment Sealed',
    category: AUDIT_CATEGORIES.EVALUATION
  },
  EVALUATION_RETURNED: {
    code: 'EVALUATION_RETURNED',
    label: 'Evaluation Returned for Revision',
    category: AUDIT_CATEGORIES.EVALUATION,
    badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    aliases: ['ACCOMPLISHMENT_RETURNED']
  },
  ACCOMPLISHMENT_RETURNED: {
    code: 'ACCOMPLISHMENT_RETURNED',
    label: 'Accomplishment Returned for Revision',
    category: AUDIT_CATEGORIES.EVALUATION,
    badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
  },

  // Rank & Assignment Events
  RANK_PROMOTION_UPDATE: {
    code: 'RANK_PROMOTION_UPDATE',
    label: 'Academic Rank Updated',
    category: AUDIT_CATEGORIES.RANK_ASSIGNMENT,
    aliases: ['RANK_PROMOTION']
  },
  RANK_PROMOTION: {
    code: 'RANK_PROMOTION',
    label: 'Academic Rank Promoted',
    category: AUDIT_CATEGORIES.RANK_ASSIGNMENT
  },
  ASSIGNMENT_UPDATED: {
    code: 'ASSIGNMENT_UPDATED',
    label: 'Department Assignment Updated',
    category: AUDIT_CATEGORIES.RANK_ASSIGNMENT,
    aliases: ['ROLE_ASSIGNMENT']
  },
  ROLE_ASSIGNMENT: {
    code: 'ROLE_ASSIGNMENT',
    label: 'Role Assignment Updated',
    category: AUDIT_CATEGORIES.RANK_ASSIGNMENT
  }
}

/**
 * Resolves event metadata for any code, providing fallback for legacy or unknown codes.
 */
export function getEventMetadata(eventCode) {
  if (!eventCode) {
    return {
      code: 'UNKNOWN',
      label: 'System Action',
      category: AUDIT_CATEGORIES.SYSTEM,
      badgeClass: AUDIT_CATEGORIES.SYSTEM.badgeClass
    }
  }

  const normalizedCode = String(eventCode).trim().toUpperCase()

  // Exact match in registry
  if (EVENT_REGISTRY[normalizedCode]) {
    const entry = EVENT_REGISTRY[normalizedCode]
    return {
      code: entry.code,
      label: entry.label,
      category: entry.category,
      badgeClass: entry.badgeClass || entry.category.badgeClass
    }
  }

  // Check alias match
  for (const item of Object.values(EVENT_REGISTRY)) {
    if (item.aliases && item.aliases.includes(normalizedCode)) {
      return {
        code: item.code,
        label: item.label,
        category: item.category,
        badgeClass: item.badgeClass || item.category.badgeClass
      }
    }
  }

  // Humanize fallback for unknown code
  const humanized = normalizedCode
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())

  return {
    code: normalizedCode,
    label: humanized,
    category: AUDIT_CATEGORIES.SYSTEM,
    badgeClass: AUDIT_CATEGORIES.SYSTEM.badgeClass
  }
}
