import { NextResponse } from 'next/server'
import { Role } from '@/types/database/schema'
import { verifyUserAccess, createErrorResponse } from '@/lib/server-supabase'

export async function GET(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess([Role.Admin, Role.Staff, Role.Coordinator])
    if (!auth.success) {
      return createErrorResponse(auth.error, auth.status)
    }
    
    const { supabase } = auth
    
    // Get URL parameters for filtering
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    
    // Build query
    let query = supabase
      .from('sessions')
      .select('*')
      .order('date', { ascending: true })
    
    // Apply filters if provided
    if (type) {
      query = query.eq('type', type)
    }
    
    if (startDate) {
      query = query.gte('date', startDate)
    }
    
    if (endDate) {
      query = query.lte('date', endDate)
    }
    
    // Execute query
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const { supabase } = auth
    
    // Get session data from request
    const sessionData = await request.json()
    
    // Insert new session
    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in POST /api/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const { supabase } = auth
    
    // Get session ID from URL
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }
    
    // Delete the session
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const { supabase } = auth
    
    // Get session data and ID from request
    const sessionData = await request.json()
    const { id, ...updateData } = sessionData
    
    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }
    
    // Update the session
    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PATCH /api/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 