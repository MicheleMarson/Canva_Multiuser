'use client'

import { Tldraw, getSnapshot, loadSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'
import { useStorageStore } from '../services/useStorageStore'
import { useState, useEffect, useRef } from 'react'
import { saveBoardToDatabase, loadLastSavedBoardFromDatabase } from '@/services/boardService'
import { useMyPresence, useOthers } from '@liveblocks/react'

export default function Canvas({boardId}: {boardId: string}) {
  const store = useStorageStore()

  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'unsaved' | 'saving'>('idle')
  
  // 📦 THE PRE-PACKED SCRATCHPAD
  // A useRef acts like a sticky note that stays alive across frames without causing UI re-renders.
  // We will keep our latest canvas snapshot pre-packaged inside it at all times.
  const latestSnapshotRef = useRef<ReturnType<typeof getSnapshot> | null>(null)

  // 🔄 Load past entries on page boot
  useEffect(() => {
    async function initBoard() {
      if (!store) return
      const { data, error } = await loadLastSavedBoardFromDatabase(boardId)
      if (error) {
        console.warn('New workspace, starting clean.')
      } else if (data && data.document) {
        const isDocumentEmpty = Array.isArray(data.document) && data.document.length === 0;
        if (!isDocumentEmpty) {
          loadSnapshot(store, data.document)
          latestSnapshotRef.current = data.document // Initialize scratchpad
        }
      }
      setIsLoading(false)
    }
    initBoard()
  }, [store, boardId])

  // ⏱️ THE IMMUTABLE PRE-PACK & BACKING BEACON LOOP
  useEffect(() => {
    if (!store || isLoading) return

    const disposeListen = store.listen(() => {
      setSyncStatus('unsaved')
      // 🔥 PRE-PACK THE DATA IMMEDIATELY ON CHANGE:
      // We take the microsecond snapshot calculation penalty while the user is still active on the page,
      // saving the text payload right inside our active useRef sticky note.
      latestSnapshotRef.current = getSnapshot(store)
    }, { source: 'user', scope: 'document' })

    // 🚀 THE NATIVE BEACON GATE
    // Runs instantly on tab close. Because the snapshot calculation is already finished, 
    // it executes instantly in less than 0.5 milliseconds.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && syncStatus === 'unsaved' && latestSnapshotRef.current) {
        const payload = JSON.stringify({ boardId, snapshot: latestSnapshotRef.current })
        
        // sendBeacon is a built-in browser API optimized strictly for emergency data closures.
        // It bypasses the framework layer entirely and schedules a reliable background cloud upload.
        navigator.sendBeacon('/api/save-backup', payload)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Standard 2-second debounce timer for active layout sessions
    const saveTimer = setTimeout(async () => {
      if (syncStatus !== 'unsaved') return
      setSyncStatus('saving') 
      const snapshot = getSnapshot(store)
      const { error } = await saveBoardToDatabase(boardId, snapshot as unknown as Record<string, unknown>)
      if (!error) setSyncStatus('idle')
    }, 2000) 

    return () => {
      disposeListen()
      clearTimeout(saveTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [store, boardId, isLoading, syncStatus])

  if (isLoading) {
    return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loading workspace...</div>
  }

  return (
    <div 
      style={{ position: 'fixed', inset: 0 }}
      // 🖱️ CATCH MOUSE EVENTS HERE:
      onPointerMove={(e) => {
        // Broadcast your local cursor X and Y coordinates to everyone else in the room lobby!
        updateMyPresence({
          cursor: { x: Math.round(e.clientX), y: Math.round(e.clientY) }
        });
      }}
      // When your mouse leaves the window entirely, set it to null so your pointer disappears for others
      onPointerLeave={() => updateMyPresence({ cursor: null })}
    >
      {/* Visual Sync Badge Panel */}
      <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, padding: '6px 12px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'sans-serif', fontSize: '12px', color: '#475569', pointerEvents: 'none', opacity: syncStatus === 'idle' ? 0 : 1, transform: syncStatus === 'idle' ? 'translateY(-5px)' : 'translateY(0)', transition: 'all 0.3s ease-in-out' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: syncStatus === 'saving' ? '#3b82f6' : '#f59e0b', display: 'inline-block', animation: syncStatus === 'saving' ? 'pulse 1s infinite' : 'none' }}></span>
        {syncStatus === 'unsaved' && 'Unsaved edits...'}
        {syncStatus === 'saving' && 'Saving updates...'}
      </div>
      <style>{`@keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }`}</style>
      {others.map(({ connectionId, presence }) => {
        // If the other user's mouse isn't on the screen, skip drawing it
        if (!presence?.cursor) return null;

        return (
          <div
            key={connectionId}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              // Move the cursor box exactly to the coordinates sent by the other user's browser!
              transform: `translate(${presence.cursor.x}px, ${presence.cursor.y}px)`,
              pointerEvents: 'none',
              zIndex: 9999, // Make sure it floats on top of the drawing canvas
              transition: 'transform 0.08s linear' // Adds a tiny bit of smoothness to the movements
            }}
          >
            {/* 📍 The Visual Cursor Icon (A basic SVG arrow or circle) */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5.65376 12.3963L15.974 3.01421C16.5925 2.45197 17.5 2.89069 17.5 3.7317L17.5 20.2683C17.5 21.1093 16.5925 21.548 15.974 20.9858L5.65376 11.6037C5.40561 11.3781 5.40561 10.9878 5.65376 10.7622Z" fill="#ff007f"/>
            </svg>
            
            {/* 🏷️ User Label Tag */}
            <span style={{ marginLeft: '12px', padding: '2px 6px', backgroundColor: '#ff007f', color: 'white', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
              Guest {connectionId}
            </span>
          </div>
        );
      })}

      <Tldraw store={store} autoFocus />
    </div>
  )
}
