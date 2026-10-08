import { CANONICAL_ROLES } from '../utils/roleContext'
import { FACULTY_ACADEMIC_AREAS, FACULTY_ACADEMIC_ENTRY_SCHEMA } from './facultyAcademicAccomplishmentSchema'
import { NTP_AREAS, NTP_AREA_A_ITEMS, NTP_ENTRY_CRITERIA, NTP_YEARS_OF_SERVICE, ntpCategoryLabel } from './nonTeachingPortfolioSchema'
import RankingCriteriaModel from '../models/RankingCriteriaModel'

const topic = (id, title, summary, sections = []) => ({ id, title, summary, sections })
const list = (title, items) => ({ title, items })
const text = (title, body) => ({ title, body })

export const HELP_ROLE_LABELS = Object.freeze({
  [CANONICAL_ROLES.STUDENT]: 'Student',
  [CANONICAL_ROLES.PERSONNEL]: 'Personnel',
  [CANONICAL_ROLES.PROGRAM_COORDINATOR]: 'Program Coordinator',
  [CANONICAL_ROLES.ORGANIZATION_MODERATOR]: 'Organization Moderator',
  [CANONICAL_ROLES.DEAN]: 'College Dean',
  [CANONICAL_ROLES.HR_STAFF]: 'HR',
  [CANONICAL_ROLES.OSAD_STAFF]: 'OSAD'
})

export const SHARED_HELP_TOPICS = [
  topic('about', 'About AchieveNest', 'AchieveNest is NDMU’s platform for recording, reviewing, and managing student and personnel achievements.', [
    text('For your role', 'Your current workspace shows the actions available to your active role. Keeping records complete and using the correct workflow helps reviewers make decisions from the information recorded in the system.'),
    text('Role access', 'Guidance in this panel follows your current active role. Switching roles changes the guide topics to match that workspace.')
  ]),
  topic('settings', 'Settings', 'Manage the account settings available to you.', [
    text('Open Settings', 'Settings opens the existing account settings page for your current account type. Available options depend on the account and access configured for you.')
  ]),
  topic('notifications', 'Notifications', 'Use notifications to see updates connected to your records and assigned work.', [
    text('Read an update', 'Open a notification to review its message and, when provided, follow its link to the related record or workspace.'),
    text('If something is still pending', 'A pending item is waiting for the next action in its workflow. Check the message and status shown on the record; contact the responsible office if the system does not show what action is needed.')
  ]),
  topic('terms', 'Terms & Definitions', 'Short explanations of terms used in your current workspace.', [
    text('Active role', 'The role currently controlling which workspace, navigation, and Help & Guide topics you see.'),
    text('Supporting evidence', 'A document attached to a record to substantiate the information entered. Evidence requirements vary by workflow and the form indicates what must be supplied.'),
    text('Returned', 'A workflow-specific status indicating that the record was sent back. Read the return message or remarks before making changes.'),
    text('Verified', 'A status used for student achievement records after an authorized reviewer confirms them.'),
    text('Evaluation period', 'A personnel evaluation window configured by HR. Personnel can submit the current Portfolio when that workflow is open.')
  ]),
  topic('faq', 'Frequently Asked Questions', 'Answers to common questions supported by the current system workflows.', [
    text('Why is an item still pending?', 'It has not reached a completed decision state. Open the item and review its status and any reviewer message for the next step.'),
    text('Why can’t I edit a submitted item?', 'Some workflows lock an item while it is under review. If it is returned, the relevant form may allow you to correct and submit it again.'),
    text('Why can’t I see a page?', 'Navigation is filtered by your assigned roles, current active role, and permissions. Switch to an assigned role that has access, or contact the system administrator if access appears incorrect.')
  ]),
  topic('need-help', 'Need More Help?', 'If this guide does not answer your question, contact the official AchieveNest administrator or responsible NDMU office through the institution’s approved support channels.', [
    text('When you ask for help', 'Include the page you were using, the record or request involved, its visible status, and any on-screen message. Do not send your password or private authentication details.')
  ])
]

