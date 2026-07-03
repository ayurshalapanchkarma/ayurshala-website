/**
 * Patient Identifiers Row
 * Compact two-column layout below header for quick document identification
 * 
 * Left column: UHID, Patient name
 * Right column: Date, Doctor
 */

interface PatientIdentifiersProps {
  uhid: string
  patientName: string
  date: string
  doctorName: string
}

export function PatientIdentifiers({ uhid, patientName, date, doctorName }: PatientIdentifiersProps) {
  return (
    <div className="mb-4 page-break-avoid" style={{ marginBottom: '14px' }}>
      <div className="grid grid-cols-2 gap-8" style={{ fontSize: '12px', lineHeight: '1.5' }}>
        {/* Left Column */}
        <div>
          <div className="flex">
            <span className="font-semibold text-gray-700 mr-2" style={{ minWidth: '50px' }}>UHID:</span>
            <span className="text-gray-900">{uhid || '—'}</span>
          </div>
          <div className="flex mt-1">
            <span className="font-semibold text-gray-700 mr-2" style={{ minWidth: '50px' }}>Patient:</span>
            <span className="text-gray-900">{patientName || '—'}</span>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="flex">
            <span className="font-semibold text-gray-700 mr-2" style={{ minWidth: '50px' }}>Date:</span>
            <span className="text-gray-900">{date || '—'}</span>
          </div>
          <div className="flex mt-1">
            <span className="font-semibold text-gray-700 mr-2" style={{ minWidth: '50px' }}>Doctor:</span>
            <span className="text-gray-900">{doctorName || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
