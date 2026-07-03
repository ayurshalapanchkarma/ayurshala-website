/**
 * Discharge Summary Footer
 * Contact info, address, copyright
 */

export function Footer() {
  return (
    <div className="footer border-t-2 border-orange-500 pt-4 mt-8 text-xs text-gray-600 text-center no-break">
      <p className="font-semibold text-gray-800">AYURSHALA PANCHAKARMA</p>
      <p>Authentic Ayurvedic Treatment Centre</p>
      <p className="mt-1">Contact: +91-9821224767</p>
      <p className="text-gray-500 mt-2">
        This document is a confidential medical record. © Ayurshala Panchakarma
      </p>
    </div>
  )
}