const ROLE_TERMS = Object.freeze({
  [CANONICAL_ROLES.STUDENT]: topic('terms', 'Terms & Definitions', 'Short explanations of terms used in your student workspace.', [
    text('Supporting evidence', 'A document attached to an achievement record to substantiate the information entered. The form indicates what must be supplied.'),
    text('Pending Review', 'A submitted achievement is waiting for an authorized reviewer.'),
    text('Returned', 'A workflow-specific status indicating the record was sent back. Read the reviewer remarks before editing and submitting again.'),
    text('Verified', 'An authorized reviewer has confirmed the student achievement record.')
  ]),
  [CANONICAL_ROLES.PERSONNEL]: topic('terms', 'Terms & Definitions', 'Short explanations of terms used in the Personnel workspace.', [
    text('Permanent repository', 'The Profile area where Personnel accomplishments remain available to manage, including after they have appeared in an evaluation.'),
    text('Supporting evidence', 'A document attached to an accomplishment to substantiate its details. Follow the evidence and validation requirements shown by the form.'),
    text('Evaluation period', 'A personnel evaluation window configured by HR. Personnel can submit a Portfolio when the applicable workflow is open.'),
    text('Returned for revision', 'A submission was sent back for requested changes. Review the remarks and follow the available resubmission action.')
  ]),
  [CANONICAL_ROLES.PROGRAM_COORDINATOR]: topic('terms', 'Terms & Definitions', 'Short explanations of terms used in the coordinator workspace.', [
    text('Pending verification', 'A submitted student achievement waiting for an authorized verification decision.'),
    text('Returned', 'A student record sent back with remarks so the student can make corrections, where that workflow allows.'),
    text('Program scope', 'The academic program assignment that limits the student records available in the coordinator workspace.')
  ]),
  [CANONICAL_ROLES.ORGANIZATION_MODERATOR]: topic('terms', 'Terms & Definitions', 'Short explanations of terms used in the organization workspace.', [
    text('Organization scope', 'The organization assignment that determines the events and attendance records available in your workspace.'),
    text('Attendance record', 'A record of participation managed through the event attendance workflow. Follow its displayed validation and status.')
  ]),
  [CANONICAL_ROLES.DEAN]: topic('terms', 'Terms & Definitions', 'Short explanations of terms used in the Dean workspace.', [
    text('College scope', 'The active college assignment that limits the personnel and review work visible to a Dean.'),
    text('Returned for revision', 'A personnel submission sent back with remarks through the configured review workflow.'),
    text('Finalization', 'The HR-owned final deliberation and closure stage; Dean review does not itself finalize the evaluation.')
  ]),
  [CANONICAL_ROLES.HR_STAFF]: topic('terms', 'Terms & Definitions', 'Short explanations of terms used in the HR workspace.', [
    text('Ranking period', 'An HR-configured personnel evaluation window with defined coverage, schedule, and workflow stages.'),
    text('Eligibility', 'Eligibility is resolved by the configured evaluation workflow. Use the system’s displayed result and reasons.'),
    text('Finalization', 'The HR-owned final deliberation and closure of a personnel evaluation.')
  ]),
  [CANONICAL_ROLES.OSAD_STAFF]: topic('terms', 'Terms & Definitions', 'Short explanations of terms used in the OSAD workspace.', [
    text('Award criteria', 'The configured rules and values used by the selected award workflow. Refer to the current criteria page for authoritative scoring details.'),
    text('Certificate template', 'A configured document template used by a certificate workflow. Follow its validation and version state.')
  ])
})

