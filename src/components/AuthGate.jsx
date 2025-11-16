import { useEffect } from 'react'
import { watchAuth } from '../lib/firebase'
import { useApp } from '../store'

export default function AuthGate({ children }) {
  const setUser = useApp(s => s.setUser)
  useEffect(() => {
    const unsub = watchAuth(u => setUser(u))
    return () => unsub && unsub()
  }, [setUser])
  const user = useApp(s => s.user)
  if (!user) return <div className="max-w-5xl mx-auto p-6">Please sign in to continue.</div>
  return children
}
