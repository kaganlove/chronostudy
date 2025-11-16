import { signIn, signOutUser } from '../lib/firebase'
import { useApp } from '../store'

export default function Navbar() {
  const user = useApp(s => s.user)
  return (
    <div className="w-full border-b bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">ChronoStudy</div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.photoURL && <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />}
              <button className="btn" onClick={signOutUser}>Sign out</button>
            </>
          ) : (
            <button className="btn" onClick={signIn}>Sign in with Google</button>
          )}
        </div>
      </div>
    </div>
  )
}