export const ROLE_HELP_TOPICS = Object.freeze({
  [CANONICAL_ROLES.STUDENT]: [
    topic('getting-started', 'Getting Started', 'Start by checking your student workspace, then add achievements with their supporting documents.', [
      list('A useful first visit', ['Review the Student Dashboard and profile information.', 'Open Achievements and check existing records and statuses.', 'For a new achievement, enter the record details, select its category and subcategory, and attach the supporting document requested by the form.', 'Submit the record and monitor its status or notifications for the reviewer’s decision.', 'Use Portfolio to review the verified records available there.'])
    ]),
    topic('student-dashboard', 'Dashboard Guide', 'The Student Dashboard is the entry point for your student workspace and current achievement activity.', [
      text('What to do', 'Review the information and activity shown on the dashboard. Use Achievements to create or update eligible records, and Portfolio to review the records presented there.')
    ]),
    topic('student-achievements', 'Achievements Guide', 'Record achievements with enough detail and proof for an authorized reviewer to assess them.', [
      list('Create a record', ['Choose Add Achievement.', 'Select the category and subcategory that best describe the record.', 'Complete the fields requested for that classification.', 'Attach the supporting evidence required by the form, then submit.', 'Use the status filter or open the record to review a return message.']),
      text('Status meanings', 'Draft: saved but not submitted. Pending Review (submitted): waiting for the assigned reviewer. Returned: the reviewer requested a correction; review the remarks and edit if the record is available. Verified: accepted by a reviewer and available to the Portfolio workflow. Rejected: not accepted. Archived: retained as an archived record.')
    ]),
    topic('student-portfolio', 'Portfolio Guide', 'Review the achievement records that the Student Portfolio workspace presents.', [
      text('What happens', 'Portfolio content comes from the student achievement records available to the system. A record marked Verified is treated as available for Portfolio by the current student achievement presentation logic.')
    ])
  ],
  [CANONICAL_ROLES.PROGRAM_COORDINATOR]: [
    topic('getting-started', 'Getting Started', 'Use your assigned academic-program scope to review student submissions.', [
      list('A useful first visit', ['Open the Verification Workspace and review the queue for your assigned program.', 'Open a record and check its category, submitted details, and evidence.', 'Record a verification decision only when the submission is reviewable and evidence supports the entered information.', 'Use the Students view to locate students in your assigned program.'])
    ]),
    topic('coordinator-review', 'Student Verification Guide', 'Review student achievement records routed to your assigned academic-program scope.', [
      list('Review a submission', ['Open a submitted record from the verification workspace.', 'Compare the entered details with the attached evidence.', 'Use the available decision action and provide the requested remarks when returning a record.']),
      text('Status meanings', 'Submitted records are awaiting a decision. Verified records have been confirmed. Rejected records were not accepted. Returned/revision-requested records are sent back to the student for correction. A record outside your assignment scope is not yours to decide.')
    ]),
    topic('coordinator-roster', 'Students Guide', 'The Students workspace is scoped to academic-program assignments that are active for your account.', [
      text('Use the roster', 'Use the list to locate a student and review the information available to your coordinator role. Access is limited by the assigned program scope.')
    ])
  ],
  [CANONICAL_ROLES.ORGANIZATION_MODERATOR]: [
    topic('getting-started', 'Getting Started', 'Start in the organization workspace assigned to your moderator role.', [
      list('A useful first visit', ['Review the Organization Profile and confirm you are working in the correct organization.', 'Use Events & Activities to manage organization events.', 'Use Attendance Management for attendance workflows available to your role.', 'Issue attendance certificates only through the available certificate workflow.', 'Check the status and messages shown for each activity.'])
    ]),
    topic('moderator-workspace', 'Organization Workspace', 'The moderator workspace provides organization event, attendance, and certificate actions.', [
      text('Scope', 'Organization Moderator access is tied to active organization assignments. The workspace only exposes actions authorized for your current role and scope.'),
      text('Events and attendance', 'Use the Events & Activities and Attendance Management pages for the records they own. Follow the validation and status feedback shown by each form before considering an action complete.'),
      text('Certificates', 'Attendance certificates are issued from the certificate workflow when its record and validation requirements are satisfied. The repository does not define one universal certificate status guide for every organization action.')
    ])
  ],
  [CANONICAL_ROLES.PERSONNEL]: [
    topic('getting-started', 'Getting Started', '', [
      text('Welcome to AchieveNest', 'AchieveNest is Notre Dame of Marbel University’s web-based platform for managing student and personnel achievements, portfolios, evaluations, and recognition processes. As Personnel, you can maintain your profile and accomplishment records, prepare your portfolio, provide supporting evidence, and participate in the applicable personnel evaluation process.'),
      text('Using Your Workspace', 'Use the main navigation to access the Personnel features available to your account. Your Profile contains your personal and institutional information. Your Portfolio allows you to maintain accomplishment records and prepare the records applicable to your personnel evaluation. Notifications inform you about important system activities or actions that may require your attention.'),
      text('Profile Information', 'Use Edit Profile to update information that you are allowed to maintain. Official institutional information remains read-only and is maintained by the appropriate university office.'),
      list('You may update', ['Profile Picture', 'Contact Phone', 'Professional Specialization', 'Professional Biography & Summary']),
      list('Official information', ['Full Name with Titles', 'Employee ID', 'Institutional Email', 'Designation / Position', 'Undergraduate Program', 'Current Rank', 'Years of Service', 'Official College / Unit Assignment']),
      text('Settings', 'Use Settings to manage your appearance, available notification preferences, and account security.')
    ]),
    topic('portfolio-evaluation', 'Portfolio & Evaluation', '', [
      text('Adding Accomplishments', 'Add an accomplishment by choosing the correct Area, Category, and Subcategory, then provide the required information and supporting evidence. Choose the category and subcategory that best describe what your accomplishment represents and the evidence you are submitting. Only accomplishments that satisfy the applicable evaluation period and ranking criteria will be considered for your portfolio.'),
      text('Evaluation Process', 'Review your portfolio and supporting evidence before submitting it for evaluation. Your portfolio remains editable while it is a draft. After you submit it, editing is restricted during review. If your portfolio is returned for revision, review the evaluator’s comments, make the required changes, and submit it again.')
    ]),
    topic('faq', 'FAQs', '', [
      { type: 'faq', items: [
        ['How do I know which category or subcategory to choose?', 'Choose the Area, Category, and Subcategory whose criterion best matches your accomplishment and supporting evidence. The available options follow the current ranking criteria maintained by HR.'],
        ['Why is my accomplishment not included in my portfolio?', 'An accomplishment may not be included if it falls outside the applicable evaluation period or does not satisfy the requirements of the relevant ranking criterion.'],
        ['Can I edit my portfolio after submitting it?', 'Your portfolio remains editable while it is a draft. After you submit it, editing is restricted during review. If your portfolio is returned for revision, you may edit it again and submit it for evaluation.'],
        ['Who evaluates my portfolio?', '']
      ] }
    ])
  ],
  [CANONICAL_ROLES.DEAN]: [
    topic('getting-started', 'Getting Started', 'Work only within your assigned college scope and review the annual or portfolio work presented there.', [
      list('A useful first visit', ['Open the Dean Dashboard and confirm the college scope shown.', 'Check Annual Review & Eligibility for applicable review work.', 'Open Faculty Ranking Reviews to review the assigned Teaching Personnel submissions.', 'Review the booklet and evidence before recording a decision or endorsement.', 'Use the return action and remarks when a correction is required.'])
    ]),
    topic('dean-review', 'Faculty Portfolio Review', 'Review Teaching Personnel work assigned to your college scope.', [
      text('Reviewing', 'Use the Faculty Ranking Reviews workspace to open the submission and its booklet, inspect the evidence and evaluation details, and complete only the actions the page makes available.'),
      text('Scope and self-review', 'Dean access is scoped to an active college assignment. The Dean evaluation workspace includes restrictions on reviewing one’s own personnel record; follow the restriction shown by the system.'),
      text('After a decision', 'A returned item follows the revision workflow. An endorsed or completed Dean review advances through the configured HR finalization stages; HR owns final deliberation and finalization.')
    ]),
    topic('dean-eligibility', 'Annual Review & Eligibility', 'Review the annual review and eligibility information available for your college scope.', [
      text('Use the page', 'Check the personnel and annual-review information shown by the workspace. Eligibility results are system-derived; do not treat this guide as a substitute for the values or reasons shown on the record.')
    ])
  ],
  [CANONICAL_ROLES.HR_STAFF]: [
    topic('getting-started', 'Getting Started', 'A quick guide to the HR workspace and its main functions.', [
      text('Welcome to AchieveNest', 'AchieveNest is Notre Dame of Marbel University’s web-based platform for managing student and personnel achievements, portfolios, evaluations, and recognition processes. As an HR Administrator, you can access personnel records, ranking periods, eligibility information, ranking criteria, portfolio evaluations, and other functions available to your role.'),
      text('Using Your Workspace', 'Use the main navigation to access HR functions. Where available, search and filters help locate personnel, ranking periods, portfolio submissions, and other records. The Personnel Directory shows institutional information and records available to HR. Notifications surface relevant activity and work that may need attention. The account menu provides Settings, Help & Guide, and Sign Out; use the appearance control in the top bar to change the theme.'),
      text('Understanding Statuses', 'Ranking periods and portfolio submissions have separate statuses that reflect their current stage. Submission labels include Submitted for Review, Under Review, Returned for Revision, Ready for Finalization, and Completed / Finalized. Check the status and any displayed reason before taking action; available actions can change as work moves through review.')
    ]),
    topic('hr-ranking-evaluation', 'Ranking & Evaluation', 'How HR ranking periods, eligibility, criteria, and personnel portfolio reviews fit together.', [
      text('Ranking Periods', 'HR manages Ranking Periods with personnel-group coverage, achievement-coverage dates, submission and evaluation schedules, workflow stages, and a linked ranking-criteria version. Check the period’s displayed dates, coverage, stage, and status before opening or advancing work.'),
      text('Eligibility', 'Eligibility is resolved for the selected Ranking Period using HR employment and qualifying-service information, two confirmed Annual Review reports, and period rules. Review the system’s eligibility result and reasons; correct missing HR information through the appropriate HR workflow.'),
      text('Ranking Criteria', 'The linked criteria version defines the applicable categories, requirements, points, and evidence rules. Use that version when reviewing a portfolio; do not add points or requirements outside the configured criteria.'),
      text('Teaching Personnel route', 'For Faculty assigned to an academic college, the assigned College Dean performs the initial evaluation. The portfolio then proceeds to HR for final deliberation and finalization.'),
      text('Other Personnel routes', 'Faculty in non-academic assignments and all Non-Teaching Personnel are routed directly to HR for evaluation. Reviewer routing depends on both personnel group and organizational assignment; follow the reviewer and workflow shown for the individual submission.'),
      text('Editing and returned portfolios', 'Submitting creates a versioned portfolio snapshot. Editing is restricted as soon as the status is Submitted for Review, before evaluation begins, and remains restricted during review. If HR or the assigned reviewer returns it for revision, the personnel member can update eligible source accomplishment records and resubmit; resubmission creates a new version.'),
      text('Coverage and reuse', 'Accomplishments are checked against the Ranking Period’s achievement coverage and the validity rule for their criterion. Some Faculty education records under A.1 can remain valid or be reused after a completed evaluation when permitted by the criteria. Other records included in a completed evaluation cannot automatically be reused; records outside coverage or missing required dates may be excluded or need review.'),
      text('Completed evaluations', 'A submitted version stores snapshots of its accomplishments, evidence, and criteria. Finalized evaluations retain a final snapshot and remain available as historical evaluation records, so later edits to current accomplishment records do not rewrite the completed result.')
    ]),
    {
      ...topic('hr-faqs', 'Frequently Asked Questions', 'Short answers to common HR questions.', [
        { type: 'faq', items: [
          ['Who evaluates Teaching Personnel?', 'For Faculty assigned to an academic college, the assigned College Dean performs the initial evaluation. HR then handles final deliberation and finalization. Faculty in non-academic assignments follow the direct-to-HR route.'],
          ['Who evaluates Non-Teaching Personnel?', 'Non-Teaching Personnel portfolios are routed directly to HR for evaluation and finalization.'],
          ['Can personnel edit a portfolio after submitting it?', 'No. Editing is restricted once the portfolio is submitted for review, even before evaluation starts. If it is returned for revision, eligible source accomplishments can be updated before resubmission.'],
          ['Why is an accomplishment not included?', 'It may fall outside the period’s achievement coverage, lack a recognized criterion or required date, fail the criterion’s rules, or already have been used in a completed evaluation where reuse is not allowed. Check the displayed eligibility or exclusion reason.'],
          ['Are all older accomplishments automatically excluded?', 'No. The applicable criterion determines validity. For example, qualifying Faculty education records can remain valid across periods when their criterion allows it.'],
          ['Can the same accomplishment always be used again?', 'No. Reuse is limited by the criterion and prior evaluation history. Faculty A.1 education records are the supported education exception; other accomplishments included in a completed evaluation are not automatically reusable.'],
          ['What happens when a portfolio is returned for revision?', 'The personnel member can review the return reason, update eligible source accomplishment records, and resubmit. The resubmission is saved as a new portfolio version.'],
          ['Why can’t a portfolio be edited while it is being evaluated?', 'Submission creates the review snapshot and locks changes so evaluators continue reviewing the same information. The personnel member can make eligible changes again after the portfolio is returned for revision.'],
          ['What happens after an evaluation is finalized?', 'The completed evaluation and its final snapshot remain in evaluation history. Later changes to current accomplishment records do not replace that completed snapshot.'],
          ['Where can account settings be changed?', 'Open the account menu and select Settings.'],
          ['Where can personnel records be found?', 'Use Personnel Directory or the HR personnel-management functions available to your role.']
        ] }
      ]),
      menuTitle: 'FAQs'
    }
  ],
  [CANONICAL_ROLES.OSAD_STAFF]: [
    topic('getting-started', 'Getting Started', 'OSAD work covers the student and organization setup, awards, certificates, and governance pages available to your account.', [
      list('A useful first visit', ['Review the OSAD Dashboard and its workflow groups.', 'Use College and Programs, Student Accounts, or Student Organizations for the relevant setup work.', 'Use Awards & Scoring Criteria and Award Candidates for award workflows.', 'Use Certificate Templates for certificate configuration.', 'Check reports and the activity log for governance information available to OSAD.'])
    ]),
    topic('osad-setup', 'Student & Organization Setup', 'Manage the academic structure, student account, and student organization records available to OSAD.', [
      text('Scope', 'Pages are permission-filtered by the active OSAD role. Forms validate the required fields and available actions; use their on-screen status and feedback to confirm changes.')
    ]),
    topic('osad-awards', 'Awards & Candidate Review', 'Use the awards catalog, scoring criteria, and candidate review pages for OSAD award workflows.', [
      text('Review', 'Open the relevant award or candidate and follow the scoring, review, and decision actions presented by that workflow. Criteria and eligibility are maintained by the system; this guide does not restate or change scoring rules.')
    ]),
    topic('osad-certificates', 'Certificates & Reports', 'Manage certificate templates and review available accreditation and governance reports.', [
      text('Templates', 'The Certificate Templates workflow provides template families and versions. Follow its validation and publish or edit state before relying on a template.'),
      text('Reports', 'Accreditation Reports and the OSAD Activity Log show the information available to your active permissions.')
    ])
  ]
})

