import { Outlet } from 'react-router-dom'
import { Settings, LogOut } from 'lucide-react'
import { useUser } from '../context/UserContext'
import ProfileModal from './ProfileModal'

export default function Layout() {
  const { profile, openProfileModal, profileModalOpen, signOut } = useUser()

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col">

      {/* Top right actions */}
      <div className="fixed top-0 right-0 flex items-center gap-1 px-2 py-2 z-50">
        <button
          onClick={openProfileModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/8 transition-all"
        >
          <Settings size={15} />
          <span className="hidden sm:inline text-white/50 font-medium">{profile.nickname || '設定'}</span>
        </button>
        <button
          onClick={signOut}
          className="flex items-center px-2 py-1.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/8 transition-all"
          aria-label="ログアウト"
        >
          <LogOut size={15} />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {profileModalOpen && <ProfileModal />}
    </div>
  )
}
