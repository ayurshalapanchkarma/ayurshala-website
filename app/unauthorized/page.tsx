'use client'
import StatusPage from '@/components/StatusPage'

export default function Unauthorized() {
  return (
    <StatusPage
      statusType="error"
      title="Unauthorized Access"
      description="The Google account you used does not have administrator privileges."
      primaryAction={{ label: 'Sign in with another account', href: '/admin/login' }}
      secondaryAction={{ label: 'Return Home', href: '/' }}
    />
  )
}
