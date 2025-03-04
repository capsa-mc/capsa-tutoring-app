import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CookieOptions } from '@supabase/ssr'
import { Role } from '@/types/database/schema'
import { getLowerRoles, isRoleHigher } from '@/lib/roles'

// GET endpoint to fetch all role applications
export async function GET(request: Request) {
  const cookieStore = await cookies()
  const response = new NextResponse()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    // First check if we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user has appropriate role
    if (profile.role !== 'Admin' && profile.role !== 'Staff' && profile.role !== 'Coordinator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get URL parameters for filtering
    const url = new URL(request.url)
    const nameFilter = url.searchParams.get('name') || ''
    const groupFilter = url.searchParams.get('group') || ''

    // Get lower roles that this user can approve
    const lowerRoles = getLowerRoles(profile.role as Role)

    // Fetch all profiles with pending role applications
    let query = supabase
      .from('profiles')
      .select('*')
      .not('apply_role', 'is', null)
      // Only show applications for roles lower than the current user's role
      .in('apply_role', lowerRoles)

    // Apply filters if provided
    if (nameFilter) {
      query = query.or(`first_name.ilike.%${nameFilter}%,last_name.ilike.%${nameFilter}%`)
    }
    
    if (groupFilter) {
      query = query.eq('group', groupFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

// POST endpoint to approve a role application
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const response = new NextResponse()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    // First check if we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user has appropriate role
    if (profile.role !== 'Admin' && profile.role !== 'Staff' && profile.role !== 'Coordinator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    if (!body.userId || !body.approvedRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the application to check if the user can approve it
    const { data: application, error: applicationError } = await supabase
      .from('profiles')
      .select('apply_role')
      .eq('id', body.userId)
      .single()

    if (applicationError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Check if the user can approve this role (must be higher than the requested role)
    if (!isRoleHigher(profile.role as Role, application.apply_role as Role)) {
      return NextResponse.json({ error: 'You cannot approve a role equal to or higher than your own' }, { status: 403 })
    }

    // Update the user's role and clear the apply_role field
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: body.approvedRole as Role,
        apply_role: null
      })
      .eq('id', body.userId)
      .select()
      .single()

    if (error) {
      console.error('Error approving application:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
} 