'use client'
import StatusPage from '@/components/StatusPage'
import { LogIn, Home } from 'lucide-react'

export default function Unauthorized() {
  return (
    <StatusPage
      title="Unauthorized Access"
      description="The Google account you used does not have administrator privileges."
      status="error"
      actionButtons={[
        { label: 'Return Home', href: '/', icon: Home, variant: 'primary' },
        { label: 'Sign in with another account', href: '/admin/login', icon: LogIn, variant: 'secondary' },
      ]}
    />
  )
}
