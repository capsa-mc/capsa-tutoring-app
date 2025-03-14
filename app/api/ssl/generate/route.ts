import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { PDFDocument, PDFTextField } from 'pdf-lib'

interface SslRecord {
  name: string
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

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as RequestBody
    
    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    const fullName = `${body.lastName}, ${body.firstName}`

    // Read SSL JSON data
    const sslJsonPath = path.join(process.cwd(), 'local', 'ssl.json')
    if (!fs.existsSync(sslJsonPath)) {
      return NextResponse.json(
        { error: 'SSL data file not found' },
        { status: 404 }
      )
    }

    const sslData = JSON.parse(fs.readFileSync(sslJsonPath, 'utf-8')) as SslRecord[]
    
    // Find matching record
    const sslRecord = sslData.find((record) => record.name === fullName)
    if (!sslRecord) {
      return NextResponse.json(
        { error: 'No SSL record found for this user' },
        { status: 404 }
      )
    }

    // Read PDF template
    const sslPdfPath = path.join(process.cwd(), 'local', 'ssl.pdf')
    if (!fs.existsSync(sslPdfPath)) {
      return NextResponse.json(
        { error: 'SSL PDF template not found' },
        { status: 404 }
      )
    }

    const pdfBytes = fs.readFileSync(sslPdfPath)
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
          console.warn(`Error processing field ${field.getName()}:`, err)
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate SSL form'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 