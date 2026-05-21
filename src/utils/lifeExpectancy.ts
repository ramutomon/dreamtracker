// 日本 2023 年統計を基準値として使用
// 厚生労働省「簡易生命表」および「健康寿命の推移」より

export type Gender        = 'male' | 'female' | 'other'
export type ExerciseLevel = 'regular' | 'occasional' | 'none'
export type HealthStatus  = 'good'   | 'normal'     | 'concern'

const BASE: Record<Gender, { total: number; healthy: number }> = {
  male:   { total: 81, healthy: 73 },
  female: { total: 87, healthy: 75 },
  other:  { total: 84, healthy: 74 },
}

const EXERCISE_DELTA: Record<ExerciseLevel, { total: number; healthy: number }> = {
  regular:    { total: +2, healthy: +2 },
  occasional: { total:  0, healthy:  0 },
  none:       { total: -2, healthy: -1 },
}

const HEALTH_DELTA: Record<HealthStatus, { total: number; healthy: number }> = {
  good:    { total: +2, healthy: +2 },
  normal:  { total:  0, healthy:  0 },
  concern: { total: -3, healthy: -3 },
}

export function calcDefaultLifeExpectancy(
  gender:        Gender,
  smoking:       boolean,
  exerciseLevel: ExerciseLevel,
  healthStatus:  HealthStatus,
): { healthy: number; total: number } {
  const base     = BASE[gender]
  const exercise = EXERCISE_DELTA[exerciseLevel]
  const health   = HEALTH_DELTA[healthStatus]
  const smoke    = smoking ? { total: -4, healthy: -3 } : { total: 0, healthy: 0 }

  const total   = Math.max(60, base.total   + smoke.total   + exercise.total   + health.total)
  const healthy = Math.max(50, Math.min(
    base.healthy + smoke.healthy + exercise.healthy + health.healthy,
    total - 5,  // 健康寿命は総寿命より少なくとも5年短くなるよう調整
  ))

  return { total: Math.round(total), healthy: Math.round(healthy) }
}
