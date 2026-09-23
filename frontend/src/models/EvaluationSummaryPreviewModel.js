const SAMPLE_STUDENT = Object.freeze({
  name: 'Alexandra M. Reyes',
  studentId: '2023-00127',
  program: 'Bachelor of Arts in Communication',
  awardCycle: 'Sample Award Cycle 2026',
  generatedOn: 'September 16, 2026'
})

const SAMPLE_AWARDS = Object.freeze([
  Object.freeze({
    id: 'sample-campus-journalism',
    name: 'Campus Journalism Award',
    rows: Object.freeze([
      Object.freeze({ evidence: 'News Article A', criterion: 'News Item Evidence', points: 2 }),
      Object.freeze({ evidence: 'Editorial B', criterion: 'Editorial Evidence', points: 4 }),
      Object.freeze({ evidence: 'Publication Officer', criterion: 'Leadership Involvement', points: 3 })
    ]),
    total: 9,
    portfolioPotentialScore: '82%',
    qualificationThreshold: '80%',
    status: 'Potential Candidate'
  }),
  Object.freeze({
    id: 'sample-leadership',
    name: 'Leadership Award',
    rows: Object.freeze([
      Object.freeze({ evidence: 'SSG Council Officer', criterion: 'Leadership Role', points: 10 }),
      Object.freeze({ evidence: 'Leadership Seminar', criterion: 'Seminar Participation', points: 5 }),
      Object.freeze({ evidence: 'Community Outreach', criterion: 'Community Involvement', points: 8 })
    ]),
    total: 23,
    portfolioPotentialScore: '84%',
    qualificationThreshold: '80%',
    status: 'Potential Candidate'
  })
])

export default class EvaluationSummaryPreviewModel {
  constructor() {
    this.student = SAMPLE_STUDENT
    this.awards = SAMPLE_AWARDS
  }
}
