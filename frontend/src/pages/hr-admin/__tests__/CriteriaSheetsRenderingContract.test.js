import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { normalizeCriteriaCatalogue } from '../ranking-criteria/criteriaCatalogue'

const source = fs.readFileSync(path.resolve(import.meta.dirname, '../PersonnelEvaluationSetupPage.jsx'), 'utf8')
const faculty = { title:'Administrators Ranking Scale', personnel_group:'FACULTY', versions:[{ id:'faculty-v1', version_number:'1.0', status:'approved', total_max_points:160, passing_score:120 }] }
const nonTeaching = { title:'Non-Teaching Personnel Ranking Scale', personnel_group:'NON_TEACHING_FACULTY', versions:[{ id:'nt-v1', version_number:'1.0', status:'approved', total_max_points:150, passing_score:75 }] }

describe('Criteria Sheets rendering contract', () => {
  it('preserves the direct array returned by the frontend service', () => {
    expect(normalizeCriteriaCatalogue([faculty, nonTeaching])).toEqual([faculty, nonTeaching])
  })

  it('accepts supported wrapped API shapes without silently dropping rows', () => {
    expect(normalizeCriteriaCatalogue({ data:[faculty, nonTeaching] })).toHaveLength(2)
    expect(normalizeCriteriaCatalogue({ data:{ scales:[faculty, nonTeaching] } })).toHaveLength(2)
    expect(normalizeCriteriaCatalogue({ scales:[faculty, nonTeaching] })).toHaveLength(2)
  })

  it('defines loading, empty, error, and two-sheet success content', () => {
    for (const text of ['Loading ranking setup…','No ranking criteria sheets are available.','Criteria sheets could not be loaded.','View Criteria','Create New Version','Version History','Active version','Maximum','Passing']) expect(source).toContain(text)
    expect(source).toContain("scale.personnel_group")
    expect(source).toContain("v${active.version_number} · Active")
  })
})
