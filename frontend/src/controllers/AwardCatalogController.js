import AwardCatalogModel from '../models/AwardCatalogModel'

export default class AwardCatalogController {
  static normalize(records) {
    if (!Array.isArray(records)) throw new Error('The server returned an invalid award catalog.')
    return records.map((record) => new AwardCatalogModel(record))
  }

  static filter(awards, searchTerm) {
    const query = String(searchTerm || '').trim().toLocaleLowerCase()
    if (!query) return awards
    return awards.filter((award) => award.name.toLocaleLowerCase().includes(query))
  }
}
