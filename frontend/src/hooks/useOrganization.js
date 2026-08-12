import { useState, useCallback } from 'react'
import OrganizationController from '../controllers/OrganizationController'

export default function useOrganization() {
  const [orgInfo, setOrgInfo] = useState(() => OrganizationController.getOrganizationInfo())
  const [events, setEvents] = useState(() => OrganizationController.getEvents())
  const [metrics, setMetrics] = useState(() => OrganizationController.getMetrics())

  const refreshData = useCallback(() => {
    setOrgInfo(OrganizationController.getOrganizationInfo())
    setEvents(OrganizationController.getEvents())
    setMetrics(OrganizationController.getMetrics())
  }, [])

  const createEvent = useCallback((eventData) => {
    OrganizationController.addEvent(eventData)
    refreshData()
  }, [refreshData])

  const updateEvent = useCallback((eventId, updatedData) => {
    OrganizationController.updateEvent(eventId, updatedData)
    refreshData()
  }, [refreshData])

  const archiveEvent = useCallback((eventId) => {
    OrganizationController.archiveEvent(eventId)
    refreshData()
  }, [refreshData])

  const getEventDetails = useCallback((eventId) => {
    return OrganizationController.getEventDetails(eventId)
  }, [])

  const autoMatchOSADTemplate = useCallback((category, title) => {
    return OrganizationController.autoMatchOSADTemplate(category, title)
  }, [])

  return {
    orgInfo,
    events,
    metrics,
    createEvent,
    updateEvent,
    archiveEvent,
    getEventDetails,
    autoMatchOSADTemplate,
    refreshData
  }
}
