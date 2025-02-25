import { supabase } from '@/utils/supabase'
import { NextResponse } from 'next/server'

function logWithTimestamp(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

export async function GET() {
  logWithTimestamp('API Route: Fetching roles...')
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Has Supabase Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')

    if (error) {
      console.error('Backend Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Successfully fetched roles:', data?.length)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Backend Catch Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 