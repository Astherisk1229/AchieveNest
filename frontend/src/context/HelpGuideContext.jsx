/* eslint-disable react/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const HelpGuideContext = createContext(null)

export function HelpGuideProvider({ children }) {
  const [request, setRequest] = useState(null)
  const openHelpGuide = useCallback((target = {}) => setRequest({ ...target, nonce: Date.now() }), [])
  const consumeHelpGuideRequest = useCallback(() => setRequest(null), [])
  const closeHelpGuide = useCallback(() => setRequest(null), [])
  const value = useMemo(() => ({ request, openHelpGuide, consumeHelpGuideRequest, closeHelpGuide }), [request, openHelpGuide, consumeHelpGuideRequest, closeHelpGuide])
  return <HelpGuideContext.Provider value={value}>{children}</HelpGuideContext.Provider>
}

export function useHelpGuide() {
  return useContext(HelpGuideContext) || { request: null, openHelpGuide: () => {}, consumeHelpGuideRequest: () => {}, closeHelpGuide: () => {} }
}