const fieldLabel = (field) => `${field.label}${field.required === false ? ' (optional)' : ''}`

function facultyCategoryTree() {
  return FACULTY_ACADEMIC_AREAS.map((area) => ({
    id: `faculty-area-${area.code}`,
    code: area.code,
    name: area.label,
    children: FACULTY_ACADEMIC_ENTRY_SCHEMA.filter((category) => category.area === area.code).map((category) => ({
      id: category.code,
      code: category.code,
      name: `${category.code} ${category.label}`,
      children: category.subcategories.map((subcategory) => {
        const examples = subcategory.fields.map((field) => field.placeholder).filter(Boolean)
        return {
          id: subcategory.code,
          code: subcategory.code,
          name: subcategory.label,
          description: `The form classifies this record as ${category.label.toLowerCase()}. It asks for: ${subcategory.fields.map(fieldLabel).join(', ')}.`,
          examples: examples.length ? examples : ['The form schema does not define an example for this subcategory.'],
          evidence: subcategory.evidenceRequired ? 'The Faculty form requires an evidence file. Accepted formats shown by the form are PDF, JPG, and PNG, up to 10 MB. The schema does not prescribe a single proof document for every subcategory.' : 'No evidence requirement is stated in this subcategory schema.',
          rules: [subcategory.dateLabel ? `The form records ${subcategory.dateLabel.toLowerCase()}.` : 'Use the dates and fields requested by the form.', ...subcategory.fields.filter((field) => field.type === 'select').map((field) => `${field.label} choices: ${field.options.join(', ')}.`)],
          needsReview: !examples.length || !subcategory.evidenceRequired
        }
      }),
      description: category.derived
        ? 'This value is derived from the personnel employment record; do not add it as a separate accomplishment.'
        : `The Faculty accomplishment form groups these records under ${area.label}. Choose the specific criterion below that matches the record.`,
      examples: category.derived ? [] : undefined,
      evidence: category.derived ? 'No separate Personnel-entered evidence record is required for this derived value.' : undefined,
      rules: category.derived ? ['The Faculty schema marks this value as derived.'] : [],
      needsReview: false
    }))
  }))
}

