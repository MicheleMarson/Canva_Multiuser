'use client'

import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createNewBoardInDatabase, getAllBoardsFromDatabase } from '@/services/boardService' // Import our new server tool
import { supabase } from '@/services/supabase'

interface Board {
  id: string
  [key: string]: string | number | boolean | null
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<null | User>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [allBoards, setAllBoards] = useState<Board[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [showPopup, setShowPopup] = useState(false) // State to control the popup visibility
  const [boardName, setBoardName] = useState('') // State for the new board name

  useEffect(() => {
    // Fetch all boards when the component mounts
    const fetchBoards = async () => {
      const { data, error } = await getAllBoardsFromDatabase()
      if (!error) {
        setAllBoards(data!)
      }
    }
    fetchBoards()
  }, [user]) // Re-fetch boards whenever the user changes

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

    // 2. Handle User Sign Up
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase.auth.signUp({ email, password })
    console.log("D", data)
    if (error) alert(`Sign up failed: ${error.message}`)
    else alert('Check your email for a validation confirmation link!')
  }

  // 3. Handle User Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(`Login failed: ${error.message}`)
  }

    // 4. Handle Logout
  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  // 5. Handle Creating a Board tied to the user's specific account ID
  async function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!boardName.trim()) return
    setIsCreating(true)

    // Call our service to generate the row
    const { data, error } = await createNewBoardInDatabase(boardName)

    if (error) {
      alert(`Failed to create: ${error.message}`)
      setIsCreating(false)
    } else {
      router.push(`/board/${data!.id}`)
    }
  }

  if (authLoading) return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>Securing authorization pipelines...</div>

    // 🚪 SCREEN A: Show Login / Registration if the visitor is an anonymous guest
  if (!user) {
    return (
      <div style={{ padding: '60px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Secure Workspaces login</h1>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="email" placeholder="Your Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} />
          <input type="password" placeholder="Your Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={handleLogin} style={{ flex: 1, padding: '12px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Log In</button>
            <button type="button" onClick={handleSignUp} style={{ flex: 1, padding: '12px', backgroundColor: '#e2e8f0', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Sign Up</button>
          </div>
        </form>
      </div>
    )
  }
  
  return (
    <div style={{ padding: '60px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>Your Portfolio Workspaces 🚀</h1>
       <button onClick={handleLogout} style={{ flex: 1, padding: '12px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      <p style={{ color: '#666', marginBottom: '30px' }}>Create an architecture layout and watch data streams match live.</p>
      {allBoards ?  (
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '30px' }}>
          {allBoards.map((board) => (
            <li key={board.id} style={{ marginBottom: '10px' }}>
              <a href={`/board/${board.id}`} style={{ color: '#0070f3', textDecoration: 'underline' }}>
                {board.name || `Board ${board.id}`}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <button 
        onClick={() => setShowPopup(true)}
        disabled={isCreating}
        style={{ 
          padding: '15px 30px', 
          fontSize: '18px', 
          backgroundColor: isCreating ? '#ccc' : '#0070f3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: isCreating ? 'not-allowed' : 'pointer', 
          fontWeight: 'bold' 
        }}
      >
        {isCreating ? 'Initializing Board in Cloud...' : '+ Create New Multiplayer Board'}
      </button>

       {/* 🌟 THE POPUP MODAL ACCORDION WINDOW 🌟 */}
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darkens the canvas behind the popup
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          color: 'black'
        }}>
          <form 
            onSubmit={handleSubmitCreate}
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              width: '400px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '20px' }}>Name your new workspace</h3>
            
            <input 
              type="text" 
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              disabled={isCreating}
              autoFocus
              style={{
                padding: '12px',
                fontSize: '16px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              {/* Cancel Button */}
              <button 
                type="button"
                onClick={() => { setShowPopup(false); setBoardName(''); }}
                disabled={isCreating}
                style={{ padding: '10px 15px', backgroundColor: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              
              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isCreating}
                style={{ 
                  padding: '10px 15px', 
                  backgroundColor: isCreating ? '#ccc' : '#0070f3', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold' 
                }}
              >
                {isCreating ? 'Creating...' : 'Create Board'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
