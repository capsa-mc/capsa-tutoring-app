import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

const BUCKET_NAME = 'private-files'
const SSL_JSON_NAME = 'ssl.json'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Debug: Check auth state
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('GET - Auth check:', { 
      hasUser: !!user, 
      userId: user?.id,
      authError 
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - No user found' }, { status: 401 })
    }

    // First check if the file exists
    const { data: files, error: listError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list('', {
        search: SSL_JSON_NAME
      })

    console.log('GET - File check:', {
      files,
      listError
    })

    if (listError) {
      console.error('List error:', listError)
      throw listError
    }

    if (!files?.some(file => file.name === SSL_JSON_NAME)) {
      return NextResponse.json({ error: 'SSL data file not found' }, { status: 404 })
    }

    // Get signed URL for the file
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .createSignedUrl(SSL_JSON_NAME, 60) // URL valid for 60 seconds

    console.log('GET - Signed URL:', {
      signedData,
      signedError
    })

    if (signedError) {
      console.error('Signed URL error:', signedError)
      throw signedError
    }

    // Download the file using the signed URL
    const response = await fetch(signedData.signedUrl)
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    const jsonData = await response.json()
    return NextResponse.json(jsonData)
  } catch (error) {
    console.error('Error reading SSL data:', error)
    return NextResponse.json({ error: 'Failed to read SSL data' }, { status: 500 })
  }
} 