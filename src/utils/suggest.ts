import { differenceInDays } from 'date-fns'
import { ACTIVITY_PHASES, type ActivityPhase } from '../data/timeline'

export type Priority = 'urgent' | 'soon' | 'someday'
export type Urgency  = 'high'   | 'medium' | 'low'

/**
 * 設計書 §6.5 の仕様に基づく動的 priority 計算。
 *
 * 判定順序:
 * 1. アクティビティフェーズの残り年数 <= 3  → urgent
 * 2. アクティビティフェーズの残り年数 <= 10 → soon
 * 3. 上記に該当しないが deadline まで 1年以内 → urgent (期限ひっ迫)
 * 4. 上記に該当しないが deadline まで 3年以内 → soon
 * 5. それ以外 → someday
 */
export function calcPriority(
  activityPhaseId: string,
  deadline: string,
  currentAge: number,
  phases: ActivityPhase[] = ACTIVITY_PHASES,
): Priority {
  const phase = phases.find((p) => p.id === activityPhaseId)
  const yearsUntilActivityEnd = phase ? phase.endAge - currentAge : Infinity

  if (yearsUntilActivityEnd <= 3)  return 'urgent'
  if (yearsUntilActivityEnd <= 10) return 'soon'

  // フェーズ制約がゆるい場合は deadline で補完
  const daysUntilDeadline = differenceInDays(new Date(deadline), new Date())
  if (daysUntilDeadline <= 365)  return 'urgent'
  if (daysUntilDeadline <= 1095) return 'soon'   // 3年以内

  return 'someday'
}

/**
 * 期限日から逆算してダッシュボードの urgency を決定する。
 * - 60 日以内 → high
 * - 180 日以内 → medium
 * - それ以降 → low
 */
export function calcUrgency(deadline: string): Urgency {
  const days = differenceInDays(new Date(deadline), new Date())
  if (days <= 60)  return 'high'
  if (days <= 180) return 'medium'
  return 'low'
}

/**
 * activityPhaseId と currentAge から「残り〇〇年」テキストを生成する。
 */
export function suggestedDeadlineText(
  activityPhaseId: string,
  currentAge: number,
  phases: ActivityPhase[] = ACTIVITY_PHASES,
): string {
  const phase = phases.find((p) => p.id === activityPhaseId)
  if (!phase) return '早めに'
  const yearsLeft = phase.endAge - currentAge
  if (yearsLeft <= 0)  return '期限切れ間近！'
  if (yearsLeft <= 3)  return `今すぐ（${phase.label}寿命 残り${yearsLeft}年）`
  if (yearsLeft <= 10) return `${phase.endAge}歳（残り${yearsLeft}年）`
  return `${phase.endAge}歳`
}
