import UserModel from '../models/UserModel'

const STORAGE_KEY_USER = 'achievenest_user_session'

/**
 * AuthController.js
 * MVC Controller managing authentication state, role context switching, and storage persistence.
 */
export default class AuthController {
  static #cachedUser = null

  static getCurrentUser() {
    if (this.#cachedUser) {
      return this.#cachedUser
    }

    try {
      const local = localStorage.getItem(STORAGE_KEY_USER)
      const session = sessionStorage.getItem(STORAGE_KEY_USER)
      let raw = null
      if (local) raw = JSON.parse(local)
      else if (session) raw = JSON.parse(session)

      if (raw) {
        this.#cachedUser = UserModel.fromJSON(raw)
      } else {
        // Default Demo User
        this.#cachedUser = new UserModel({
          id: 'usr_coord_001',
          student_id: '2024-00000',
          full_name: 'Dr. Ana Reyes',
          email: 'ana.reyes@ndmu.edu.ph',
          role: 'personnel',
          active_role_context: 'personnel',
          program_scope: 'BS Computer Science',
          department: 'College of Engineering & Architecture',
          designation: 'Program Coordinator & Associate Professor'
        })
        this.saveUser(this.#cachedUser)
      }
    } catch (e) {
      console.error('AuthController getCurrentUser error:', e)
      this.#cachedUser = new UserModel()
    }

    return this.#cachedUser
  }

  static updateUserRoleContext(newRoleContext) {
    const user = this.getCurrentUser()
    user.active_role_context = newRoleContext
    this.saveUser(user)
    return user
  }

  static saveUser(userInstance) {
    this.#cachedUser = userInstance
    const payload = JSON.stringify(userInstance.toJSON())
    try {
      localStorage.setItem(STORAGE_KEY_USER, payload)
      sessionStorage.setItem(STORAGE_KEY_USER, payload)
      window.dispatchEvent(new Event('storage'))
    } catch (e) {
      console.error('AuthController saveUser error:', e)
    }
  }

  static logout() {
    this.#cachedUser = null
    try {
      localStorage.removeItem(STORAGE_KEY_USER)
      sessionStorage.removeItem(STORAGE_KEY_USER)
      window.dispatchEvent(new Event('storage'))
    } catch (e) {
      console.error('AuthController logout error:', e)
    }
  }
}
