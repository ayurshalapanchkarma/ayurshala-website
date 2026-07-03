/**
 * Signature Block
 * Doctor name, date, signature area
 */

interface SignatureProps {
  doctor_name: string
}

export function Signature({ doctor_name }: SignatureProps) {
  return (
    <div className="signature-block mt-8 pt-6 border-t border-gray-300">
      <div className="grid grid-cols-2 gap-8">
        {/* Signature area */}
        <div className="text-center">
          <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
          <p className="text-xs font-semibold text-gray-800">Doctor's Signature</p>
        </div>

        {/* Date */}
        <div className="text-center">
          <div className="h-16 flex items-end justify-center mb-2">
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-800">Date</p>
        </div>
      </div>

      {/* Doctor info */}
      <div className="mt-4 pt-4 border-t text-center">
        <p className="text-sm font-bold text-gray-900">{doctor_name || 'Dr. [Name]'}</p>
        <p className="text-xs text-gray-600">Ayurvedic Practitioner</p>
        <p className="text-xs text-gray-600 mt-1">Ayurshala Panchakarma</p>
      </div>
    </div>
  )
}
