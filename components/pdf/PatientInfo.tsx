/**
 * Patient Information section
 * UHID, name, age, sex, dates of admission/discharge
 */

interface PatientInfoProps {
  patient_uhid: string
  patient_name: string
  age: string
  sex: string
  nationality: string
  address: string
  doa_date: string
  doa_time: string
  dod_date: string
  dod_time: string
}

export function PatientInfo(props: PatientInfoProps) {
  return (
    <div className="no-break mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-orange-500 pb-2">
        PATIENT INFORMATION
      </h3>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold text-gray-700">Patient UHID</p>
          <p className="text-gray-900">{props.patient_uhid || '—'}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">Patient Name</p>
          <p className="text-gray-900">{props.patient_name || '—'}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">Age</p>
          <p className="text-gray-900">{props.age || '—'}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">Sex</p>
          <p className="text-gray-900">{props.sex || '—'}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">Nationality</p>
          <p className="text-gray-900">{props.nationality || '—'}</p>
        </div>
        <div className="col-span-2">
          <p className="font-semibold text-gray-700">Address</p>
          <p className="text-gray-900 text-xs leading-relaxed">{props.address || '—'}</p>
        </div>
      </div>

      {/* Admission and Discharge dates */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
        <div>
          <p className="font-semibold text-gray-700">Date of Admission</p>
          <p className="text-gray-900 text-sm">
            {props.doa_date} {props.doa_time && `@ ${props.doa_time}`}
          </p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">Date of Discharge</p>
          <p className="text-gray-900 text-sm">
            {props.dod_date} {props.dod_time && `@ ${props.dod_time}`}
          </p>
        </div>
      </div>
    </div>
  )
}
