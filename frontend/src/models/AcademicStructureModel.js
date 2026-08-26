/**
 * AcademicStructureModel.js
 * Domain model managing the target academic hierarchy:
 * College -> Academic Program (direct college_id)
 * and Administrative Units for Non-Academic personnel.
 */

export class CollegeEntity {
  #id
  #code
  #name
  #description
  #created_at

  constructor(data = {}) {
    this.#id = data.id || `col_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    this.#code = (data.code || 'CEAC').trim().toUpperCase()
    this.#name = (data.name || 'College of Engineering, Architecture, and Computing').trim()
    this.#description = data.description || ''
    this.#created_at = data.created_at || new Date().toISOString()
  }

  get id() { return this.#id }
  get code() { return this.#code }
  get name() { return this.#name }
  get description() { return this.#description }
  get created_at() { return this.#created_at }

  toJSON() {
    return {
      id: this.#id,
      code: this.#code,
      name: this.#name,
      description: this.#description,
      created_at: this.#created_at
    }
  }
}

export class AcademicProgramEntity {
  #id
  #college_id
  #college_code
  #college_name
  #code
  #name
  #degree_level
  #assigned_coordinator_id
  #assigned_coordinator_name
  #created_at

  constructor(data = {}) {
    this.#id = data.id || `prog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    this.#college_id = data.college_id || ''
    this.#college_code = (data.college_code || '').trim().toUpperCase()
    this.#college_name = data.college_name || ''
    this.#code = (data.code || 'BSCS').trim().toUpperCase()
    this.#name = (data.name || 'BS Computer Science').trim()
    this.#degree_level = data.degree_level || 'Undergraduate'
    this.#assigned_coordinator_id = data.assigned_coordinator_id || null
    this.#assigned_coordinator_name = data.assigned_coordinator_name || null
    this.#created_at = data.created_at || new Date().toISOString()
  }

  get id() { return this.#id }
  get college_id() { return this.#college_id }
  get college_code() { return this.#college_code }
  get college_name() { return this.#college_name }
  get code() { return this.#code }
  get name() { return this.#name }
  get degree_level() { return this.#degree_level }
  get assigned_coordinator_id() { return this.#assigned_coordinator_id }
  get assigned_coordinator_name() { return this.#assigned_coordinator_name }
  get created_at() { return this.#created_at }

  toJSON() {
    return {
      id: this.#id,
      college_id: this.#college_id,
      college_code: this.#college_code,
      college_name: this.#college_name,
      code: this.#code,
      name: this.#name,
      degree_level: this.#degree_level,
      assigned_coordinator_id: this.#assigned_coordinator_id,
      assigned_coordinator_name: this.#assigned_coordinator_name,
      created_at: this.#created_at
    }
  }
}

export class AdministrativeUnitEntity {
  #id
  #code
  #name
  #description
  #created_at

  constructor(data = {}) {
    this.#id = data.id || `unit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    this.#code = (data.code || 'PPS').trim().toUpperCase()
    this.#name = (data.name || 'Physical Plant & Security').trim()
    this.#description = data.description || ''
    this.#created_at = data.created_at || new Date().toISOString()
  }

  get id() { return this.#id }
  get code() { return this.#code }
  get name() { return this.#name }
  get description() { return this.#description }
  get created_at() { return this.#created_at }

  toJSON() {
    return {
      id: this.#id,
      code: this.#code,
      name: this.#name,
      description: this.#description,
      created_at: this.#created_at
    }
  }
}

// Backward compatibility alias
export const ProgramEntity = AcademicProgramEntity

export default {
  CollegeEntity,
  AcademicProgramEntity,
  AdministrativeUnitEntity,
  ProgramEntity
}