function nonTeachingCategoryTree() {
  const areaA = NTP_AREAS.find((item) => item.key === 'A')
  const areaB = NTP_AREAS.find((item) => item.key === 'B')
  const grouped = new Map()
  for (const criterion of NTP_ENTRY_CRITERIA) {
    if (!grouped.has(criterion.group)) grouped.set(criterion.group, { id: criterion.group, code: criterion.group, name: criterion.groupTitle, children: [], description: `Personnel-entered ${criterion.groupTitle.toLowerCase()} records in the Non-Teaching Appendix N form.` })
    const examples = criterion.fields.map((field) => field.placeholder).filter(Boolean)
    const proofType = RankingCriteriaModel.getRequiredProofType('B', ntpCategoryLabel(criterion), '')
    grouped.get(criterion.group).children.push({
      id: criterion.code,
      code: criterion.code,
      name: criterion.title,
      description: `The Non-Teaching form places this record under ${criterion.groupTitle}. Required fields: ${criterion.fields.filter((field) => field.required !== false).map((field) => field.label).join(', ') || 'none are marked required in the schema'}.`,
      examples: examples.length ? examples : ['The form schema does not define an example for this entry.'],
      evidence: `A new Non-Teaching accomplishment cannot be submitted until its supporting document is attached.${proofType ? ` The form suggests: ${proofType}.` : ' The system does not define a specific suggested proof type for this category.'}`,
      rules: [criterion.dateMode === 'single' ? 'The form requests a single date.' : 'The form requests a period or date range.', ...criterion.fields.filter((field) => field.type === 'select').map((field) => `${field.label} choices: ${field.options.map((option) => Array.isArray(option) ? option[1] : option).join(', ')}.`)],
      needsReview: examples.length === 0 || !proofType
    })
  }
  const hrCategories = (NTP_AREA_A_ITEMS || []).map((item) => ({ id: item.code, code: item.code, name: `${item.code} ${item.title}`, description: 'This area is rated by HR and is not entered by the Non-Teaching Personnel member.', examples: [], evidence: 'Personnel do not create an accomplishment record for this item.', rules: [`Maximum shown in the canonical Non-Teaching schema: ${item.max} points.`], needsReview: false, children: [] }))
  const years = { id: NTP_YEARS_OF_SERVICE.code, code: NTP_YEARS_OF_SERVICE.code, name: `${NTP_YEARS_OF_SERVICE.code} ${NTP_YEARS_OF_SERVICE.title}`, description: 'Years at NDMU is derived from the employment record and is never entered as an accomplishment by Personnel.', examples: [], evidence: 'No Personnel-entered evidence item is specified for this derived value.', rules: [], needsReview: false, children: [] }
  return [
    { id: 'ntp-area-A', code: areaA?.key || 'A', name: areaA?.title || 'A. Performance and Personal Indicators', description: 'HR-rated performance and personal indicators. These are not Personnel accomplishment entries.', needsReview: false, children: hrCategories },
    { id: 'ntp-area-B', code: areaB?.key || 'B', name: areaB?.title || 'B. Service and Leadership', description: 'Personnel-entered service and leadership accomplishments plus the derived years-of-service item.', needsReview: false, children: [...grouped.values(), years] }
  ]
}

export function getPersonnelCategoryTree(personnelGroup) {
  if (personnelGroup === 'non_teaching_faculty' || personnelGroup === 'non_academic') return nonTeachingCategoryTree()
  if (personnelGroup === 'faculty' || personnelGroup === 'academic') return facultyCategoryTree()
  return []
}

export function getRoleHelpTopics(role, personnelGroup) {
  return ROLE_HELP_TOPICS[role] || []
}

export function getPersonnelGroup(user = {}) {
  return user?.personnel_affiliation?.personnel_group || user?.personnel_group || user?.personnel_type || ''
}

export function getRoleTerms(role) {
  return ROLE_TERMS[role] || ROLE_TERMS[CANONICAL_ROLES.PERSONNEL]
}
