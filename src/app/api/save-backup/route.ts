import { supabase } from '@/services/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // 💡 Read the data as text instead of JSON to handle sendBeacon formats smoothly
    const textData = await req.text()
    const { boardId, snapshot } = JSON.parse(textData)
    
    await supabase.from('boards').upsert({ id: boardId, document: snapshot })
    
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
