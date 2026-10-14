import Canvas from '@/components/Canvas'
import { Room } from './Room'
import { use } from 'react' // ◄ 1. Import the React utility unwrapper

interface PageProps {
  params: Promise<{ id: string }> | { id: string } // ◄ 2. Accept both types to be 100% safe
}

export default function BoardPage({ params }: PageProps) {
  // ◄ 3. Safely unwrap the params object. 
  // If it's a promise, React awaits it. If it's a normal object, it reads it instantly.
  const resolvedParams = params instanceof Promise ? use(params) : params
  const boardId = resolvedParams?.id

  return (
    <main>
      {/* 4. Pass the verified string down safely */}
      <Room id={boardId}>
        <Canvas boardId={boardId} />
      </Room>
    </main>
  )
}
