import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Missing auth' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Verify the user's token first using anon client
  const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await anonClient.auth.getUser(token)

  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  // Use service role to delete the actual auth user
  const adminClient = createClient(supabaseUrl, serviceKey)
  const { error } = await adminClient.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
