export function EmailLayout({ children }: { children: string }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; margin: 0; padding: 0; }
  </style>
</head>
<body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#fff;border:1px solid rgba(232,98,26,0.18);box-shadow:0 8px 40px rgba(232,98,26,0.10)">
          <tr>
            <td style="background:linear-gradient(135deg,#fff8f0,#ffe8d0);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)">
              <img src="https://ayurshala-website.vercel.app/ayurshala_text.png" alt="Ayurshala" width="160" style="height:auto;display:block;margin:0 auto 12px;max-width:100%">
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px">
              ${children}
            </td>
          </tr>
          <tr style="background:#fffaf5">
            <td style="padding:16px 40px;text-align:center;border-top:1px solid rgba(232,98,26,0.08)">
              <p style="margin:0;font-size:11px;color:#a8a29e">© 2026 Ayurshala Panchakarma Center | Wellness Through Tradition</p>
              <p style="margin:8px 0 0;font-size:11px;color:#a8a29e">
                <a href="https://www.ayurshalapanchakarma.com" style="color:#E8621A;text-decoration:none">Visit Website</a> • 
                <a href="tel:+919821224767" style="color:#E8621A;text-decoration:none;margin-left:8px">+91-9821224767</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function EmailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)">
      <span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">${label}</span><br>
      <span style="font-size:15px;color:#1a1008;font-weight:600">${value}</span>
    </td>
  </tr>`
}

export function EmailButton(text: string, url: string, color: string = '#E8621A') {
  return `<div style="text-align:center;margin-top:16px">
    <a href="${url}" style="display:inline-block;background:${color};color:#fff;padding:12px 32px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600">
      ${text}
    </a>
  </div>`
}
