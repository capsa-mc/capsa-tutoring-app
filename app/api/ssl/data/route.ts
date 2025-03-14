import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const sslJsonPath = path.join(process.cwd(), 'local', 'ssl.json')
    const sslData = JSON.parse(fs.readFileSync(sslJsonPath, 'utf-8'))
    return NextResponse.json(sslData)
  } catch (error) {
    console.error('Error reading SSL data:', error)
    return NextResponse.json({ error: 'Failed to read SSL data' }, { status: 500 })
  }
} 