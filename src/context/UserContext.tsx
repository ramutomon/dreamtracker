import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react'
import { differenceInYears } from 'date-fns'
import type { User } from '@supabase/supabase-js'
import { supabase, type ProfileRow } from '../lib/supabase'
import {
  calcDefaultLifeExpectancy,
  type Gender,
  type ExerciseLevel,
  type HealthStatus,
} from '../utils/lifeExpectancy'

export type { Gender, ExerciseLevel, HealthStatus }
export { calcDefaultLifeExpectancy }

export type UserProfile = {
  nickname:              string
  birthDate:             string        // YYYY-MM-DD
  gender:                Gender
  smoking:               boolean
  exerciseLevel:         ExerciseLevel
  healthStatus:          HealthStatus
  healthyLifeExpectancy: number
  totalLifeExpectancy:   number
}

const DEFAULT_PROFILE: UserProfile = {
  nickname:              '',
  birthDate:             '',
  gender:                'male',
  smoking:               false,
  exerciseLevel:         'occasional',
  healthStatus:          'normal',
  healthyLifeExpectancy: 73,
  totalLifeExpectancy:   81,
}

type UserContextValue = {
  user:              User | null
  profile:           UserProfile
  age:               number
  birthYear:         number
  isFirstVisit:      boolean
  loading:           boolean
  updateProfile:     (p: UserProfile) => Promise<void>
  openProfileModal:  () => void
  closeProfileModal: () => void
  profileModalOpen:  boolean
  signInWithGoogle:  () => Promise<void>
  signOut:           () => Promise<void>
}

const UserContext = createContext<UserContextValue | null>(null)

function calcAge(birthDate: string): number {
  if (!birthDate) return 0
  return differenceInYears(new Date(), new Date(birthDate))
}

function rowToProfile(row: ProfileRow): UserProfile {
  return {
    nickname:              row.nickname,
    birthDate:             row.birth_date,
    gender:                row.gender as Gender,
    smoking:               row.smoking,
    exerciseLevel:         row.exercise_level as ExerciseLevel,
    healthStatus:          row.health_status as HealthStatus,
    healthyLifeExpectancy: row.healthy_life_expectancy,
    totalLifeExpectancy:   row.total_life_expectancy,
  }
}

function profileToRow(userId: string, p: UserProfile): ProfileRow {
  return {
    id:                      userId,
    nickname:                p.nickname,
    birth_date:              p.birthDate,
    gender:                  p.gender,
    smoking:                 p.smoking,
    exercise_level:          p.exerciseLevel,
    health_status:           p.healthStatus,
    healthy_life_expectancy: p.healthyLifeExpectancy,
    total_life_expectancy:   p.totalLifeExpectancy,
    updated_at:              new Date().toISOString(),
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                         = useState<User | null>(null)
  const [profile, setProfile]                   = useState<UserProfile>(DEFAULT_PROFILE)
  const [isFirstVisit, setIsFirstVisit]         = useState(false)
  const [loading, setLoading]                   = useState(true)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  async function fetchAndSetProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      setProfile(DEFAULT_PROFILE)
      setIsFirstVisit(true)
      setProfileModalOpen(true)
    } else {
      setProfile(rowToProfile(data as ProfileRow))
      setIsFirstVisit(false)
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          await fetchAndSetProfile(u.id)
        } else {
          setProfile(DEFAULT_PROFILE)
          setIsFirstVisit(false)
          setProfileModalOpen(false)
        }
        setLoading(false)
      },
    )
    return () => subscription.unsubscribe()
  }, [])

  const updateProfile = useCallback(async (newProfile: UserProfile) => {
    if (!user) return
    setProfile(newProfile)
    setIsFirstVisit(false)
    const { error } = await supabase
      .from('profiles')
      .upsert(profileToRow(user.id, newProfile))
    if (error) console.error('profile save failed:', error.message)
  }, [user])

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: window.location.origin },
    })
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const openProfileModal  = useCallback(() => setProfileModalOpen(true), [])
  const closeProfileModal = useCallback(() => {
    if (!isFirstVisit) setProfileModalOpen(false)
  }, [isFirstVisit])

  const age      = calcAge(profile.birthDate)
  const birthYear = profile.birthDate ? new Date(profile.birthDate).getFullYear() : 0

  return (
    <UserContext.Provider value={{
      user, profile, age, birthYear, isFirstVisit, loading,
      updateProfile, openProfileModal, closeProfileModal, profileModalOpen,
      signInWithGoogle, signOut,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
