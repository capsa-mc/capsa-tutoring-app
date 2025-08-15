import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  console.log('Ping endpoint called at:', new Date().toISOString())
  
  // Get headers for authentication
  const headersList = headers()
  const authHeader = headersList.get('authorization')
  const cronSecret = headersList.get('x-vercel-cron-signature')
  
  // Check if request is from Vercel Cron or has valid auth token
  const isFromVercelCron = !!cronSecret
  const hasValidToken = authHeader === `Bearer ${process.env.CRON_SECRET}`
  
  if (!isFromVercelCron && !hasValidToken) {
    console.log('Unauthorized ping attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Simple query to keep the database active
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Ping error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('Database ping successful')
    return NextResponse.json({
      success: true,
      message: 'Database pinged successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Ping failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to ping database' },
      { status: 500 }
    )
  }
}