export default class AwardManagementController {
  constructor(initialAwardCategories = [], initialAwardees = []) {
    this.awardCategories = initialAwardCategories
    this.awardees = initialAwardees
  }

  getAwardCategories() {
    return [...this.awardCategories]
  }

  createAwardCategory(categoryData) {
    const newCategory = {
      id: `award-${Date.now()}`,
      title: categoryData.title,
      category_type: categoryData.category_type || 'General Recognition',
      description: categoryData.description || '',
      min_points: Number(categoryData.min_points) || 100,
      weight_multiplier: Number(categoryData.weight_multiplier) || 1.0,
      required_prerequisites: categoryData.required_prerequisites || 'None',
      attached_template_id: categoryData.attached_template_id || 'OSAD-TPL-01',
      attached_template_name: categoryData.attached_template_name || 'Official NDMU Certificate of Participation',
      is_active: true,
      confirmed_awardees: 0
    }

    this.awardCategories.push(newCategory)
    return newCategory
  }

  confirmAwardee(candidateDataOrId) {
    const candidateId = typeof candidateDataOrId === 'string' ? candidateDataOrId : candidateDataOrId?.id

    const awardTitle = candidateDataOrId?.award_title || "Dean's Honor Roll"
    this.awardees = this.awardees.filter(a => a.award_title !== awardTitle)

    const awardee = {
      id: candidateId || `awd-rec-${Date.now()}`,
      student_name: candidateDataOrId?.student_name || 'Student Candidate',
      student_id: candidateDataOrId?.student_id || '2024-01234',
      program: candidateDataOrId?.program || 'BS Computer Science',
      award_title: awardTitle,
      rank: candidateDataOrId?.rank || 1,
      total_score: candidateDataOrId?.weighted_score || candidateDataOrId?.score || 90,
      status: 'Confirmed',
      confirmed_at: new Date().toISOString().split('T')[0]
    }

    this.awardees.unshift(awardee)
    return awardee
  }
}