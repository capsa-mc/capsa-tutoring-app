import { NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type')
    
    // Create local directory if it doesn't exist
    const localDir = join(process.cwd(), 'local')
    if (!existsSync(localDir)) {
      await mkdir(localDir, { recursive: true })
    }
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle PDF file upload
      const formData = await request.formData()
      const pdfFile = formData.get('pdf') as File
      
      if (!pdfFile || pdfFile.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 })
      }
      
      const buffer = Buffer.from(await pdfFile.arrayBuffer())
      await writeFile(join(localDir, 'ssl.pdf'), buffer)
      
      return NextResponse.json({ message: 'PDF template saved successfully' })
    } else {
      // Handle JSON data
      const data = await request.json()
      await writeFile(join(localDir, 'ssl.json'), JSON.stringify(data, null, 2))
      
      return NextResponse.json({ message: 'SSL data saved successfully' })
    }
  } catch (error) {
    console.error('Error saving file:', error)
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const localDir = join(process.cwd(), 'local')
    const sslPdfPath = join(localDir, 'ssl.pdf')
    const sslJsonPath = join(localDir, 'ssl.json')
    
    // Delete both files if they exist
    if (existsSync(sslPdfPath)) {
      await unlink(sslPdfPath)
    }
    if (existsSync(sslJsonPath)) {
      await unlink(sslJsonPath)
    }
    
    return NextResponse.json({ message: 'SSL files deleted successfully' })
  } catch (error) {
    console.error('Error deleting files:', error)
    return NextResponse.json({ error: 'Failed to delete SSL files' }, { status: 500 })
  }
} 