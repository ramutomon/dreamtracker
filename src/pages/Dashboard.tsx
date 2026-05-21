import { useMemo } from 'react'
import { differenceInDays, differenceInMonths, differenceInYears, addYears, format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Flame, Hourglass, ChevronRight, CheckCircle2, ListChecks, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { PRIORITY_CONFIG } from '../data/bucketList'
import { calcPriority } from '../utils/suggest'
import { useUser } from '../context/UserContext'
import { useBucketList } from '../context/BucketListContext'

function useCountdown(birthDate: string, healthyLifeExpectancy: number) {
  return useMemo(() => {
    const today           = new Date()
    const birth           = new Date(birthDate)
    const healthyLifeDate = addYears(birth, healthyLifeExpectancy)
    const years           = differenceInYears(healthyLifeDate, today)
    const months          = differenceInMonths(healthyLifeDate, today) % 12
    const days            = differenceInDays(healthyLifeDate, today)
    const totalDays       = differenceInDays(healthyLifeDate, birth)
    const passedDays      = differenceInDays(today, birth)
    const progressPct     = Math.min(100, Math.round((passedDays / totalDays) * 100))
    return { years, months, days, progressPct }
  }, [birthDate, healthyLifeExpectancy])
}

function fmt(n: number) {
  return new Intl.NumberFormat('ja-JP').format(n)
}

export default function Dashboard() {
  const { profile, age } = useUser()
  const { items }        = useBucketList()
  const countdown        = useCountdown(profile.birthDate, profile.healthyLifeExpectancy)
  const today            = new Date()

  const firstName = profile.nickname.split(/[\s　]/)[0] || 'ゲスト'

  const stats = useMemo(() => {
    const total   = items.length
    const done    = items.filter((i) => i.done).length
    const urgent  = items.filter((i) => !i.done && calcPriority(i.activityPhaseId, i.deadline, age) === 'urgent').length
    return { total, done, urgent }
  }, [items, age])

  const highlights = useMemo(() => {
    const order = { urgent: 0, soon: 1, someday: 2 } as const
    return items
      .filter((i) => !i.done)
      .map((i) => ({ ...i, priority: calcPriority(i.activityPhaseId, i.deadline, age) }))
      .sort((a, b) => order[a.priority] - order[b.priority])
      .slice(0, 3)
  }, [items, age])

  return (
    <div className="min-h-full bg-hero-gradient">
      <header className="px-6 pt-8 pb-4 md:px-10">
        <p className="text-white/40 text-sm">{format(today, 'yyyy年M月d日（eee）', { locale: ja })}</p>
        <h1 className="text-2xl font-bold mt-1">
          こんにちは、<span className="text-brand-orange">{firstName}</span>さん
        </h1>
        <p className="text-white/50 text-sm mt-1">あなたにはまだ、たくさんの時間があります。</p>
      </header>

      <div className="px-6 md:px-10 pb-10 space-y-6">

        {/* 健康寿命カウントダウン */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-orange/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex items-center gap-2 mb-4">
            <Hourglass size={16} className="text-brand-orange" />
            <span className="text-sm font-medium text-white/60">健康寿命まで</span>
          </div>

          <div className="flex items-end gap-4 mb-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-white tabular-nums leading-none">{countdown.years}</p>
              <p className="text-xs text-white/40 mt-1">年</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-white tabular-nums leading-none">{countdown.months}</p>
              <p className="text-xs text-white/40 mt-1">ヶ月</p>
            </div>
            <div className="mb-1">
              <p className="text-white/30 text-2xl font-light">({fmt(countdown.days)} 日)</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-white/30 mb-2">
              <span>0歳</span>
              <span className="text-white/60 font-medium">{age}歳（現在）</span>
              <span>{profile.healthyLifeExpectancy}歳</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-orange to-amber-400 rounded-full transition-all duration-1000"
                style={{ width: `${countdown.progressPct}%` }}
              />
            </div>
            <p className="text-xs text-white/30 mt-2 text-right">
              目標：{profile.healthyLifeExpectancy}歳まで健康に
            </p>
          </div>
        </section>

        {/* バケットリスト統計 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
            <ListChecks size={16} className="text-white/30 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white tabular-nums">{stats.total}</p>
            <p className="text-xs text-white/40 mt-0.5">総数</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
            <CheckCircle2 size={16} className="text-brand-orange mx-auto mb-1" />
            <p className="text-2xl font-bold text-white tabular-nums">{stats.done}</p>
            <p className="text-xs text-white/40 mt-0.5">達成済み</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
            <AlertCircle size={16} className="text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white tabular-nums">{stats.urgent}</p>
            <p className="text-xs text-white/40 mt-0.5">今すぐ！</p>
          </div>
        </div>

        {/* ハイライトカード */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} className="text-brand-orange" />
            <h2 className="text-sm font-semibold text-white/70">今すぐやるべき体験</h2>
          </div>

          {highlights.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-8 text-center">
              <p className="text-white/30 text-sm">バケットリストに夢を追加しましょう！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {highlights.map((item) => {
                const cfg = PRIORITY_CONFIG[item.priority]
                return (
                  <article
                    key={item.id}
                    className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-4 hover:bg-white/8 transition-colors cursor-pointer group"
                  >
                    <span className="text-3xl leading-none">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{item.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {item.category} · 期限 {item.deadline}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
                        {cfg.label}
                      </span>
                      <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-white/20 pt-2">
          現在 {age} 歳 — 残りの健康寿命を全力で生きよう
        </p>
      </div>
    </div>
  )
}
