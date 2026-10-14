import { supabase } from './supabase'

// 🆕 DATABASE INITIALIZER COURIER
export async function createNewBoardInDatabase(boardName: string) {
  // 1. Ask Supabase Auth who is currently clicking this button
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('boards')
    .insert([
      { 
        name: boardName || 'Untitled Board', 
        document: [],
        user_id: user?.id // 🎯 LOCKS THIS ROW TO THIS SPECIFIC AUTHENTICATED USER ACCOUNT ID!
      }
    ])
    .select('id') 
    .single()
    
  if(error){
    console.warn(`[BoardService] Fetch failed internally: ${error.message}`)
  }

  return { data, error }
}


export async function getAllBoardsFromDatabase() {
  const { data, error } = await supabase
    .from('boards')
    .select('*') // Fetch all columns for all rows

  if (error) {
    console.warn(`[BoardService] Fetch failed internally: ${error.message}`)
  }

  return { data, error }
}

/**
 * Saves the current state of a whiteboard to the PostgreSQL database.
 * @param boardId The unique UUID of the whiteboard room
 * @param canvasData The raw JSON object representing the shapes on the screen
 */
export async function saveBoardToDatabase(boardId: string, snapshot: Record<string, unknown>) {
  // 1. Grab the active logged-in user's token directly from the supabase client
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.warn("[BoardService] Cannot save board: No authenticated user found.")
    return { data: null, error: new Error("Unauthenticated") }
  }

  // 2. Pass the user_id alongside your snapshot so the ALL policy approves it
  const { data, error } = await supabase
    .from('boards')
    .upsert([
      { 
        id: boardId, 
        document: snapshot,
        user_id: user.id // 🎯 This guarantees your RLS policy validates successfully!
      },
    ]) 

  if (error) {
    console.warn(`[BoardService] Save failed internally: ${error.message}`)
  }
  
  return { data, error }
}


export async function loadLastSavedBoardFromDatabase(boardId: string) {
  const { data, error } = await supabase
    .from('boards')
    .select('document')
    .eq('id', boardId) // Filter by the provided boardId
    .single()

  if (error) {
    console.warn(`[BoardService] Fetch failed internally: ${error.message}`)
  }

  return { data, error }
}
