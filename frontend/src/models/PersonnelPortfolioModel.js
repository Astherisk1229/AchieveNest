/**
 * PersonnelPortfolioModel.js
 * OOP Domain Model encapsulating the complete NDMU Faculty/Personnel Ranking Portfolio,
 * line items across Areas A, B, and C, dual points (claimed vs. verified), area ceiling caps,
 * audit trail, and state machine transition rules.
 */

import RankingCriteriaModel from './RankingCriteriaModel.js'

export default class PersonnelPortfolioModel {
  #id
  #personnel_id
  #personnel_name
  #academic_rank
  #department_id
  #department_name
  #academic_year
  #status
  #area_a_items
  #area_b_items
  #area_c_items
  #years_of_service
  #dep_sec_evaluator_name
  #dep_sec_remarks
  #dep_sec_endorsed_date
  #hr_evaluator_name
  #hr_remarks
  #hr_approved_date
  #audit_trail

  constructor(data = {}) {
    this.#id = data.id || `port_${Math.random().toString(36).substr(2, 9)}`
    this.#personnel_id = data.personnel_id || 'EMP-2024-001'
    this.#personnel_name = data.personnel_name || 'Dr. Maria Santos'
    this.#academic_rank = data.academic_rank || 'Assistant Professor II'
    this.#department_id = data.department_id || 'DEP-CEAC'
    this.#department_name = data.department_name || 'College of Engineering, Architecture & Computing'
    this.#academic_year = data.academic_year || 'AY 2025-2026'
    this.#status = data.status || 'DRAFT'
    this.#years_of_service = Number(data.years_of_service) || 4

    this.#area_a_items = Array.isArray(data.area_a_items) ? data.area_a_items : []
    this.#area_b_items = Array.isArray(data.area_b_items) ? data.area_b_items : []
    this.#area_c_items = Array.isArray(data.area_c_items) ? data.area_c_items : []

    this.#dep_sec_evaluator_name = data.dep_sec_evaluator_name || ''
    this.#dep_sec_remarks = data.dep_sec_remarks || ''
    this.#dep_sec_endorsed_date = data.dep_sec_endorsed_date || null
    this.#hr_evaluator_name = data.hr_evaluator_name || ''
    this.#hr_remarks = data.hr_remarks || ''
    this.#hr_approved_date = data.hr_approved_date || null
    this.#audit_trail = Array.isArray(data.audit_trail) ? data.audit_trail : [
      {
        timestamp: new Date().toISOString(),
        actor_name: this.#personnel_name,
        actor_role: 'Personnel',
        action: 'CREATED_PORTFOLIO',
        previous_status: null,
        new_status: 'DRAFT',
        remarks: 'Portfolio initialized.'
      }
    ]
  }

  // Encapsulated Getters
  get id() { return this.#id }
  get personnel_id() { return this.#personnel_id }
  get personnel_name() { return this.#personnel_name }
  get academic_rank() { return this.#academic_rank }
  get department_id() { return this.#department_id }
  get department_name() { return this.#department_name }
  get academic_year() { return this.#academic_year }
  get status() { return this.#status }
  get years_of_service() { return this.#years_of_service }
  get area_a_items() { return [...this.#area_a_items] }
  get area_b_items() { return [...this.#area_b_items] }
  get area_c_items() { return [...this.#area_c_items] }
  get dep_sec_evaluator_name() { return this.#dep_sec_evaluator_name }
  get dep_sec_remarks() { return this.#dep_sec_remarks }
  get dep_sec_endorsed_date() { return this.#dep_sec_endorsed_date }
  get hr_evaluator_name() { return this.#hr_evaluator_name }
  get hr_remarks() { return this.#hr_remarks }
  get hr_approved_date() { return this.#hr_approved_date }
  get audit_trail() { return [...this.#audit_trail] }
  get auditTrail() { return [...this.#audit_trail] }

  // Setters / Line Item Mutators
  set years_of_service(value) {
    this.#years_of_service = Math.max(0, Number(value) || 0)
  }

  addItem(areaKey, itemData = {}) {
    const newItem = {
      id: `item_${Math.random().toString(36).substr(2, 9)}`,
      category: itemData.category || '',
      title: itemData.title || '',
      scope_level: itemData.scope_level || 'Local',
      claimed_points: Number(itemData.claimed_points) || 0,
      verified_points: Number(itemData.verified_points) || Number(itemData.claimed_points) || 0,
      proof_file_name: itemData.proof_file_name || 'document_proof.pdf',
      is_proof_verified: Boolean(itemData.is_proof_verified) || false,
      remarks: itemData.remarks || ''
    }

    if (areaKey === 'A') this.#area_a_items.push(newItem)
    else if (areaKey === 'B') this.#area_b_items.push(newItem)
    else if (areaKey === 'C') this.#area_c_items.push(newItem)

    return newItem
  }

  updateItemVerification(areaKey, itemId, verifiedPoints, isProofVerified, remarks = '') {
    const items = areaKey === 'A' ? this.#area_a_items : areaKey === 'B' ? this.#area_b_items : this.#area_c_items
    const target = items.find(i => i.id === itemId)
    if (target) {
      if (verifiedPoints !== undefined) target.verified_points = Math.max(0, Number(verifiedPoints) || 0)
      if (isProofVerified !== undefined) target.is_proof_verified = Boolean(isProofVerified)
      if (remarks !== undefined) target.remarks = remarks
    }
  }

  /**
   * Computes raw claimed & verified total scores before area ceiling capping.
   */
  calculateRawTotals() {
    const rawA_claimed = this.#area_a_items.reduce((acc, i) => acc + (Number(i.claimed_points) || 0), 0)
    const rawA_verified = this.#area_a_items.reduce((acc, i) => acc + (Number(i.verified_points) || 0), 0)

    const rawB_claimed = this.#area_b_items.reduce((acc, i) => acc + (Number(i.claimed_points) || 0), 0)
    const rawB_verified = this.#area_b_items.reduce((acc, i) => acc + (Number(i.verified_points) || 0), 0)

    const serviceYearsPts = RankingCriteriaModel.calculateServiceYearsPoints(this.#years_of_service)
    const rawC_claimed = this.#area_c_items.reduce((acc, i) => acc + (Number(i.claimed_points) || 0), 0) + serviceYearsPts
    const rawC_verified = this.#area_c_items.reduce((acc, i) => acc + (Number(i.verified_points) || 0), 0) + serviceYearsPts

    return {
      claimed: { rawA: rawA_claimed, rawB: rawB_claimed, rawC: rawC_claimed, rawTotal: rawA_claimed + rawB_claimed + rawC_claimed },
      verified: { rawA: rawA_verified, rawB: rawB_verified, rawC: rawC_verified, rawTotal: rawA_verified + rawB_verified + rawC_verified },
      serviceYearsPts
    }
  }

  /**
   * Computes official accepted scores after applying NDMU Area Maximum Ceiling Caps (70, 50, 40).
   */
  calculateAcceptedCappedTotals() {
    const { claimed, verified, serviceYearsPts } = this.calculateRawTotals()

    const claimedCapped = RankingCriteriaModel.applyAreaCeilings(claimed.rawA, claimed.rawB, claimed.rawC)
    const verifiedCapped = RankingCriteriaModel.applyAreaCeilings(verified.rawA, verified.rawB, verified.rawC)

    return {
      claimed: claimedCapped,
      verified: verifiedCapped,
      serviceYearsPts
    }
  }

  /**
   * Executes state machine transition with audit trail logging.
   */
  transitionStatus(newStatus, actorName, actorRole, remarks = '') {
    const prevStatus = this.#status
    this.#status = newStatus

    if (newStatus === 'ENDORSED_TO_HR') {
      this.#dep_sec_evaluator_name = actorName
      this.#dep_sec_remarks = remarks
      this.#dep_sec_endorsed_date = new Date().toISOString()
    } else if (newStatus === 'HR_APPROVED') {
      this.#hr_evaluator_name = actorName
      this.#hr_remarks = remarks
      this.#hr_approved_date = new Date().toISOString()
    }

    this.#audit_trail.push({
      timestamp: new Date().toISOString(),
      actor_name: actorName,
      actor_role: actorRole,
      action: `TRANSITION_TO_${newStatus}`,
      previous_status: prevStatus,
      new_status: newStatus,
      remarks: remarks
    })

    return this
  }

  matchesDepartment(departmentId) {
    return !departmentId || this.#department_id === departmentId
  }

  toJSON() {
    const totals = this.calculateAcceptedCappedTotals()
    return {
      id: this.#id,
      personnel_id: this.#personnel_id,
      personnel_name: this.#personnel_name,
      academic_rank: this.#academic_rank,
      department_id: this.#department_id,
      department_name: this.#department_name,
      academic_year: this.#academic_year,
      status: this.#status,
      years_of_service: this.#years_of_service,
      area_a_items: this.#area_a_items,
      area_b_items: this.#area_b_items,
      area_c_items: this.#area_c_items,
      dep_sec_evaluator_name: this.#dep_sec_evaluator_name,
      dep_sec_remarks: this.#dep_sec_remarks,
      dep_sec_endorsed_date: this.#dep_sec_endorsed_date,
      hr_evaluator_name: this.#hr_evaluator_name,
      hr_remarks: this.#hr_remarks,
      hr_approved_date: this.#hr_approved_date,
      totals,
      audit_trail: this.#audit_trail
    }
  }
}
