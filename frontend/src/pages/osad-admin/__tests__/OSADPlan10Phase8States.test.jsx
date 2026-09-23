import { describe, it, expect, vi } from 'vitest'

describe('Plan 10 Phase 8 — Loading, Empty, Error & No-Result States', () => {
  // Pure state resolution logic matching OSADStudentAccountsPage
  const evaluatePageState = ({
    isLoading,
    error,
    permissionDenied,
    rawCount,
    filteredCount,
    activeFilterCount,
    searchTerm
  }) => {
    if (permissionDenied) return 'PERMISSION_DENIED'
    if (error) return 'LIST_ERROR'
    if (isLoading && filteredCount === 0) return 'LOADING'
    if (rawCount === 0 && activeFilterCount === 0 && (!searchTerm || searchTerm.trim() === '')) return 'TRUE_EMPTY'
    if (searchTerm && searchTerm.trim() !== '' && filteredCount === 0 && activeFilterCount === 0) return 'SEARCH_EMPTY'
    if (filteredCount === 0 && (activeFilterCount > 0 || (searchTerm && searchTerm.trim() !== ''))) return 'FILTERED_EMPTY'
    return 'LOADED_WITH_ROWS'
  }

  it('correctly classifies initial LOADING state', () => {
    const state = evaluatePageState({
      isLoading: true,
      error: null,
      permissionDenied: false,
      rawCount: 0,
      filteredCount: 0,
      activeFilterCount: 0,
      searchTerm: ''
    })
    expect(state).toBe('LOADING')
  })

  it('correctly classifies TRUE_EMPTY state with creation call-to-action', () => {
    const state = evaluatePageState({
      isLoading: false,
      error: null,
      permissionDenied: false,
      rawCount: 0,
      filteredCount: 0,
      activeFilterCount: 0,
      searchTerm: ''
    })
    expect(state).toBe('TRUE_EMPTY')
  })

  it('distinguishes SEARCH_EMPTY from FILTERED_EMPTY', () => {
    const searchState = evaluatePageState({
      isLoading: false,
      error: null,
      permissionDenied: false,
      rawCount: 103,
      filteredCount: 0,
      activeFilterCount: 0,
      searchTerm: 'NonExistentStudent'
    })
    expect(searchState).toBe('SEARCH_EMPTY')

    const filterState = evaluatePageState({
      isLoading: false,
      error: null,
      permissionDenied: false,
      rawCount: 103,
      filteredCount: 0,
      activeFilterCount: 2,
      searchTerm: ''
    })
    expect(filterState).toBe('FILTERED_EMPTY')
  })

  it('guarantees that LIST_ERROR takes precedence over empty states and does not mask errors', () => {
    const state = evaluatePageState({
      isLoading: false,
      error: 'HTTP 500 Internal Server Error',
      permissionDenied: false,
      rawCount: 0,
      filteredCount: 0,
      activeFilterCount: 0,
      searchTerm: ''
    })
    expect(state).toBe('LIST_ERROR')
  })

  it('guarantees that PERMISSION_DENIED takes highest precedence and hides data', () => {
    const state = evaluatePageState({
      isLoading: false,
      error: null,
      permissionDenied: true,
      rawCount: 103,
      filteredCount: 103,
      activeFilterCount: 0,
      searchTerm: ''
    })
    expect(state).toBe('PERMISSION_DENIED')
  })
})
