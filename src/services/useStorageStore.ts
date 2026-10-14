import { useEffect, useState } from 'react'
import { createTLStore, defaultShapeUtils, TLRecord } from 'tldraw'
import { useRoom, JsonObject } from '@liveblocks/react'
import { LiveMap } from '@liveblocks/client'

export function useStorageStore() {
  const room = useRoom()

  const [store] = useState(() => {
    return createTLStore({ shapeUtils: defaultShapeUtils })
  })

  useEffect(() => {
    if (!room) return

    let unsubscribeStorage = () => {}
    let disposeListen = () => {}

    room.getStorage().then((storageBundle) => {
      const root = storageBundle.root
      const records = root.get('records') as unknown as LiveMap<string, JsonObject>
      if (!records) return

      // 🎯 THE CRITICAL SENIOR SYNC GUARD:
      // If the Liveblocks cloud room is completely brand-new and empty, 
      // but our local store already has drawings loaded from the Supabase pickup truck,
      // push our local drawings up to the cloud instantly to seed the room!
      if (records.size === 0 && store.allRecords().length > 0) {
        store.allRecords().forEach((record) => {
          if (record.id.startsWith('shape:')) {
            records.set(record.id, record as unknown as JsonObject)
          }
        })
      }

      // 🚚 OUTGOING DATA VALVE: Sends your drawings to the cloud
      disposeListen = store.listen((update) => {
        if (update.source !== 'user') return

        Object.entries(update.changes.added).forEach(([id, record]) => {
          records.set(id, record as unknown as JsonObject)
        })
        Object.entries(update.changes.updated).forEach(([id, [_, record]]) => {
          records.set(id, record as unknown as JsonObject)
        })
        Object.keys(update.changes.removed).forEach((id) => {
          records.delete(id)
        })
      }, { scope: 'document' })

      // 🔄 INCOMING DATA VALVE: Listens deeply to other users' additions
      unsubscribeStorage = room.subscribe(
        root,
        () => {
          const liveRecords = root.get('records')
          if (!liveRecords) return

          store.mergeRemoteChanges(() => {
            const remoteRecords = Array.from((liveRecords).values()) as unknown as TLRecord[]
            
            // Clean up deleted items locally
            const currentIds = new Set(remoteRecords.map((r) => r.id))
            Array.from(store.allRecords())
              .filter((r) => r.id.startsWith('shape:') && !currentIds.has(r.id))
              .forEach((r) => store.remove([r.id]))

            store.put(remoteRecords)
          })
        },
        { isDeep: true }
      )
    })

    return () => {
      disposeListen()
      unsubscribeStorage()
    }
  }, [room, store])

  return store
}
