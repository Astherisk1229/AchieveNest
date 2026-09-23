import AwardCandidateReviewModel from '../models/AwardCandidateReviewModel'
import { fetchStudentReviewWorkspace } from '../services/awardAdminService'

export default class AwardCandidateReviewController {
  static async load(awardId, studentId) {
    return new AwardCandidateReviewModel(await fetchStudentReviewWorkspace(awardId, studentId))
  }
}
