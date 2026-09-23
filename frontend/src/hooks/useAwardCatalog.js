import { useCallback, useEffect, useMemo, useState } from 'react'
import AwardCatalogController from '../controllers/AwardCatalogController'
import { fetchAwards } from '../services/awardAdminService'

export default function useAwardCatalog() {
  const [awards, setAwards] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAwards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAwards(AwardCatalogController.normalize(await fetchAwards()))
    } catch (loadError) {
      setError(loadError?.message || 'Award definitions could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAwards() }, [loadAwards])

  const filteredAwards = useMemo(
    () => AwardCatalogController.filter(awards, searchTerm),
    [awards, searchTerm]
  )

  return { awards, filteredAwards, searchTerm, setSearchTerm, loading, error, reload: loadAwards }
}
