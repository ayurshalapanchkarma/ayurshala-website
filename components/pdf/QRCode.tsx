/**
 * QR Code component
 * Generates a simple QR code using the qrcode library
 */

'use client'

interface QRCodeProps {
  bookingNumber: string
}

export function QRCodeComponent({ bookingNumber }: QRCodeProps) {
  // For now, show a placeholder. In Puppeteer, we'll generate the actual QR using qrcode library.
  // For browser preview, we'll use a simple SVG-based QR or a placeholder.
  
  return (
    <div className="section text-center">
      <h3 className="text-sm font-bold text-gray-900 mb-2">Reference Code</h3>
      <div className="flex justify-center">
        <div className="bg-white p-2 border-4 border-black w-24 h-24 flex items-center justify-center">
          {/* QR code will be generated here by Puppeteer */}
          <div className="text-center">
            <p className="text-xs font-mono text-gray-600">QR Code</p>
            <p className="text-xs text-gray-400 mt-1">(Generated in PDF)</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-2 font-mono break-all">{bookingNumber}</p>
    </div>
  )
}
