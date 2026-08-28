/**
 * OrganizationModel.js
 * Domain model class representing an NDMU Student Organization profile.
 */
export default class OrganizationModel {
  #id
  #name
  #code
  #college
  #academic_year
  #moderator_name
  #logo_url
  #active_members
  #description
  #contact_email
  #college_dept
  #facebook_url
  #established_year
  #social_status

  constructor(data = {}) {
    this.#id = data.id || 'org-cs-ndmu'
    this.#name = data.name || 'Computer Society NDMU'
    this.#code = data.code || 'CEAC'
    this.#college = data.college || 'College of Engineering, Architecture, and Technology'
    this.#academic_year = data.academic_year || 'AY 2025-2026'
    this.#moderator_name = data.moderator_name || 'Dr. Ana Reyes'
    this.#logo_url = data.logo_url || null
    this.#active_members = data.active_members || 45
    this.#description = data.description || 'The premier technology organization of Notre Dame of Marbel University, dedicated to fostering excellence in computing, innovation, and leadership among its members.'
    this.#contact_email = data.contact_email || 'comsoc@ndmu.edu.ph'
    this.#college_dept = data.college_dept || 'College of Engineering, Architecture, and Technology'
    this.#facebook_url = data.facebook_url || 'https://facebook.com/ComSocNDMU'
    this.#established_year = data.established_year || '1998'
    this.#social_status = data.social_status || 'Facebook Active'
  }

  // Getters
  get id() { return this.#id }
  get name() { return this.#name }
  get code() { return this.#code }
  get college() { return this.#college }
  get academic_year() { return this.#academic_year }
  get moderator_name() { return this.#moderator_name }
  get logo_url() { return this.#logo_url }
  get active_members() { return this.#active_members }
  get description() { return this.#description }
  get contact_email() { return this.#contact_email }
  get college_dept() { return this.#college_dept }
  get facebook_url() { return this.#facebook_url }
  get established_year() { return this.#established_year }
  get social_status() { return this.#social_status }

  // Serializable JSON
  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      code: this.#code,
      college: this.#college,
      academic_year: this.#academic_year,
      moderator_name: this.#moderator_name,
      logo_url: this.#logo_url,
      active_members: this.#active_members,
      description: this.#description,
      contact_email: this.#contact_email,
      college_dept: this.#college_dept,
      facebook_url: this.#facebook_url,
      established_year: this.#established_year,
      social_status: this.#social_status
    }
  }
}

