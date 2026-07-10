/**
 * Inventory Notification Email Template
 * Generates branded HTML emails for all inventory notifications
 */

export interface NotificationEmailData {
  greeting: string
  notificationType: string
  details: Array<{ label: string; value: string }>
  remarks?: string
  timestamp: string
}

export function generateNotificationEmailHTML(data: NotificationEmailData): string {
  const { greeting, notificationType, details, remarks, timestamp } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Notification</title>
    <style type="text/css">
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #F6F8FA;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #FFFFFF;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .logo {
            max-width: 130px;
            height: auto;
            margin-bottom: 20px;
        }
        .header-title {
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            letter-spacing: 0.5px;
        }
        .divider {
            height: 1px;
            background-color: #E5E7EB;
            margin: 0;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 16px;
            color: #1F2937;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .intro-text {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .section-divider {
            border-top: 1px solid #E5E7EB;
            margin: 25px 0;
        }
        .details-section {
            background-color: #F9FAFB;
            padding: 20px;
            border-radius: 6px;
            margin: 25px 0;
        }
        .details-title {
            font-size: 14px;
            font-weight: 700;
            color: #1F2937;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 15px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #E5E7EB;
            font-size: 13px;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #6B7280;
            font-weight: 500;
            min-width: 140px;
        }
        .detail-value {
            color: #1F2937;
            font-weight: 600;
            text-align: right;
            flex: 1;
            padding-left: 20px;
        }
        .remarks {
            background-color: #F0FDF4;
            border-left: 4px solid #10B981;
            padding: 12px 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #047857;
            line-height: 1.6;
        }
        .cta-container {
            text-align: center;
            margin: 30px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: #FFFFFF;
            text-decoration: none;
            padding: 12px 40px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.5px;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .footer-divider {
            border-top: 1px solid #E5E7EB;
            margin: 30px 0;
        }
        .footer {
            text-align: center;
            padding: 0 20px 20px;
            font-size: 12px;
            color: #9CA3AF;
            line-height: 1.6;
        }
        .footer-brand {
            color: #1F2937;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .footer-note {
            font-style: italic;
            margin-top: 10px;
            color: #9CA3AF;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
            }
            .content {
                padding: 20px;
            }
            .detail-row {
                flex-direction: column;
            }
            .detail-label,
            .detail-value {
                text-align: left;
                padding-left: 0;
                margin-bottom: 5px;
            }
            .header {
                padding: 30px 15px;
            }
            .logo {
                max-width: 100px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <img src="https://www.ayurshalapanchakarma.com/ayurshala_text.png" alt="Ayurshala Logo" class="logo">
            <h1 class="header-title">Inventory Notification</h1>
        </div>
        <div class="divider"></div>

        <!-- Content -->
        <div class="content">
            <!-- Greeting -->
            <div class="greeting">${greeting}</div>
            
            <div class="intro-text">
                A new inventory notification has been generated.
            </div>

            <div class="section-divider"></div>

            <!-- Details Section -->
            <div class="details-section">
                <div class="details-title">Notification Details</div>
                ${details.map(detail => `
                <div class="detail-row">
                    <span class="detail-label">${detail.label}</span>
                    <span class="detail-value">${detail.value}</span>
                </div>
                `).join('')}
            </div>

            <!-- Remarks -->
            ${remarks ? `
            <div class="remarks">
                ${remarks}
            </div>
            ` : ''}

            <!-- CTA Button -->
            <div class="cta-container">
                <a href="https://www.ayurshalapanchakarma.com/admin/inventory" class="cta-button">
                    Open Inventory
                </a>
            </div>

            <div class="section-divider"></div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-brand">Thank you,</div>
                <div class="footer-brand" style="color: #10B981;">Ayurshala Inventory System</div>
                <div style="margin-top: 15px; border-top: 1px solid #E5E7EB; padding-top: 15px;">
                    © 2026 Ayurshala
                </div>
                <div class="footer-note">
                    This is an automated notification.<br>
                    Please do not reply to this email.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}

export function generateDisabledNotificationEmailHTML(
  notificationType: string,
  disabledTime: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Notifications Disabled</title>
    <style type="text/css">
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #F6F8FA;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #FFFFFF;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .logo {
            max-width: 130px;
            height: auto;
            margin-bottom: 20px;
        }
        .header-title {
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            letter-spacing: 0.5px;
        }
        .divider {
            height: 1px;
            background-color: #E5E7EB;
            margin: 0;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 16px;
            color: #1F2937;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .intro-text {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .section-divider {
            border-top: 1px solid #E5E7EB;
            margin: 25px 0;
        }
        .alert-box {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 20px;
            border-radius: 6px;
            margin: 25px 0;
        }
        .alert-content {
            font-size: 14px;
            color: #92400E;
            line-height: 1.8;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 13px;
            color: #6B7280;
        }
        .detail-label {
            font-weight: 600;
            color: #1F2937;
        }
        .detail-value {
            color: #1F2937;
            font-weight: 600;
        }
        .footer-divider {
            border-top: 1px solid #E5E7EB;
            margin: 30px 0;
        }
        .footer {
            text-align: center;
            padding: 0 20px 20px;
            font-size: 12px;
            color: #9CA3AF;
            line-height: 1.6;
        }
        .footer-brand {
            color: #1F2937;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .footer-note {
            font-style: italic;
            margin-top: 10px;
            color: #9CA3AF;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <img src="https://www.ayurshalapanchakarma.com/ayurshala_text.png" alt="Ayurshala Logo" class="logo">
            <h1 class="header-title">Inventory Notifications Disabled</h1>
        </div>
        <div class="divider"></div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">Hello Admin,</div>
            
            <div class="intro-text">
                A notification category has been disabled in your Inventory Settings.
            </div>

            <div class="alert-box">
                <div class="alert-content">
                    <div class="detail-row">
                        <span class="detail-label">Notification Type:</span>
                        <span class="detail-value">${notificationType}</span>
                    </div>
                    <div class="detail-row" style="margin-top: 10px;">
                        <span class="detail-label">Disabled On:</span>
                        <span class="detail-value">${disabledTime}</span>
                    </div>
                </div>
            </div>

            <div class="intro-text">
                No further emails for this notification type will be sent until it is enabled again.
                <br><br>
                To re-enable notifications, please visit your Inventory Settings page.
            </div>

            <div class="section-divider"></div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-brand">Regards,</div>
                <div class="footer-brand" style="color: #F59E0B;">Ayurshala Inventory System</div>
                <div style="margin-top: 15px; border-top: 1px solid #E5E7EB; padding-top: 15px;">
                    © 2026 Ayurshala
                </div>
                <div class="footer-note">
                    This is an automated email.<br>
                    Please do not reply.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}
