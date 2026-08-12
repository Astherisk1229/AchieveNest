/**
 * UserModel.js
 * OOP Domain Model encapsulating user attributes, roles, and security permissions.
 */
export default class UserModel {
  #id
  #student_id
  #full_name
  #email
  #role
  #active_role_context
  #program_scope
  #department
  #designation
  #avatar_url

  constructor(data = {}) {
    this.#id = data.id || 'usr_default'
    this.#student_id = data.student_id || '2024-00000'
    this.#full_name = data.full_name || 'Dr. Ana Reyes'
    this.#email = data.email || 'ana.reyes@ndmu.edu.ph'
    this.#role = data.role || 'personnel'
    this.#active_role_context = data.active_role_context || data.role || 'personnel'
    this.#program_scope = data.program_scope || 'BS Computer Science'
    this.#department = data.department || 'College of Engineering & Architecture'
    this.#designation = data.designation || 'Program Coordinator & Associate Professor'
    this.#avatar_url = data.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  }

  // Getters (Encapsulation)
  get id() { return this.#id }
  get student_id() { return this.#student_id }
  get full_name() { return this.#full_name }
  get email() { return this.#email }
  get role() { return this.#role }
  get active_role_context() { return this.#active_role_context }
  get program_scope() { return this.#program_scope }
  get department() { return this.#department }
  get designation() { return this.#designation }
  get avatar_url() { return this.#avatar_url }

  // Setters with validation
  set active_role_context(newContext) {
    if (typeof newContext === 'string' && newContext.trim()) {
      this.#active_role_context = newContext.trim()
    }
  }

  // Domain Business Methods
  isCoordinator() {
    return this.#active_role_context === 'program_coordinator'
  }

  isStudent() {
    return this.#active_role_context === 'student'
  }

  toJSON() {
    return {
      id: this.#id,
      student_id: this.#student_id,
      full_name: this.#full_name,
      email: this.#email,
      role: this.#role,
      active_role_context: this.#active_role_context,
      program_scope: this.#program_scope,
      department: this.#department,
      designation: this.#designation,
      avatar_url: this.#avatar_url
    }
  }

  static fromJSON(json) {
    if (!json) return new UserModel()
    return new UserModel(typeof json === 'string' ? JSON.parse(json) : json)
  }
}
