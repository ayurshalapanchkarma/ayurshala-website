/**
 * Discharge Summary Header
 * Logo, clinic name, title
 */

export function Header() {
  return (
    <div className="no-break border-4 border-orange-500 p-6 mb-6 bg-white">
      {/* Logo and clinic name */}
      <div className="text-center mb-4">
        <img 
          src="/ayurshala_text.png" 
          alt="Ayurshala" 
          className="h-10 mx-auto mb-2"
        />
        <h1 className="text-2xl font-bold text-gray-900">AYURSHALA PANCHAKARMA</h1>
        <p className="text-sm text-gray-600 mt-1">Authentic Ayurvedic Treatment Centre</p>
      </div>

      {/* Title */}
      <div className="border-t-2 border-orange-500 pt-4">
        <h2 className="text-xl font-bold text-center text-orange-700">DISCHARGE SUMMARY</h2>
      </div>
    </div>
  )
}
