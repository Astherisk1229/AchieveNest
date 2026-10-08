import { useEffect, useState } from 'react'
import portfolioService from '../services/portfolioService'

let schemaRequest

export default function useStudentAchievementSchema(enabled = true) {
  const [schema, setSchema] = useState(null)
  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    schemaRequest ||= portfolioService.fetchAchievementSchema().catch(error => {
      schemaRequest = null
      throw error
    })
    schemaRequest.then(value => { if (active) setSchema(value) }).catch(() => {})
    return () => { active = false }
  }, [enabled])
  return schema
}
