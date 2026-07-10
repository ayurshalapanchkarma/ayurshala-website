/**
 * Email Service
 * Handles sending emails via SMTP
 */

'use server'

import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  htmlContent: string
  cc?: string[]
  bcc?: string[]
}

class EmailServiceClass {
  private transporter: nodemailer.Transporter | null = null

  /**
   * Initialize email transporter
   */
  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpUser = process.env.SMTP_USER || ''
    const smtpPassword = process.env.SMTP_PASSWORD || ''
    const smtpFromName = process.env.SMTP_FROM_NAME || 'Ayurshala'
    const smtpFromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@ayurshalapanchakarma.com'

    if (!smtpUser || !smtpPassword) {
      throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD environment variables.')
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP connection error:', error)
      } else if (success) {
        console.log('SMTP connection verified successfully')
      }
    })

    return this.transporter
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = this.getTransporter()
      const smtpFromName = process.env.SMTP_FROM_NAME || 'Ayurshala'
      const smtpFromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@ayurshalapanchakarma.com'

      const mailOptions = {
        from: `${smtpFromName} <${smtpFromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.htmlContent,
        cc: options.cc,
        bcc: options.bcc,
      }

      const info = await transporter.sendMail(mailOptions)

      console.log('Email sent successfully:', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      })

      return true
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter()
      await transporter.verify()
      console.log('SMTP connection test passed')
      return true
    } catch (error) {
      console.error('SMTP connection test failed:', error)
      return false
    }
  }
}

export const EmailService = new EmailServiceClass()
