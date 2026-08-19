/**
 * AcademicStructureModel.js
 * Domain model managing the strict academic hierarchy:
 * College -> Department under College -> Degree Program under Department.
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

export class DepartmentEntity {
  #id
  #college_id
  #college_code
  #code
  #name
  #assigned_coordinator_id
  #assigned_coordinator_name
  #created_at

  constructor(data = {}) {
    this.#id = data.id || `dept_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    this.#college_id = data.college_id || 'col_ceac'
    this.#college_code = (data.college_code || 'CEAC').trim().toUpperCase()
    this.#code = (data.code || 'CS').trim().toUpperCase()
    this.#name = (data.name || 'Department of Computer Studies').trim()
    this.#assigned_coordinator_id = data.assigned_coordinator_id || null
    this.#assigned_coordinator_name = data.assigned_coordinator_name || null
    this.#created_at = data.created_at || new Date().toISOString()
  }

  get id() { return this.#id }
  get college_id() { return this.#college_id }
  get college_code() { return this.#college_code }
  get code() { return this.#code }
  get name() { return this.#name }
  get assigned_coordinator_id() { return this.#assigned_coordinator_id }
  get assigned_coordinator_name() { return this.#assigned_coordinator_name }
  get created_at() { return this.#created_at }

  toJSON() {
    return {
      id: this.#id,
      college_id: this.#college_id,
      college_code: this.#college_code,
      code: this.#code,
      name: this.#name,
      assigned_coordinator_id: this.#assigned_coordinator_id,
      assigned_coordinator_name: this.#assigned_coordinator_name,
      created_at: this.#created_at
    }
  }
}

export class ProgramEntity {
  #id
  #department_id
  #department_code
  #college_id
  #college_code
  #code
  #name
  #degree_level
  #created_at

  constructor(data = {}) {
    this.#id = data.id || `prog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    this.#department_id = data.department_id || 'dept_cs'
    this.#department_code = (data.department_code || 'CS').trim().toUpperCase()
    this.#college_id = data.college_id || 'col_ceac'
    this.#college_code = (data.college_code || 'CEAC').trim().toUpperCase()
    this.#code = (data.code || 'BSCS').trim().toUpperCase()
    this.#name = (data.name || 'BS Computer Science').trim()
    this.#degree_level = data.degree_level || 'Undergraduate'
    this.#created_at = data.created_at || new Date().toISOString()
  }

  get id() { return this.#id }
  get department_id() { return this.#department_id }
  get department_code() { return this.#department_code }
  get college_id() { return this.#college_id }
  get college_code() { return this.#college_code }
  get code() { return this.#code }
  get name() { return this.#name }
  get degree_level() { return this.#degree_level }
  get created_at() { return this.#created_at }

  toJSON() {
    return {
      id: this.#id,
      department_id: this.#department_id,
      department_code: this.#department_code,
      college_id: this.#college_id,
      college_code: this.#college_code,
      code: this.#code,
      name: this.#name,
      degree_level: this.#degree_level,
      created_at: this.#created_at
    }
  }
}

export default {
  CollegeEntity,
  DepartmentEntity,
  ProgramEntity
}
