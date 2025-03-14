import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Role } from '@/types/database/schema'
import { cookies } from 'next/headers'

const BUCKET_NAME = 'private-files'
const SSL_PDF_NAME = 'ssl.pdf'
const SSL_JSON_NAME = 'ssl.json'

// Check if SSL files exist in the bucket
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

    // Check both files
    const { data: pdfData, error: pdfError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list('', {
        search: SSL_PDF_NAME
      })

    const { data: jsonData, error: jsonError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list('', {
        search: SSL_JSON_NAME
      })

    console.log('GET - Storage check:', {
      pdfData,
      pdfError,
      jsonData,
      jsonError
    })

    if (pdfError || jsonError) {
      throw new Error('Failed to check SSL files')
    }

    const exists = pdfData?.some(file => file.name === SSL_PDF_NAME) &&
                  jsonData?.some(file => file.name === SSL_JSON_NAME)

    return NextResponse.json({ exists })
  } catch (error) {
    console.error('Error checking SSL files:', error)
    return NextResponse.json({ exists: false }, { status: 500 })
  }
}

// Upload SSL files to the bucket
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Debug: Log cookies
    console.log('POST - Cookies:', cookieStore)

    // Debug: Check auth state
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('POST - Auth check:', { 
      hasUser: !!user, 
      userId: user?.id,
      authError 
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - No user found' }, { status: 401 })
    }

    // Get user's role from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('POST - Profile check:', {
      profile,
      profileError,
      userId: user.id
    })

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to get user role' }, { status: 500 })
    }

    // Only allow Coordinators and Admins to upload files
    if (profile.role !== Role.Staff && profile.role !== Role.Admin) {
      return NextResponse.json({ error: 'Only staff and admins can upload SSL files' }, { status: 403 })
    }

    const contentType = request.headers.get('content-type')

    if (contentType?.includes('multipart/form-data')) {
      // Handle PDF file upload
      const formData = await request.formData()
      const pdfFile = formData.get('pdf') as File

      if (!pdfFile || pdfFile.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 })
      }

      const buffer = Buffer.from(await pdfFile.arrayBuffer())
      
      const { error: pdfError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(SSL_PDF_NAME, buffer, {
          contentType: 'application/pdf',
          upsert: true
        })

      console.log('POST - PDF upload:', {
        fileName: SSL_PDF_NAME,
        error: pdfError
      })

      if (pdfError) {
        throw pdfError
      }

      return NextResponse.json({ message: 'PDF template saved successfully' })
    } else {
      // Handle JSON data
      const data = await request.json()
      
      const { error: jsonError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(SSL_JSON_NAME, JSON.stringify(data, null, 2), {
          contentType: 'application/json',
          upsert: true
        })

      console.log('POST - JSON upload:', {
        fileName: SSL_JSON_NAME,
        error: jsonError
      })

      if (jsonError) {
        throw jsonError
      }

      return NextResponse.json({ message: 'SSL data saved successfully' })
    }
  } catch (error) {
    console.error('Error saving file:', error)
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
    console.log('POST - Detailed error:', errorDetails)
    return NextResponse.json({ error: 'Failed to save file', details: errorDetails }, { status: 500 })
  }
}

// Delete SSL files from the bucket
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Debug: Check auth state
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('DELETE - Auth check:', { 
      hasUser: !!user, 
      userId: user?.id,
      authError 
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - No user found' }, { status: 401 })
    }

    // Get user's role from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('DELETE - Profile check:', {
      profile,
      profileError,
      userId: user.id
    })

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to get user role' }, { status: 500 })
    }

    // Only allow Coordinators and Admins to delete files
    if (profile.role !== Role.Staff && profile.role !== Role.Admin) {
      return NextResponse.json({ error: 'Only staff and admins can delete SSL files' }, { status: 403 })
    }

    const { error: pdfError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .remove([SSL_PDF_NAME])

    const { error: jsonError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .remove([SSL_JSON_NAME])

    console.log('DELETE - File removal:', {
      pdfError,
      jsonError
    })

    if (pdfError || jsonError) {
      throw new Error('Failed to delete SSL files')
    }

    return NextResponse.json({ message: 'SSL files deleted successfully' })
  } catch (error) {
    console.error('Error deleting files:', error)
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
    console.log('DELETE - Detailed error:', errorDetails)
    return NextResponse.json({ error: 'Failed to delete SSL files', details: errorDetails }, { status: 500 })
  }
} 