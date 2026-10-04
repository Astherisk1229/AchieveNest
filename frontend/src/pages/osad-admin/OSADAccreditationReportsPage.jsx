import React from 'react'
import { FileSpreadsheet } from 'lucide-react'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import { OSADEmptyState } from '../../components/osad/OSADStateBlock'

// There is no accreditation-report endpoint yet, so this page shows no report data.
// It used to render hard-coded sample reports and counts; those were removed so that
// no compliance figure on screen is made up.
export default function OSADAccreditationReportsPage() {
  return (
    <div className="space-y-6 font-sans">
      <OSADPageHeader
        title="Accreditation and Compliance Reports"
        description="Generate traceable reports from verified Student achievement and organization records."
        icon={FileSpreadsheet}
      />
      <OSADEmptyState
        icon={FileSpreadsheet}
        title="Accreditation Reports Are Not Available Yet"
        description="Report generation is not connected to the system yet, so no compliance figures are shown here."
      />
    </div>
  )
}
