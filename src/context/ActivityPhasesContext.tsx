import { createContext, useContext, useState, type ReactNode } from 'react'
import { ACTIVITY_PHASES, type ActivityPhase } from '../data/timeline'

const STORAGE_KEY = 'dt_activity_phases'

function loadPhases(): ActivityPhase[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return ACTIVITY_PHASES
}

type Ctx = {
  phases:      ActivityPhase[]
  addPhase:    (p: Omit<ActivityPhase, 'id'>) => void
  updatePhase: (id: string, data: Partial<ActivityPhase>) => void
  deletePhase: (id: string) => void
  resetPhases: () => void
}

const ActivityPhasesContext = createContext<Ctx | null>(null)

export function ActivityPhasesProvider({ children }: { children: ReactNode }) {
  const [phases, setPhases] = useState<ActivityPhase[]>(loadPhases)

  function persist(next: ActivityPhase[]) {
    setPhases(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function addPhase(p: Omit<ActivityPhase, 'id'>) {
    persist([...phases, { ...p, id: `custom_${Date.now()}` }])
  }

  function updatePhase(id: string, data: Partial<ActivityPhase>) {
    persist(phases.map((p) => p.id === id ? { ...p, ...data } : p))
  }

  function deletePhase(id: string) {
    persist(phases.filter((p) => p.id !== id))
  }

  function resetPhases() {
    persist(ACTIVITY_PHASES)
  }

  return (
    <ActivityPhasesContext.Provider value={{ phases, addPhase, updatePhase, deletePhase, resetPhases }}>
      {children}
    </ActivityPhasesContext.Provider>
  )
}

export function useActivityPhases() {
  const ctx = useContext(ActivityPhasesContext)
  if (!ctx) throw new Error('useActivityPhases must be inside ActivityPhasesProvider')
  return ctx
}
