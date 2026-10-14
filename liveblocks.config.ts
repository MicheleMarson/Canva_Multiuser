// Define Liveblocks types for your application

import { LiveMap, JsonObject } from "@liveblocks/client";

// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
    };

    Storage: {
      records: LiveMap<string, JsonObject>; // ◄ Name this "records" to match the official spec!
    };
  }
}

export {};
