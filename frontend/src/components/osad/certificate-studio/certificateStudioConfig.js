export const STUDIO_SECTIONS = [
  { id: 'design', label: 'Design' },
  { id: 'content', label: 'Content' },
  { id: 'signatories', label: 'Signatories' },
  { id: 'publishing', label: 'Review & Publish' }
]

export const STUDIO_LAYOUT_DEFAULTS = {
  page_size: 'A4', orientation: 'landscape', alignment: 'center', theme_id: 'emerald_gold',
  border_style: 'classic_ornate', logo_placement: 'top_center', signature_layout: 'single_row', qr_placement: 'bottom_right',
  margin_preset: 'balanced', composition: 'ceremonial', background_source: 'built_in', background_preset: 'formal_institutional',
  background_fit: 'fill', background_intensity: 'medium', primary_color: '#0f6848', secondary_color: '#c99a35',
  title_color: '#12372b', recipient_color: '#0b3b2a', border_color: '#0f6848', divider_color: '#c99a35',
  typography_preset: 'marist_formal', title_font: 'Georgia', recipient_font: 'Georgia', body_font: 'Arial', footer_font: 'Arial',
  title_size: 'large', recipient_size: 'large', recipient_weight: 'bold', recipient_case: 'uppercase', recipient_underline: true,
  role_size: 'medium', role_weight: 'bold', role_case: 'uppercase', role_accent: true, show_role_block: true,
  show_logo: true, show_seal: true, show_watermark: true, show_organizer: true, show_activity_details: true,
  show_certificate_number: true, show_qr: true, show_footer: true, show_secondary_signatory: true,
  watermark_type: 'university_seal', watermark_intensity: 'very_light', seal_placement: 'watermark_center',
  frame_style: 'formal', corner_treatment: 'classic', signatory_arrangement: 'two_columns',
  qr_caption: 'Verify this certificate', qr_placement_studio: 'bottom_right', show_verification_text: true,
  asset_reference_id: null, font_asset_reference_id: null
}

export const CONTENT_DEFAULTS = {
  heading: 'CERTIFICATE', secondary_heading: 'OF APPRECIATION', optional_prefix: '',
  recipient_lead_in: 'This certificate is proudly presented to', recipient_subtitle: '',
  body: 'In sincere appreciation of service as {{contribution_role}} during {{activity_title}}.',
  role_line: '{{contribution_role}}', activity_details: 'Held on {{activity_date}} and organized by {{organizer_name}}.',
  closing_statement: 'Given this {{issued_date}}.',
  footer_note: 'Certificate {{certificate_number}} · {{verification_url}}'
}

export const STYLE_PRESETS = {
  minimal_academic: { theme_id: 'classic_black', background_preset: 'plain_white', frame_style: 'minimal', border_style: 'minimalist', typography_preset: 'minimal_sans', primary_color: '#1f2937', secondary_color: '#64748b', title_color: '#111827', recipient_color: '#111827', border_color: '#334155', composition: 'balanced' },
  formal_institutional: { theme_id: 'emerald_gold', background_preset: 'formal_institutional', frame_style: 'formal', border_style: 'classic_ornate', typography_preset: 'marist_formal', primary_color: '#0f6848', secondary_color: '#c99a35', title_color: '#12372b', recipient_color: '#0b3b2a', border_color: '#0f6848', composition: 'ceremonial' },
  ceremonial: { theme_id: 'emerald_gold', background_preset: 'classic_ivory', frame_style: 'double', border_style: 'classic_ornate', typography_preset: 'ceremonial_serif', primary_color: '#173f32', secondary_color: '#b38728', title_color: '#173f32', recipient_color: '#173f32', border_color: '#b38728', composition: 'ceremonial' },
  modern_recognition: { theme_id: 'royal_navy', background_preset: 'recognition_gold', frame_style: 'minimal', border_style: 'modern_geometric', typography_preset: 'modern_institutional', primary_color: '#17365d', secondary_color: '#c99a35', title_color: '#17365d', recipient_color: '#17365d', border_color: '#17365d', composition: 'balanced' }
}

