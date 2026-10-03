import { useCallback, useEffect, useMemo, useState } from 'react'
import AwardPotentialCandidatesController from '../controllers/AwardPotentialCandidatesController'
import AwardPotentialCandidatesModel from '../models/AwardPotentialCandidatesModel'

export default function useAwardPotentialCandidates(award) {
  const [model, setModel] = useState(() => new AwardPotentialCandidatesModel())
  const [loading, setLoading] = useState(!AwardPotentialCandidatesModel.authorityPending(award))
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [sort, setSort] = useState('SCORE_DESC')

  const reload = useCallback(async () => {
    setLoading(!AwardPotentialCandidatesModel.authorityPending(award))
    setError(null)
    try {
      setModel(await AwardPotentialCandidatesController.load(award))
    } catch (reason) {
      setError(reason?.message || "We couldn't load potential candidates.")
    } finally {
      setLoading(false)
    }
  }, [award])

  useEffect(() => { reload() }, [reload])

  const candidates = useMemo(
    () => AwardPotentialCandidatesController.select(model.candidates, { search, status, sort }),
    [model.candidates, search, status, sort]
  )

  return {
    model, candidates, loading, error, reload,
    search, setSearch, status, setStatus, sort, setSort,
    statusOptions: AwardPotentialCandidatesModel.statusOptions(model.candidates),
    authorityPending: AwardPotentialCandidatesModel.authorityPending(award)
  }
}
