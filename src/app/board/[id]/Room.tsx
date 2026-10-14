'use client'

import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { LiveMap } from "@liveblocks/client"; // ◄ 1. Make sure to import LiveMap here!

export function Room({ id, children }: { id: string; children: ReactNode }) {
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!;

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      {/* 🎯 2. ADD initialStorage HERE: This tells the cloud server to create a fully active 
          LiveMap object instantly the exact millisecond a room boots up! */}
      <RoomProvider 
        id={id} 
        initialPresence={{ cursor: null }}
        initialStorage={{
          records: new LiveMap()
        }}
      >
        <ClientSideSuspense fallback={<div>Loading canvas multiplayer...</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
