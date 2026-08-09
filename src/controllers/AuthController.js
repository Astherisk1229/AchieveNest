import UserModel from '../models/UserModel'

const STORAGE_KEY_USER = 'achievenest_current_user'

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
        return null
      }
    } catch (e) {
      console.error('AuthController getCurrentUser error:', e)
      return null
    }

    return this.#cachedUser
  }

  static updateUserRoleContext(newRoleContext) {
    const user = this.getCurrentUser()
    if (!user) return null
    user.active_role_context = newRoleContext
    this.saveUser(user)
    return user
  }

  /**
   * Demo role context switcher helper for Personnel, Department Secretary, and HR.
   */
  static switchDemoRole(roleKey, departmentId = 'DEP-CEAC') {
    const user = this.getCurrentUser()
    if (!user) return null
    if (roleKey === 'dep_sec') {
      user.active_role_context = 'dep_sec'
      user.department = 'College of Engineering, Architecture & Computing'
    } else if (roleKey === 'hr') {
      user.active_role_context = 'hr'
      user.department = 'Human Resources Office'
    } else {
      user.active_role_context = 'personnel'
      user.department = 'College of Engineering, Architecture & Computing'
    }
    this.saveUser(user)
    return user
  }

  static saveUser(userInstance) {
    this.#cachedUser = userInstance
    const rawData = userInstance && typeof userInstance.toJSON === 'function' ? userInstance.toJSON() : userInstance
    const payload = JSON.stringify(rawData)
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
