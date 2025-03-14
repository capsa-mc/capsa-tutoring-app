import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const sslJsonPath = path.join(process.cwd(), 'local', 'ssl.json')
    const sslPdfPath = path.join(process.cwd(), 'local', 'ssl.pdf')

    const exists = fs.existsSync(sslJsonPath) && fs.existsSync(sslPdfPath)

    return NextResponse.json({ exists })
  } catch (error) {
    console.error('Error checking SSL files:', error)
    return NextResponse.json({ exists: false }, { status: 500 })
  }
} 