import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL  as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
)

export type ProfileRow = {
  id:                      string
  nickname:                string
  birth_date:              string
  gender:                  string
  smoking:                 boolean
  exercise_level:          string
  health_status:           string
  healthy_life_expectancy: number
  total_life_expectancy:   number
  updated_at:              string
}

export type BucketItemRow = {
  id:                number
  user_id:           string
  title:             string
  category:          string
  emoji:             string
  budget:            number
  deadline:          string
  activity_phase_id: string
  suggest_reason:    string
  duration_days:     number
  companions:        string
  desire_level:      number
  completion_memo:   string
  done:              boolean
  created_at:        string
  updated_at:        string
}
