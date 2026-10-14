import { supabase } from '@/services/supabase'
import { NextResponse } from 'next/server'

// This endpoint runs a lightweight database ping to prevent automatic pausing
export async function GET() {
  const { data, error } = await supabase.from('boards').select('id').limit(1)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: "Database tickled successfully! 💓" })
}
