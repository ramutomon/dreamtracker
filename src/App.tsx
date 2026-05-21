import { Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext'
import { BucketListProvider } from './context/BucketListContext'
import { ActivityPhasesProvider } from './context/ActivityPhasesContext'
import Layout from './components/Layout'
import BucketList from './pages/BucketList'
import Login from './pages/Login'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold">
          <span className="text-brand-orange">Dream</span>
          <span className="text-white">Tracker</span>
        </h1>
        <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )
}

function AppRouter() {
  const { user, loading } = useUser()

  if (loading) return <LoadingScreen />
  if (!user)   return <Login />

  return (
    <ActivityPhasesProvider>
    <BucketListProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<BucketList />} />
          <Route path="dashboard"   element={<Navigate to="/" replace />} />
          <Route path="bucket-list" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BucketListProvider>
    </ActivityPhasesProvider>
  )
}

export default function App() {
  return (
    <UserProvider>
      <AppRouter />
    </UserProvider>
  )
}
