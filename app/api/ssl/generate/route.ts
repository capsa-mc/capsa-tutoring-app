import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { PDFDocument, PDFTextField } from 'pdf-lib'
import { cookies } from 'next/headers'
import { StorageError } from '@supabase/storage-js'

interface SslRecord {
  name: string
  group: string
  startDate: string
  endDate: string
  ssl: string
  [key: string]: unknown
}

interface FieldInfo {
  name: string
  value: string
  type: string
}

interface RequestBody {
  firstName: string
  lastName: string
}

const BUCKET_NAME = 'private-files'
const SSL_PDF_NAME = 'ssl.pdf'
const SSL_JSON_NAME = 'ssl.json'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

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

    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`)
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - No user found' }, { status: 401 })
    }

    const body = await request.json() as RequestBody
    
    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    const fullName = `${body.lastName}, ${body.firstName}`

    // First check if files exist
    const { data: files, error: listError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list('', {
        search: SSL_JSON_NAME
      })

    console.log('POST - File check:', {
      files,
      listError
    })

    if (listError) {
      console.error('List error:', listError)
      throw new Error(`Storage list error: ${listError.message}`)
    }

    if (!files?.some(file => file.name === SSL_JSON_NAME)) {
      return NextResponse.json({ error: 'SSL data file not found' }, { status: 404 })
    }

    // Get signed URL for JSON file
    const { data: jsonSignedData, error: jsonSignedError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .createSignedUrl(SSL_JSON_NAME, 60)

    console.log('POST - JSON Signed URL:', {
      jsonSignedData,
      jsonSignedError
    })

    if (jsonSignedError) {
      console.error('JSON Signed URL error:', jsonSignedError)
      throw new Error(`Failed to create JSON signed URL: ${jsonSignedError.message}`)
    }

    if (!jsonSignedData?.signedUrl) {
      throw new Error('No signed URL received for JSON file')
    }

    // Download JSON data using signed URL
    const jsonResponse = await fetch(jsonSignedData.signedUrl)
    if (!jsonResponse.ok) {
      throw new Error(`Failed to download JSON file: ${jsonResponse.statusText}`)
    }

    const sslData = await jsonResponse.json() as SslRecord[]
    
    // Find matching record
    const sslRecord = sslData.find((record) => record.name === fullName)
    if (!sslRecord) {
      return NextResponse.json(
        { error: 'No SSL record found for this user' },
        { status: 404 }
      )
    }

    // Get signed URL for PDF file
    const { data: pdfSignedData, error: pdfSignedError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .createSignedUrl(SSL_PDF_NAME, 60)

    console.log('POST - PDF Signed URL:', {
      pdfSignedData,
      pdfSignedError
    })

    if (pdfSignedError) {
      console.error('PDF Signed URL error:', pdfSignedError)
      throw new Error(`Failed to create PDF signed URL: ${pdfSignedError.message}`)
    }

    if (!pdfSignedData?.signedUrl) {
      throw new Error('No signed URL received for PDF file')
    }

    // Download PDF using signed URL
    const pdfResponse = await fetch(pdfSignedData.signedUrl)
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF file: ${pdfResponse.statusText}`)
    }

    const pdfBytes = await pdfResponse.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const form = pdfDoc.getForm()

    // make sslRecord a hashmap string -> string
    const sslRecordMap = new Map(Object.entries(sslRecord))
    
    // Debug: List all form fields
    const fields = form.getFields()
    const fieldInfos: FieldInfo[] = fields
      .filter((field): field is PDFTextField => field instanceof PDFTextField)
      .map(field => ({
        name: field.getName(),
        value: field.getText() || '',
        type: field.constructor.name
      }))
    
    console.log('Available form fields:', fieldInfos)

    // Process each field
    fields.forEach(field => {
      if (field instanceof PDFTextField) {
        try {
          const key = field.getText() || ''
          if (key && sslRecordMap.has(key)) {
            const value = sslRecordMap.get(key)
            if (value) {
              field.setText(String(value))
              field.enableReadOnly()
            }
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Unknown error')
          console.warn(`Error processing field ${field.getName()}:`, error)
        }
      }
    })
 
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save()
    
    return new NextResponse(modifiedPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ssl_form_${body.lastName}_${body.firstName}.pdf"`,
      },
    })
  } catch (error: unknown) {
    console.error('Error generating SSL form:', error)
    let status = 500
    let message = 'Failed to generate SSL form'

    if (error instanceof Error) {
      message = error.message
      if (error instanceof StorageError && error.message.includes('status code')) {
        const match = error.message.match(/status code (\d+)/)
        if (match) {
          status = parseInt(match[1], 10)
        }
      }
    }

    return NextResponse.json(
      { error: message },
      { status }
    )
  }
} 