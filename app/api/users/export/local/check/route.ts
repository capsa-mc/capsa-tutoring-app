import { NextResponse } from 'next/server'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET() {
  try {
    const localDir = join(process.cwd(), 'local')
    const sslPdfPath = join(localDir, 'ssl.pdf')
    const sslJsonPath = join(localDir, 'ssl.json')
    
    const exists = existsSync(sslPdfPath) && existsSync(sslJsonPath)
    
    return NextResponse.json({ exists })
  } catch (error) {
    console.error('Error checking SSL files:', error)
    return NextResponse.json({ error: 'Failed to check SSL files' }, { status: 500 })
  }
} 