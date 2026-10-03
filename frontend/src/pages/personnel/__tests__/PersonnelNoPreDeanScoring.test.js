import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

describe('Personnel has no score before Dean evaluation', () => {
  it('has no unresolved score-cap runtime reference', () => {
    const page = read('pages/personnel/PersonnelPortfolioEditPage.jsx')
    expect(page).not.toMatch(/isAMaxed|isAMaxxed|isBMaxed|isCMaxed|MAX CAP REACHED/)
  })

  it('does not submit score fields from the accomplishment form or controller', () => {
    const sources = [
      read('pages/personnel/modals/PersonnelSubmissionModal.jsx'),
      read('controllers/PersonnelAchievementController.js')
    ].join('\n')
    expect(sources).not.toMatch(/claimed_points|provisional_points|suggested_points|accepted_points|ranking_points|criterion_score/)
  })

  it('keeps Personnel score labels out of the affected UI', () => {
    const sources = [
      read('pages/personnel/PersonnelPortfolioEditPage.jsx'),
      read('pages/personnel/PersonnelAchievementsPage.jsx'),
      read('pages/personnel/AchievementPopoverMenu.jsx'),
      read('pages/personnel/modals/PersonnelSubmissionModal.jsx'),
      read('pages/personnel/modals/SubmissionVersionHistoryModal.jsx')
    ].join('\n')
    expect(sources).not.toMatch(/Claimed Points|Provisional Points|Advisory Points|Suggested Points|Potential Points|Accepted Points|Ranking Points|Criterion Score|Maximum Points|Max Pts/i)
  })
})
