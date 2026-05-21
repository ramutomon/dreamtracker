import { useState } from 'react'
import { differenceInYears } from 'date-fns'
import { Clock, Info, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import { ACTIVITY_PHASES, type ActivityPhase } from '../data/timeline'
import { PRIORITY_CONFIG } from '../data/bucketList'
import { calcPriority } from '../utils/suggest'
import { useUser } from '../context/UserContext'
import { useBucketList } from '../context/BucketListContext'

const START_AGE = 18

function pct(age: number, totalLife: number) {
  return Math.min(100, Math.max(0, ((age - START_AGE) / (totalLife - START_AGE)) * 100))
}

function deadlineToAge(deadline: string, birthDate: string): number {
  if (!deadline || !birthDate) return 0
  return differenceInYears(new Date(deadline), new Date(birthDate))
}

function AgeMarkers({ totalLife }: { totalLife: number }) {
  const markers: number[] = []
  for (let age = START_AGE; age <= totalLife; age += 10) markers.push(age)
  return (
    <div className="relative h-5 mb-1">
      {markers.map((age) => (
        <span
          key={age}
          className="absolute text-xs text-white/30 -translate-x-1/2"
          style={{ left: `${pct(age, totalLife)}%` }}
        >
          {age}
        </span>
      ))}
    </div>
  )
}

function NowMarker({ currentAge, totalLife }: { currentAge: number; totalLife: number }) {
  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-brand-orange z-10 pointer-events-none"
      style={{ left: `${pct(currentAge, totalLife)}%` }}
    >
      <div className="absolute -top-1 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-brand-orange shadow-[0_0_8px_2px_rgba(249,115,22,0.5)]" />
    </div>
  )
}

function PhaseBar({
  phase, onClick, active, currentAge, totalLife,
}: {
  phase: ActivityPhase
  onClick: () => void
  active: boolean
  currentAge: number
  totalLife: number
}) {
  const left      = pct(phase.startAge, totalLife)
  const width     = pct(phase.endAge, totalLife) - left
  const remaining = Math.max(0, phase.endAge - currentAge)

  return (
    <div className="relative h-10 mb-3">
      <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-white/5" />
      <button
        onClick={onClick}
        className={clsx(
          'absolute inset-y-0 rounded-full flex items-center px-3 gap-2 transition-all cursor-pointer',
          active ? 'ring-2 ring-white/40 brightness-125' : 'hover:brightness-110',
        )}
        style={{
          left: `${left}%`,
          width: `${width}%`,
          backgroundColor: phase.bgColor,
          borderLeft: `3px solid ${phase.color}`,
        }}
      >
        <span className="text-base leading-none shrink-0">{phase.emoji}</span>
        <span className="text-xs font-medium truncate hidden sm:block" style={{ color: phase.color }}>
          {phase.label}
        </span>
        {remaining > 0 && (
          <span className="ml-auto text-xs text-white/40 hidden md:block shrink-0">
            残り{remaining}年
          </span>
        )}
      </button>
    </div>
  )
}

