import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      environment: process.env.VERCEL_ENV || 'local',
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
      commitFull: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
      branch: process.env.VERCEL_GIT_COMMIT_REF || 'local',
      buildTime: process.env.VERCEL_BUILD_TIME || new Date().toISOString(),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    }
  )
}
