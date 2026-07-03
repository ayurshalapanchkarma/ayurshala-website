/**
 * Discharge Summary Header
 * Professional clinical header with clinic branding and document title
 * 
 * Layout:
 * - Logo (centered, 75px)
 * - Clinic name (bold, 22px, uppercase)
 * - Address (3 lines, 13px, grey)
 * - Contact (13px, grey)
 * - Divider (thin grey line)
 * - Title: DISCHARGE SUMMARY (bold, 18px, uppercase)
 * 
 * Total height: ~130px (maximizes page usage)
 */

export function Header() {
  return (
    <div className="text-center py-4 mb-5 page-break-avoid">
      {/* Logo */}
      <img 
        src="/ayurshala_text.png" 
        alt="Ayurshala" 
        className="h-16 mx-auto mb-3"
        style={{ width: 'auto', maxWidth: '75px' }}
      />

      {/* Clinic Name */}
      <h1 className="text-2xl font-bold text-gray-900 uppercase mb-2" style={{ fontSize: '22px', letterSpacing: '0.3px' }}>
        AYURSHALA PANCHAKARMA CENTER
      </h1>

      {/* Address */}
      <div className="text-sm mb-1" style={{ fontSize: '13px', color: '#555', lineHeight: '1.4' }}>
        <div>SP-28, Wajidpur,</div>
        <div>Sector-130, Noida – 201301</div>
      </div>

      {/* Contact */}
      <div className="text-sm mb-4" style={{ fontSize: '13px', color: '#555' }}>
        +91-9821224767 | ayurshalapanchkarma@gmail.com
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #ccc', margin: '12px 0 16px 0' }} />

      {/* Title */}
      <h2 className="text-lg font-bold text-gray-900 uppercase" style={{ fontSize: '18px', letterSpacing: '1px', fontWeight: 700 }}>
        DISCHARGE SUMMARY
      </h2>
    </div>
  )
}