export default function Timeline() {
  const { age, profile }        = useUser()
  const { items }               = useBucketList()
  const totalLife               = profile.totalLifeExpectancy
  const [selected, setSelected] = useState<ActivityPhase | null>(null)

  // 期限と誕生日から年齢を計算できるアイテム
  const itemsWithAge = items
    .filter((i) => !i.done && i.deadline && profile.birthDate)
    .map((i) => ({
      ...i,
      deadlineAge: deadlineToAge(i.deadline, profile.birthDate),
    }))
    .filter((i) => i.deadlineAge >= START_AGE && i.deadlineAge <= totalLife + 5)
    .sort((a, b) => a.deadlineAge - b.deadlineAge)

  // 選択中フェーズに属するアイテム
  const phaseItems = selected
    ? items.filter((i) => !i.done && i.activityPhaseId === selected.id)
    : []

  return (
    <div className="min-h-full bg-hero-gradient">
      <header className="px-6 pt-8 pb-4 md:px-10">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={16} className="text-brand-orange" />
          <p className="text-white/40 text-sm">アクティビティ寿命 × 夢</p>
        </div>
        <h1 className="text-2xl font-bold">タイムライン</h1>
        <p className="text-white/50 text-sm mt-1">
          年齢とともに「できること」は変わる。今しかできない体験を可視化する。
        </p>
      </header>

      <div className="px-6 md:px-10 pb-28 md:pb-10 space-y-6">

        {/* ── タイムライン本体 ── */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-8 overflow-x-auto">
          <div className="min-w-[520px]">
            <AgeMarkers totalLife={totalLife} />

            <div className="relative">
              <NowMarker currentAge={age} totalLife={totalLife} />
              {ACTIVITY_PHASES.map((phase) => (
                <PhaseBar
                  key={phase.id}
                  phase={phase}
                  active={selected?.id === phase.id}
                  onClick={() => setSelected(selected?.id === phase.id ? null : phase)}
                  currentAge={age}
                  totalLife={totalLife}
                />
              ))}

              {/* 夢マーカー行 */}
              {itemsWithAge.length > 0 && (
                <div className="relative h-10 mt-1">
                  <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-white/3 border border-white/5 border-dashed" />
                  {itemsWithAge.map((item) => (
                    <div
                      key={item.id}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center group"
                      style={{ left: `${pct(item.deadlineAge, totalLife)}%` }}
                      title={`${item.title}（${item.deadlineAge}歳）`}
                    >
                      <span className="text-lg leading-none drop-shadow">{item.emoji}</span>
                    </div>
                  ))}
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/20">
                    あなたの夢
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 bg-brand-orange" /> 現在（{age}歳）
              </span>
              <span>— バーをタップすると詳細・夢を表示</span>
            </div>
          </div>
        </section>

        {/* ── フェーズ詳細 + 関連する夢 ── */}
        {selected && (
          <section
            className="rounded-2xl border p-5 transition-all"
            style={{ backgroundColor: selected.bgColor, borderColor: selected.color + '40' }}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="text-4xl leading-none">{selected.emoji}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-lg" style={{ color: selected.color }}>
                  {selected.label}
                </h3>
                <p className="text-white/70 text-sm mt-1">{selected.description}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                    <p className="text-xs text-white/40">開始年齢</p>
                    <p className="text-lg font-bold text-white">{selected.startAge}<span className="text-sm font-normal">歳</span></p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                    <p className="text-xs text-white/40">ピーク終了</p>
                    <p className="text-lg font-bold text-white">{selected.endAge}<span className="text-sm font-normal">歳</span></p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                    <p className="text-xs text-white/40">残り期間</p>
                    <p className="text-lg font-bold" style={{ color: selected.color }}>
                      {Math.max(0, selected.endAge - age)}<span className="text-sm font-normal">年</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {phaseItems.length > 0 && (
              <div className="space-y-2 border-t border-white/10 pt-4">
                <p className="text-xs text-white/50 mb-2">このフェーズの夢 ({phaseItems.length}件)</p>
                {phaseItems.map((item) => {
                  const priority = calcPriority(item.activityPhaseId, item.deadline, age)
                  const cfg      = PRIORITY_CONFIG[priority]
                  return (
                    <div key={item.id} className="flex items-center gap-3 bg-white/8 rounded-xl px-3 py-2.5">
                      <span className="text-xl shrink-0">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.title}</p>
                        {item.deadline && (
                          <p className="text-xs text-white/40">期限: {item.deadline}</p>
                        )}
                      </div>
                      <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0', cfg.color, cfg.bg, cfg.border)}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            {phaseItems.length === 0 && (
              <p className="text-xs text-white/30 border-t border-white/10 pt-4">
                このフェーズに登録された夢はありません
              </p>
            )}
          </section>
        )}

        {/* ── 今すぐすべきこと ── */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-brand-orange" />
            <h2 className="text-sm font-semibold text-white/70">あなたの今すべきこと</h2>
          </div>
          <ul className="space-y-2">
            {ACTIVITY_PHASES
              .filter((p) => p.endAge - age <= 20 && p.endAge > age)
              .sort((a, b) => a.endAge - b.endAge)
              .map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="text-xl">{p.emoji}</span>
                  <span className="text-white/80">
                    <span style={{ color: p.color }} className="font-medium">{p.label}</span>
                    {' '}はあと <strong className="text-white">{p.endAge - age}年</strong>。急いで！
                  </span>
                </li>
              ))}
          </ul>
        </section>

        {/* ── 夢のタイムライン（期限順リスト） ── */}
        {itemsWithAge.length > 0 && (
          <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-semibold text-white/70 mb-4">夢のタイムライン</h2>
            <div className="relative">
              {/* 縦線 */}
              <div className="absolute left-[22px] top-2 bottom-2 w-px bg-white/10" />
              <div className="space-y-3">
                {itemsWithAge.map((item) => {
                  const phase    = ACTIVITY_PHASES.find((p) => p.id === item.activityPhaseId)
                  const priority = calcPriority(item.activityPhaseId, item.deadline, age)
                  const cfg      = PRIORITY_CONFIG[priority]
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      {/* 年齢バッジ */}
                      <div
                        className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg z-10"
                        style={{ backgroundColor: phase?.bgColor ?? 'rgba(255,255,255,0.05)' }}
                        title={`${item.deadlineAge}歳`}
                      >
                        {item.emoji}
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-white font-medium leading-snug">{item.title}</p>
                          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0', cfg.color, cfg.bg, cfg.border)}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-white/30">{item.deadlineAge}歳</span>
                          {item.deadline && (
                            <span className="text-xs text-white/25">({item.deadline})</span>
                          )}
                          {item.companions && (
                            <span className="text-xs text-white/30">· {item.companions}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 達成済み */}
            {items.filter((i) => i.done).length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/30 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-brand-orange" />
                  達成済み ({items.filter((i) => i.done).length}件)
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.filter((i) => i.done).map((i) => (
                    <span key={i.id} className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-lg flex items-center gap-1">
                      {i.emoji} {i.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  )
}
