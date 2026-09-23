import AwardPotentialCandidatesModel from '../models/AwardPotentialCandidatesModel'
import { fetchPotentialCandidates } from '../services/awardAdminService'

export default class AwardPotentialCandidatesController {
  static async load(award) {
    if (AwardPotentialCandidatesModel.authorityPending(award)) return new AwardPotentialCandidatesModel()
    return new AwardPotentialCandidatesModel(await fetchPotentialCandidates(award.id))
  }

  static select(candidates, controls) {
    return AwardPotentialCandidatesModel.filterAndSort(candidates, controls)
  }
}
