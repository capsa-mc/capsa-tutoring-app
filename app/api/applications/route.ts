import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CookieOptions } from '@supabase/ssr'
import { Role } from '@/types/database/schema'

// Helper function to create a Supabase server client
const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
}

// Helper function to verify user access
const verifyUserAccess = async () => {
  const supabase = await createServerSupabaseClient()
  
  // Use getUser instead of getSession for better security
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return {
      success: false,
      error: 'Unauthorized',
      status: 401
    }
  }
  
  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) {
    return {
      success: false,
      error: 'Profile not found',
      status: 404
    }
  }
  
  // Check if user has admin, staff, or coordinator role
  const allowedRoles = [Role.Admin, Role.Staff, Role.Coordinator]
  if (!allowedRoles.includes(profile.role as Role)) {
    return {
      success: false,
      error: 'Insufficient permissions',
      status: 403
    }
  }
  
  return {
    success: true,
    user,
    profile
  }
}

// GET endpoint to fetch all role applications
export async function GET(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get URL parameters for filtering
    const url = new URL(request.url)
    const name = url.searchParams.get('name')
    const group = url.searchParams.get('group')
    
    // Start building the query
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, student_email, apply_role, role')
      .not('apply_role', 'is', null)
    
    // Add filters if provided
    if (name) {
      const searchTerm = `%${name}%`
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
    }
    
    if (group) {
      query = query.eq('apply_role', group)
    }
    
    // Filter based on user role - auth.profile is guaranteed to exist here because of the verifyUserAccess check
    const userRole = auth.profile?.role as Role
    if (userRole === Role.Admin) {
      // Admin can see all applications
    } else if (userRole === Role.Staff) {
      // Staff can see applications for Tutor and Tutee
      query = query.in('apply_role', [Role.Tutor, Role.Tutee])
    } else if (userRole === Role.Coordinator) {
      // Coordinator can see applications for both Tutor and Tutee
      query = query.in('apply_role', [Role.Tutor, Role.Tutee])
    }
    
    // Execute the query
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }
    
    return NextResponse.json({ applications: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

// POST endpoint to approve or reject a role application
export async function POST(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
    // Validate request body
    const { userId, role, action } = body
    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Validate action
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    // For approve action, role is required
    if (action === 'approve' && !role) {
      return NextResponse.json({ error: 'Role is required for approval' }, { status: 400 })
    }
    
    // Get the application
    const { data: application, error: applicationError } = await supabase
      .from('profiles')
      .select('apply_role, role')
      .eq('id', userId)
      .single()
    
    if (applicationError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    
    // For approve action, check if the requested role matches the applied role
    if (action === 'approve' && application.apply_role !== role) {
      return NextResponse.json({ error: 'Role mismatch' }, { status: 400 })
    }
    
    // Check if the current user can approve/reject this role
    const canApprove = (approverRole: Role, requestedRole: Role) => {
      if (approverRole === Role.Admin) return true
      if (approverRole === Role.Staff && [Role.Tutor, Role.Tutee].includes(requestedRole as Role)) return true
      if (approverRole === Role.Coordinator && [Role.Tutor, Role.Tutee].includes(requestedRole as Role)) return true
      return false
    }
    
    // auth.profile is guaranteed to exist here because of the verifyUserAccess check
    const userRole = auth.profile?.role as Role
    if (!canApprove(userRole, application.apply_role as Role)) {
      return NextResponse.json({ error: 'Insufficient permissions to manage this application' }, { status: 403 })
    }
    
    let updateData = {}
    
    if (action === 'approve') {
      // For approve: Update the user's role and clear apply_role
      updateData = { role: role, apply_role: null }
    } else {
      // For reject: Just clear the apply_role field
      updateData = { apply_role: null }
    }
    
    // Update the profile
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()
    
    if (updateError) {
      console.error(`Error ${action === 'approve' ? 'approving' : 'rejecting'} application:`, updateError)
      return NextResponse.json({ error: `Failed to ${action} application` }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      profile: data,
      action: action
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
} 