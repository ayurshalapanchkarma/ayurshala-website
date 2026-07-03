/**
 * Medicines Table
 * Name, dosage, instructions, schedule, duration
 */

interface Medicine {
  name: string
  dosage: string
  instructions: string
  schedule: string
  duration: string
}

interface MedicineTableProps {
  medicines: Medicine[]
}

export function MedicineTable({ medicines }: MedicineTableProps) {
  if (!medicines || medicines.length === 0) {
    return null
  }

  return (
    <div className="section mb-4">
      <h3 className="text-sm font-bold text-gray-900 mb-2 border-b-2 border-orange-500 pb-1">
        MEDICINES
      </h3>
      
      <div className="overflow-hidden border border-gray-300 rounded">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-orange-100 border-b border-gray-300">
              <th className="px-2 py-2 text-left font-bold text-gray-800">Medicine Name</th>
              <th className="px-2 py-2 text-left font-bold text-gray-800">Dosage</th>
              <th className="px-2 py-2 text-left font-bold text-gray-800">Instructions</th>
              <th className="px-2 py-2 text-left font-bold text-gray-800">Schedule</th>
              <th className="px-2 py-2 text-left font-bold text-gray-800">Duration</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((med, i) => (
              <tr key={i} className="medicine-row border-b border-gray-300 hover:bg-orange-50">
                <td className="px-2 py-2 text-gray-900">{med.name || '—'}</td>
                <td className="px-2 py-2 text-gray-900">{med.dosage || '—'}</td>
                <td className="px-2 py-2 text-gray-900">{med.instructions || '—'}</td>
                <td className="px-2 py-2 text-gray-900">{med.schedule || '—'}</td>
                <td className="px-2 py-2 text-gray-900">{med.duration || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
