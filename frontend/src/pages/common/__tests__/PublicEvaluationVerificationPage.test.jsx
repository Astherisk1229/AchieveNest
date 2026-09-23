import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
const source=fs.readFileSync(new URL('../PublicEvaluationVerificationPage.jsx',import.meta.url),'utf8')
describe('Phase Q public evaluation verification page',()=>{
 it('shows all three safe statuses',()=>{expect(source).toContain('Current / Valid');expect(source).toContain('Superseded');expect(source).toContain('Invalid / Not Found')})
 it('renders only the approved verification fields',()=>{for(const label of ['System reference','Personnel name','Ranking cycle','Document type','Generated','Evaluation version'])expect(source).toContain(label);for(const forbidden of ['total_score','criteria','evidence','credential','justification','download'])expect(source).not.toContain(forbidden)})
})
