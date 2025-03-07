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

// GET endpoint to fetch pairs, tutors, and tutees
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
    const type = url.searchParams.get('type') // 'tutors', 'tutees', or 'pairs'
    
    if (type === 'tutors') {
      // Fetch tutors
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, student_email, group, role')
        .eq('role', Role.Tutor)
      
      // Add filters if provided
      if (name) {
        const searchTerm = `%${name}%`
        query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
      }
      
      if (group) {
        query = query.eq('group', group)
      }
      
      // Execute the query
      const { data: tutors, error: tutorsError } = await query
      
      if (tutorsError) {
        console.error('Error fetching tutors:', tutorsError)
        return NextResponse.json({ error: 'Failed to fetch tutors' }, { status: 500 })
      }
      
      // Get pairs to determine which tutors already have tutees
      const { data: pairs, error: pairsError } = await supabase
        .from('pairs')
        .select('tutor_id, tutee_id')
      
      if (pairsError) {
        console.error('Error fetching pairs:', pairsError)
        return NextResponse.json({ error: 'Failed to fetch pairs' }, { status: 500 })
      }
      
      // Add tutee count to each tutor
      const tutorsWithTuteeCount = tutors.map(tutor => {
        const tuteeCount = pairs.filter(pair => pair.tutor_id === tutor.id).length
        return {
          ...tutor,
          tutee_count: tuteeCount
        }
      });
      
      // Sort tutors by tutee count (ascending)
      tutorsWithTuteeCount.sort((a, b) => a.tutee_count - b.tutee_count);
      
      return NextResponse.json({ tutors: tutorsWithTuteeCount })
    } else if (type === 'tutees') {
      // Fetch tutees
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, student_email, group, role')
        .eq('role', Role.Tutee)
      
      // Add filters if provided
      if (name) {
        const searchTerm = `%${name}%`
        query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
      }
      
      if (group) {
        query = query.eq('group', group)
      }
      
      // Execute the query
      const { data: tutees, error: tuteesError } = await query
      
      if (tuteesError) {
        console.error('Error fetching tutees:', tuteesError)
        return NextResponse.json({ error: 'Failed to fetch tutees' }, { status: 500 })
      }
      
      // Get pairs to determine which tutees are already paired
      const { data: pairs, error: pairsError } = await supabase
        .from('pairs')
        .select('tutor_id, tutee_id')
      
      if (pairsError) {
        console.error('Error fetching pairs:', pairsError)
        return NextResponse.json({ error: 'Failed to fetch pairs' }, { status: 500 })
      }
      
      // Get all tutor IDs from pairs
      const tutorIds = [...new Set(pairs.map(pair => pair.tutor_id))].filter(Boolean);
      
      // Fetch all tutors info in one query
      let tutorsInfo: Record<string, { id: string, name: string }> = {};
      if (tutorIds.length > 0) {
        const { data: tutorsData, error: tutorsError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', tutorIds);
        
        if (tutorsError) {
          console.error('Error fetching tutors info:', tutorsError);
        } else if (tutorsData) {
          // Create a map of tutor ID to tutor info
          tutorsInfo = tutorsData.reduce((acc, tutor) => {
            acc[tutor.id] = {
              id: tutor.id,
              name: `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim()
            };
            return acc;
          }, {} as Record<string, { id: string, name: string }>);
        }
      }
      
      // Add a flag to indicate if tutee is already paired and with which tutor
      const tuteesWithPairInfo = tutees.map(tutee => {
        const existingPair = pairs.find(pair => pair.tutee_id === tutee.id);
        const tutorId = existingPair ? existingPair.tutor_id : null;
        
        return {
          ...tutee,
          is_paired: !!existingPair,
          tutor_id: tutorId,
          paired_tutor: tutorId && tutorsInfo[tutorId] ? tutorsInfo[tutorId] : null
        };
      });
      
      // Sort tutees - unpaired first, then paired
      tuteesWithPairInfo.sort((a, b) => {
        if (a.is_paired === b.is_paired) return 0;
        return a.is_paired ? 1 : -1;
      });
      
      return NextResponse.json({ tutees: tuteesWithPairInfo })
    } else {
      // Fetch pairs with tutor and tutee information
      // Using a different approach since the foreign key relationships aren't properly set up
      const { data: pairs, error: pairsError } = await supabase
        .from('pairs')
        .select('id, tutor_id, tutee_id')
      
      if (pairsError) {
        console.error('Error fetching pairs:', pairsError)
        return NextResponse.json({ error: 'Failed to fetch pairs' }, { status: 500 })
      }
      
      // If no pairs found, return empty array
      if (!pairs || pairs.length === 0) {
        return NextResponse.json({ pairs: [] })
      }
      
      // Get all tutor and tutee IDs
      const tutorIds = pairs.map(pair => pair.tutor_id).filter(Boolean)
      const tuteeIds = pairs.map(pair => pair.tutee_id).filter(Boolean)
      
      // Fetch tutors
      const { data: tutors, error: tutorsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, student_email, group')
        .in('id', tutorIds)
      
      if (tutorsError) {
        console.error('Error fetching tutors:', tutorsError)
        return NextResponse.json({ error: 'Failed to fetch tutors' }, { status: 500 })
      }
      
      // Fetch tutees
      const { data: tutees, error: tuteesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, student_email, group')
        .in('id', tuteeIds)
      
      if (tuteesError) {
        console.error('Error fetching tutees:', tuteesError)
        return NextResponse.json({ error: 'Failed to fetch tutees' }, { status: 500 })
      }
      
      // Map tutors and tutees to pairs
      const pairsWithProfiles = pairs.map(pair => {
        const tutor = tutors.find(t => t.id === pair.tutor_id) || null
        const tutee = tutees.find(t => t.id === pair.tutee_id) || null
        
        return {
          id: pair.id,
          tutor,
          tutee
        }
      }).filter(pair => pair.tutor && pair.tutee) // Only include pairs with both tutor and tutee
      
      console.log('API - Returning pairs:', pairsWithProfiles);
      return NextResponse.json({ pairs: pairsWithProfiles })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

// POST endpoint to create a new pair
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
    const { tutorId, tuteeIds } = body
    if (!tutorId || !tuteeIds || !Array.isArray(tuteeIds) || tuteeIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Create pairs for each tutee
    const pairsToInsert = tuteeIds.map(tuteeId => ({
      tutor_id: tutorId,
      tutee_id: tuteeId
    }));
    
    const { data, error } = await supabase
      .from('pairs')
      .insert(pairsToInsert)
      .select()
    
    if (error) {
      console.error('Error creating pairs:', error)
      return NextResponse.json({ error: 'Failed to create pairs' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, pairs: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

// DELETE endpoint to remove a pair
export async function DELETE(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get pair ID from URL
    const url = new URL(request.url)
    const pairId = url.searchParams.get('id')
    
    if (!pairId) {
      return NextResponse.json({ error: 'Missing pair ID' }, { status: 400 })
    }
    
    // Delete the pair
    const { error } = await supabase
      .from('pairs')
      .delete()
      .eq('id', pairId)
    
    if (error) {
      console.error('Error deleting pair:', error)
      return NextResponse.json({ error: 'Failed to delete pair' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
} 