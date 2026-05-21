import { useState, type FormEvent } from 'react'
import { X, User, Heart, Infinity, RotateCcw, Cigarette, Dumbbell, Stethoscope } from 'lucide-react'
import { differenceInYears, format } from 'date-fns'
import clsx from 'clsx'
import { useUser, calcDefaultLifeExpectancy, type UserProfile, type Gender, type ExerciseLevel, type HealthStatus } from '../context/UserContext'

// ─── 小コンポーネント ───────────────────────────────────────────

function SectionTitle({ icon: Icon, title, subtitle }: {
  icon: React.ElementType
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={14} className="text-brand-orange shrink-0" />
      <div>
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">{title}</p>
        {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={clsx(
            'px-4 py-2 rounded-xl text-sm font-medium transition-all border',
            value === opt.value
              ? 'bg-brand-orange/20 border-brand-orange/50 text-brand-orange'
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function NumberInput({ value, min, max, suffix, onChange }: {
  value: number
  min: number
  max: number
  suffix: string
  onChange: (v: number) => void
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className={clsx(
          'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10',
          'text-white text-sm',
          'focus:outline-none focus:border-brand-orange/60 focus:ring-1 focus:ring-brand-orange/30',
          'transition-all',
        )}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">{suffix}</span>
    </div>
  )
}

// ─── メインモーダル ─────────────────────────────────────────────

export default function ProfileModal() {
  const { profile, isFirstVisit, updateProfile, closeProfileModal } = useUser()

  const [form, setForm] = useState<UserProfile>({ ...profile })
  const [error, setError]     = useState('')

  // 計算値と現在値が異なるかどうか（手動上書き中かどうか）
  const autoValues = calcDefaultLifeExpectancy(
    form.gender, form.smoking, form.exerciseLevel, form.healthStatus,
  )
  const isLifespanCustomized =
    form.healthyLifeExpectancy !== autoValues.healthy ||
    form.totalLifeExpectancy   !== autoValues.total

  // 健康プロフィール変更 → 手動上書きしていない場合は自動更新
  function updateHealthProfile(patch: Partial<UserProfile>) {
    const next = { ...form, ...patch }
    if (!isLifespanCustomized) {
      const auto = calcDefaultLifeExpectancy(
        next.gender, next.smoking, next.exerciseLevel, next.healthStatus,
      )
      setForm({ ...next, healthyLifeExpectancy: auto.healthy, totalLifeExpectancy: auto.total })
    } else {
      setForm(next)
    }
  }

  // 手動で寿命を変更
  function updateLifespan(patch: Partial<UserProfile>) {
    setForm({ ...form, ...patch })
  }

  // 計算値に戻す
  function resetLifespan() {
    const auto = calcDefaultLifeExpectancy(
      form.gender, form.smoking, form.exerciseLevel, form.healthStatus,
    )
    setForm({ ...form, healthyLifeExpectancy: auto.healthy, totalLifeExpectancy: auto.total })
  }

  const previewAge = form.birthDate
    ? differenceInYears(new Date(), new Date(form.birthDate))
    : 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.nickname.trim()) { setError('ニックネームを入力してください'); return }
    if (!form.birthDate)       { setError('生年月日を入力してください');     return }
    if (previewAge < 18 || previewAge > 100) { setError('生年月日が正しくありません'); return }
    await updateProfile(form)
    closeProfileModal()
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isFirstVisit ? undefined : closeProfileModal}
      />

      {/* カード */}
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-brand-slate border border-white/10 shadow-2xl flex flex-col max-h-[92vh]">

        {/* ヘッダー（固定） */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isFirstVisit ? 'ようこそ、DreamTracker へ' : 'プロフィール編集'}
              </h2>
              <p className="text-xs text-white/40 mt-0.5">
                {isFirstVisit
                  ? '情報を入力して、あなただけの人生設計を始めましょう。'
                  : '情報を更新してカウントダウンを正確に保ちましょう。'}
              </p>
            </div>
            {!isFirstVisit && (
              <button onClick={closeProfileModal} className="text-white/30 hover:text-white transition-colors">
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* スクロール可能なフォーム本体 */}
        <form id="profile-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-7">

          {/* ── セクション 1: 基本情報 ── */}
          <div>
            <SectionTitle icon={User} title="基本情報" />
            <div className="space-y-4">

              {/* ニックネーム */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">ニックネーム</label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  placeholder="例：健一、Kenji、田中さん"
                  maxLength={20}
                  className={clsx(
                    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3',
                    'text-white placeholder-white/20 text-sm',
                    'focus:outline-none focus:border-brand-orange/60 focus:ring-1 focus:ring-brand-orange/30 transition-all',
                  )}
                />
              </div>

              {/* 生年月日 */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">生年月日</label>
                <input
                  type="date"
                  value={form.birthDate}
                  max={today}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  className={clsx(
                    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3',
                    'text-white text-sm [color-scheme:dark]',
                    'focus:outline-none focus:border-brand-orange/60 focus:ring-1 focus:ring-brand-orange/30 transition-all',
                  )}
                />
                {form.birthDate && previewAge >= 18 && (
                  <p className="text-xs text-brand-orange mt-1.5 ml-1">
                    現在 <strong>{previewAge}</strong> 歳
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* ── セクション 2: 健康プロフィール ── */}
          <div>
            <SectionTitle
              icon={Stethoscope}
              title="健康プロフィール"
              subtitle="寿命の目安計算に使用します（変更すると自動更新）"
            />
            <div className="space-y-5">

              {/* 性別 */}
              <div>
                <label className="text-xs text-white/40 mb-2 block">性別</label>
                <PillGroup<Gender>
                  options={[
                    { value: 'male',   label: '男性' },
                    { value: 'female', label: '女性' },
                    { value: 'other',  label: '回答しない' },
                  ]}
                  value={form.gender}
                  onChange={(v) => updateHealthProfile({ gender: v })}
                />
              </div>

              {/* 喫煙習慣 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                  <Cigarette size={12} />
                  喫煙習慣
                </label>
                <PillGroup<string>
                  options={[
                    { value: 'false', label: '吸わない' },
                    { value: 'true',  label: '吸う（-4年）' },
                  ]}
                  value={String(form.smoking)}
                  onChange={(v) => updateHealthProfile({ smoking: v === 'true' })}
                />
              </div>

              {/* 運動習慣 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                  <Dumbbell size={12} />
                  運動習慣
                </label>
                <PillGroup<ExerciseLevel>
                  options={[
                    { value: 'regular',    label: '週3回以上（+2年）' },
                    { value: 'occasional', label: '週1〜2回' },
                    { value: 'none',       label: 'ほとんどしない（-2年）' },
                  ]}
                  value={form.exerciseLevel}
                  onChange={(v) => updateHealthProfile({ exerciseLevel: v })}
                />
              </div>

              {/* 健康診断 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                  <Heart size={12} />
                  直近の健康診断
                </label>
                <PillGroup<HealthStatus>
                  options={[
                    { value: 'good',    label: '良好（+2年）' },
                    { value: 'normal',  label: '普通' },
                    { value: 'concern', label: '気になる点あり（-3年）' },
                  ]}
                  value={form.healthStatus}
                  onChange={(v) => updateHealthProfile({ healthStatus: v })}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* ── セクション 3: 寿命設定 ── */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <SectionTitle
                icon={Infinity}
                title="寿命設定"
                subtitle={isLifespanCustomized ? '手動設定中' : '健康プロフィールから自動計算'}
              />
              {isLifespanCustomized && (
                <button
                  type="button"
                  onClick={resetLifespan}
                  className="flex items-center gap-1 text-xs text-brand-orange hover:text-amber-400 transition-colors shrink-0 mt-0.5"
                >
                  <RotateCcw size={11} />
                  計算値（{autoValues.healthy}/{autoValues.total}歳）に戻す
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">健康寿命の目標</label>
                <NumberInput
                  value={form.healthyLifeExpectancy}
                  min={50} max={100} suffix="歳"
                  onChange={(v) => updateLifespan({ healthyLifeExpectancy: v })}
                />
                {!isLifespanCustomized && (
                  <p className="text-xs text-white/25 mt-1 ml-1">自動: {autoValues.healthy}歳</p>
                )}
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">総寿命の想定</label>
                <NumberInput
                  value={form.totalLifeExpectancy}
                  min={60} max={120} suffix="歳"
                  onChange={(v) => updateLifespan({ totalLifeExpectancy: v })}
                />
                {!isLifespanCustomized && (
                  <p className="text-xs text-white/25 mt-1 ml-1">自動: {autoValues.total}歳</p>
                )}
              </div>
            </div>

            {/* 計算根拠の内訳 */}
            <div className="mt-3 bg-white/3 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white/30 space-y-0.5">
              <p>基準値（{form.gender === 'male' ? '男性' : form.gender === 'female' ? '女性' : '回答しない'}）:
                健康 {({ male: 73, female: 75, other: 74 } as const)[form.gender]}歳 /
                総 {({ male: 81, female: 87, other: 84 } as const)[form.gender]}歳
              </p>
              {form.smoking && <p>喫煙: 健康 -3年 / 総 -4年</p>}
              {form.exerciseLevel === 'regular' && <p>運動（週3回以上）: +2年 / +2年</p>}
              {form.exerciseLevel === 'none'    && <p>運動（ほぼなし）: 健康 -1年 / 総 -2年</p>}
              {form.healthStatus === 'good'    && <p>健康診断（良好）: +2年 / +2年</p>}
              {form.healthStatus === 'concern' && <p>健康診断（気になる点あり）: -3年 / -3年</p>}
            </div>
          </div>

          {/* エラー */}
          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </form>

        {/* 送信ボタン（固定フッター） */}
        <div className="px-6 pb-6 pt-3 shrink-0 border-t border-white/8">
          <button
            type="submit"
            form="profile-form"
            className={clsx(
              'w-full py-3.5 rounded-2xl font-semibold text-sm text-white',
              'bg-gradient-to-r from-brand-orange to-amber-400',
              'hover:brightness-110 active:scale-[0.98]',
              'transition-all duration-200',
              'shadow-[0_4px_20px_rgba(249,115,22,0.3)]',
            )}
          >
            {isFirstVisit ? '人生設計をスタート 🚀' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
