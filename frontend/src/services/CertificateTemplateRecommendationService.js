/**
 * CertificateTemplateRecommendationService.js
 * Recommendation engine for matching events and awards to compatible published certificate templates.
 */

export class CertificateTemplateRecommendationService {
  static recommendTemplateForEvent(event = {}, publishedTemplates = []) {
    const eventTemplates = publishedTemplates.filter(t => t.allowedContexts.includes('event'))
    if (eventTemplates.length === 0) {
      return {
        recommendedTemplate: null,
        reason: 'No published event-compatible certificate templates available.',
        confidence: 'none'
      }
    }

    const title = (event.title || '').toLowerCase()
    const cat = (event.category || '').toLowerCase()

    // 1. Leadership match
    if (title.includes('leadership') || cat.includes('leadership')) {
      const match = eventTemplates.find(t => t.code === 'OSAD-TPL-002' || t.name.toLowerCase().includes('leadership'))
      if (match) {
        return {
          recommendedTemplate: match,
          reason: 'Matched leadership keywords in event title/category.',
          confidence: 'high'
        }
      }
    }

    // 2. Workshop / Training match
    if (title.includes('workshop') || title.includes('training') || cat.includes('workshop')) {
      const match = eventTemplates.find(t => t.code === 'OSAD-TPL-003' || t.name.toLowerCase().includes('workshop'))
      if (match) {
        return {
          recommendedTemplate: match,
          reason: 'Matched workshop/training keywords in event title/category.',
          confidence: 'high'
        }
      }
    }

    // 3. Default Participation template match
    const defaultMatch = eventTemplates.find(t => t.code === 'OSAD-TPL-001') || eventTemplates[0]
    return {
      recommendedTemplate: defaultMatch,
      reason: 'Assigned official general participation template.',
      confidence: 'medium'
    }
  }
}

export default CertificateTemplateRecommendationService