export const BACKGROUND_PRESETS = [
  ['plain_white', 'Plain White'], ['minimal_emerald', 'Minimal Emerald Border'], ['formal_institutional', 'Formal Institutional'],
  ['classic_ivory', 'Classic Ivory'], ['recognition_gold', 'Recognition Gold'], ['seal_watermark', 'Seal Watermark']
]

export const TYPOGRAPHY_PRESETS = [
  ['marist_formal', 'Marist Formal'], ['modern_institutional', 'Modern Institutional'], ['traditional_academic', 'Traditional Academic'],
  ['ceremonial_serif', 'Ceremonial Serif'], ['minimal_sans', 'Minimal Sans']
]

export const PREVIEW_SCENARIOS = {
  standard: {},
  long_recipient: { recipient_name: 'MARIA ALEXANDRA DE LA CRUZ SANTOS' },
  long_activity: { activity_title: 'University-Wide Community Leadership and Sustainable Development Congress 2026' },
  long_organizer: { organizer_name: 'Notre Dame of Marbel University Office of Student Affairs and Community Development Programs' },
  recognition: { recognition_title: 'Outstanding Student Achievement', placement: '1ST PLACE', contribution_role: 'CHAMPION' },
  one_signatory: { studio_signatory_count: 1 },
  two_signatories: { studio_signatory_count: 2 },
  three_signatories: { studio_signatory_count: 3 }
}

export const FIELD_GROUPS = {
  Recipient: ['recipient_name'],
  Activity: ['activity_title', 'activity_type', 'activity_date', 'date_range', 'organizer_name'],
  Contribution: ['student_role', 'contribution_role'],
  Recognition: ['recognition_title', 'placement', 'granting_body', 'scope'],
  System: ['issued_date', 'certificate_number', 'verification_url']
}

export function normalizeStudioDraft(version) {
  return {
    version_number: version?.version_number,
    governance: version?.governance || {},
    content_schema: { ...CONTENT_DEFAULTS, ...(version?.content_schema || {}) },
    layout_schema: { ...STUDIO_LAYOUT_DEFAULTS, ...(version?.layout_schema || {}) },
    placeholder_contract: (version?.placeholder_contract || []).map(item => ({ ...item })),
    signatory_slots: (version?.signatory_slots || []).map(item => ({ ...item })),
    asset_bindings: { ...(version?.asset_bindings || {}) },
    change_summary: version?.governance?.change_summary || ''
  }
}

export function detectStudioIssues(draft, previewData = {}) {
  if (!draft) return []
  const content = draft.content_schema
  const issues = []
  const recipient = previewData.recipient_name || 'JUAN DELA CRUZ'
  const activity = previewData.activity_title || 'Community Outreach 2026'
  const organizer = previewData.organizer_name || 'NDMU Office of Student Affairs'
  if (recipient.length > 28) issues.push({ code: 'RECIPIENT_OVERFLOW', area: 'Recipient', message: 'Recipient name does not fit comfortably in this design.' })
  if (activity.length > 54) issues.push({ code: 'ACTIVITY_OVERFLOW', area: 'Activity details', message: 'Activity title needs more room in this design.' })
  if (organizer.length > 70) issues.push({ code: 'ORGANIZER_OVERFLOW', area: 'Activity details', message: 'Organizer name needs more room in this design.' })
  if ((content.body || '').length > 260) issues.push({ code: 'BODY_OVERFLOW', area: 'Main statement', message: 'Certificate message is too long for the available space.' })
  if ((content.role_line || '').length > 44) issues.push({ code: 'ROLE_OVERFLOW', area: 'Role / placement', message: 'Role or result needs more room in this design.' })
  if (draft.signatory_slots.some(slot => (slot.display_label || '').length > 48)) issues.push({ code: 'SIGNATORY_LABEL_OVERFLOW', area: 'Signatories', message: 'A signatory label needs more room.' })
  if (draft.signatory_slots.length > 3) issues.push({ code: 'SIGNATORY_COLLISION', area: 'Signatories', message: 'Signatory section needs more room. Use no more than three signers.' })
  if (draft.layout_schema.show_qr && draft.layout_schema.qr_placement_studio === 'footer_center' && draft.signatory_slots.length >= 3) issues.push({ code: 'QR_COLLISION', area: 'QR area', message: 'Verification area needs more room with three signers.' })
  return issues
}
