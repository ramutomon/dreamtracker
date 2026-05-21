import { useState, useEffect, type FormEvent } from 'react'
import { differenceInYears } from 'date-fns'
import { X, Smile, Search, Loader2, Users } from 'lucide-react'
import clsx from 'clsx'
import type { BucketItem } from '../data/bucketList'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useActivityPhases } from '../context/ActivityPhasesContext'

// ── 型定義 ──────────────────────────────────────────────────────
export type BucketFormData = Omit<BucketItem, 'id' | 'done'>

type SearchResult = {
  title:             string
  emoji:             string
  category:          string
  budget:            number
  deadline:          string | null
  activity_phase_id: string
  suggest_reason:    string | null
}

const EMOJI_PRESETS = [
  '✈️','🏔️','🌌','🍽️','🎭','🏄','🧗','🪂','🗻','♨️',
  '💎','📚','🎵','🎨','🏆','🌸','🦁','🌊','🥾','🎿',
  '🚂','🛥️','🎪','🍷','🎬','🏛️','🌏','🎤','🌋','🐘',
]

const CATEGORY_PRESETS = ['旅行','グルメ','アドベンチャー','文化','家族','スポーツ','自己実現','その他']

const COMPANIONS_PRESETS = ['一人で','パートナーと','家族と','友人と','子どもと','親と']

const EMPTY_FORM: BucketFormData = {
  title:           '',
  emoji:           '🌟',
  category:        '旅行',
  budget:          0,
  deadline:        '',
  durationDays:    0,
  companions:      '',
  desireLevel:     3,
  activityPhaseId: 'travel',
  suggestReason:   '',
  completionMemo:  '',
}

// ── サブコンポーネント ───────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-white/40 mb-1.5">{children}</label>
}

function TextInput({ value, onChange, placeholder, required }: {
  value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm',
        'placeholder-white/20',
        'focus:outline-none focus:border-brand-orange/60 focus:ring-1 focus:ring-brand-orange/20 transition-all',
      )}
    />
  )
}

// ── メインコンポーネント ─────────────────────────────────────────
type Props = {
  initial?: BucketItem
  onSave:  (data: BucketFormData) => void
  onClose: () => void
}

// 年齢 → ISO日付（誕生日の応当日）
function ageToDeadline(targetAge: number, birthDate: string): string {
  if (!birthDate || targetAge <= 0) return ''
  const birth = new Date(birthDate)
  const y = birth.getFullYear() + targetAge
  const m = String(birth.getMonth() + 1).padStart(2, '0')
  const d = String(birth.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ISO日付 → 何歳時点か
function deadlineToAge(deadline: string, birthDate: string): number {
  if (!deadline || !birthDate) return 30
  return Math.max(1, differenceInYears(new Date(deadline), new Date(birthDate)))
}

export default function BucketItemModal({ initial, onSave, onClose }: Props) {
  const { user, profile } = useUser()
  const { phases }        = useActivityPhases()
  const isEdit            = Boolean(initial)
  const hasBirthDate      = Boolean(profile.birthDate)

  const [form, setForm] = useState<BucketFormData>(() => {
    if (initial) {
      return { title: initial.title, emoji: initial.emoji, category: initial.category,
               budget: initial.budget, deadline: initial.deadline,
               durationDays: initial.durationDays, companions: initial.companions,
               desireLevel: initial.desireLevel, activityPhaseId: initial.activityPhaseId,
               suggestReason: initial.suggestReason, completionMemo: initial.completionMemo }
    }
    // 新規: 年齢モードのデフォルト期限を計算
    const defaultAge = profile.birthDate
      ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)) + 5
      : 40
    return { ...EMPTY_FORM, deadline: ageToDeadline(defaultAge, profile.birthDate) }
  })

  // 期限入力モード
  const [deadlineMode, setDeadlineMode] = useState<'date' | 'age'>(hasBirthDate ? 'age' : 'date')
  const [ageInput, setAgeInput]         = useState<number>(() => {
    if (initial?.deadline && profile.birthDate)
      return deadlineToAge(initial.deadline, profile.birthDate)
    // 新規追加時: 現在年齢 + 5 年をデフォルトに
    if (profile.birthDate) {
      const currentAge = Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
      return currentAge + 5
    }
    return 40
  })

  function switchToAge() {
    if (!hasBirthDate) return
    if (form.deadline && profile.birthDate) {
      setAgeInput(deadlineToAge(form.deadline, profile.birthDate))
    }
    setDeadlineMode('age')
    set('deadline', ageToDeadline(ageInput, profile.birthDate))
  }

  function switchToDate() {
    setDeadlineMode('date')
  }

  function handleAgeChange(age: number) {
    setAgeInput(age)
    set('deadline', ageToDeadline(age, profile.birthDate))
  }

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [error, setError]                     = useState('')

  // ── 検索 ──────────────────────────────────────────────────────
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [searchQuery,   setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // パネルを開いたときに最新の夢を取得
  useEffect(() => {
    if (!searchOpen) return
    if (!user) { setSearchLoading(false); return }
    setSearchLoading(true)
    ;(async () => {
      try {
        const { data } = await supabase
          .from('bucket_items')
          .select('title,emoji,category,budget,deadline,activity_phase_id,suggest_reason')
          .neq('user_id', user.id)
          .eq('done', false)
          .order('created_at', { ascending: false })
          .limit(10)
        setSearchResults((data ?? []) as SearchResult[])
      } catch {
        // ignore
      } finally {
        setSearchLoading(false)
      }
    })()
  }, [searchOpen, user?.id])

  // キーワード検索（300ms デバウンス）
  useEffect(() => {
    if (!searchOpen || !user || !searchQuery.trim()) return
    setSearchLoading(true)
    const timer = setTimeout(() => {
      ;(async () => {
        try {
          const { data } = await supabase
            .from('bucket_items')
            .select('title,emoji,category,budget,deadline,activity_phase_id,suggest_reason')
            .neq('user_id', user.id)
            .eq('done', false)
            .ilike('title', `%${searchQuery}%`)
            .limit(10)
          setSearchResults((data ?? []) as SearchResult[])
        } catch {
          // ignore
        } finally {
          setSearchLoading(false)
        }
      })()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchOpen, user?.id])

  function applyTemplate(r: SearchResult) {
    setForm({
      title:           r.title,
      emoji:           r.emoji,
      category:        r.category,
      budget:          r.budget,
      deadline:        r.deadline ?? '',
      durationDays:    0,
      companions:      '',
      desireLevel:     3,
      activityPhaseId: r.activity_phase_id,
      suggestReason:   r.suggest_reason ?? '',
      completionMemo:  '',
    })
    setSearchOpen(false)
    setSearchQuery('')
  }

  // ── フォーム送信 ───────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('タイトルを入力してください'); return }
    if (!form.deadline)     { setError('期限を入力してください');     return }
    onSave({ ...form, title: form.title.trim(), suggestReason: form.suggestReason.trim(), companions: form.companions.trim() })
    onClose()
  }

  const set = <K extends keyof BucketFormData>(key: K, val: BucketFormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-3xl bg-brand-slate border border-white/10 shadow-2xl flex flex-col max-h-[92vh]">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10 shrink-0">
          <h2 className="font-bold text-white">{isEdit ? '夢を編集' : '新しい夢を追加'}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* ── みんなの夢から探す ───────────────────────────────── */}
          {!isEdit && (
            <div>
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className={clsx(
                  'w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all border',
                  searchOpen
                    ? 'bg-brand-orange/15 border-brand-orange/40 text-brand-orange'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20',
                )}
              >
                <Users size={15} />
                みんなの夢から探す
                <span className="ml-auto text-xs opacity-60">{searchOpen ? '▲' : '▼'}</span>
              </button>

              {searchOpen && (
                <div className="mt-2 bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
                  {/* 検索入力 */}
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="キーワードで検索..."
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-brand-orange/50 transition-all"
                    />
                  </div>

                  {/* 結果リスト */}
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={16} className="text-white/30 animate-spin" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="text-xs text-white/30 text-center py-3">
                      {searchQuery ? '一致する夢が見つかりません' : 'みんなの夢がまだありません'}
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {searchResults.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => applyTemplate(r)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 transition-all text-left group"
                        >
                          <span className="text-lg leading-none shrink-0">{r.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate group-hover:text-brand-orange transition-colors">{r.title}</p>
                            <p className="text-xs text-white/30">{r.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-white/20 text-center pt-1">クリックするとフォームに入力されます</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* 絵文字 + タイトル */}
            <div className="flex gap-3 items-start">
              <div className="shrink-0">
                <FieldLabel>絵文字</FieldLabel>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="w-14 h-[42px] text-2xl rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center"
                >
                  {form.emoji || <Smile size={18} className="text-white/30" />}
                </button>
              </div>
              <div className="flex-1">
                <FieldLabel>タイトル *</FieldLabel>
                <TextInput
                  value={form.title}
                  onChange={(v) => set('title', v)}
                  placeholder="例：アイスランドでオーロラを見る"
                  required
                />
              </div>
            </div>

            {/* 絵文字パレット */}
            {showEmojiPicker && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="flex flex-wrap gap-1">
                  {EMOJI_PRESETS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { set('emoji', e); setShowEmojiPicker(false) }}
                      className={clsx(
                        'w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all',
                        form.emoji === e
                          ? 'bg-brand-orange/20 ring-1 ring-brand-orange/50'
                          : 'hover:bg-white/10',
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={form.emoji}
                  onChange={(e) => set('emoji', e.target.value)}
                  placeholder="カスタム絵文字を入力"
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-brand-orange/50 transition-all"
                />
              </div>
            )}

            {/* やりたい度 */}
            <div>
              <FieldLabel>やりたい度</FieldLabel>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set('desireLevel', n)}
                    className="text-2xl leading-none transition-transform hover:scale-110 active:scale-95"
                    aria-label={`やりたい度 ${n}`}
                  >
                    <span className={n <= form.desireLevel ? 'opacity-100' : 'opacity-20'}>⭐</span>
                  </button>
                ))}
                <span className="ml-2 text-xs text-white/30">
                  {form.desireLevel === 1 && 'まあいつか…'}
                  {form.desireLevel === 2 && '気になる'}
                  {form.desireLevel === 3 && 'ぜひ行きたい'}
                  {form.desireLevel === 4 && 'かなりやりたい！'}
                  {form.desireLevel === 5 && '絶対にやる！🔥'}
                </span>
              </div>
            </div>

            {/* カテゴリ */}
            <div>
              <FieldLabel>カテゴリ</FieldLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {CATEGORY_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('category', c)}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                      form.category === c
                        ? 'bg-brand-orange/20 border-brand-orange/50 text-brand-orange'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <TextInput
                value={form.category}
                onChange={(v) => set('category', v)}
                placeholder="カスタムカテゴリ"
              />
            </div>

            {/* 目標期限 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-white/40">目標期限 *</label>
                {/* モード切り替え */}
                <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={switchToDate}
                    className={clsx(
                      'px-2.5 py-1 transition-all',
                      deadlineMode === 'date'
                        ? 'bg-brand-orange/20 text-brand-orange'
                        : 'text-white/30 hover:text-white',
                    )}
                  >
                    日付
                  </button>
                  <button
                    type="button"
                    onClick={switchToAge}
                    disabled={!hasBirthDate}
                    title={!hasBirthDate ? 'プロフィールで生年月日を設定してください' : undefined}
                    className={clsx(
                      'px-2.5 py-1 transition-all border-l border-white/10',
                      deadlineMode === 'age'
                        ? 'bg-brand-orange/20 text-brand-orange'
                        : 'text-white/30 hover:text-white',
                      !hasBirthDate && 'opacity-30 cursor-not-allowed',
                    )}
                  >
                    年齢
                  </button>
                </div>
              </div>

              {deadlineMode === 'date' ? (
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => set('deadline', e.target.value)}
                  className={clsx(
                    'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm',
                    '[color-scheme:dark]',
                    'focus:outline-none focus:border-brand-orange/60 focus:ring-1 focus:ring-brand-orange/20 transition-all',
                  )}
                />
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={ageInput}
                      min={1}
                      max={120}
                      onChange={(e) => handleAgeChange(Number(e.target.value))}
                      className={clsx(
                        'w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm',
                        'focus:outline-none focus:border-brand-orange/60 focus:ring-1 focus:ring-brand-orange/20 transition-all',
                      )}
                    />
                    <span className="text-sm text-white/50">歳までに</span>
                  </div>
                  {form.deadline && (
                    <p className="text-xs text-white/30">
                      → {form.deadline}（{ageInput}歳の誕生日）
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 予算・所要日数 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>予算（万円）</FieldLabel>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.budget > 0 ? String(Math.round(form.budget / 10000)) : ''}
                    placeholder="例：50"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '')
                      set('budget', raw === '' ? 0 : Number(raw) * 10000)
                    }}
                    className={clsx(
                      'w-full bg-white/5 border border-white/10 rounded-xl px-3 pr-10 py-2.5 text-white text-sm',
                      'placeholder-white/20',
                      'focus:outline-none focus:border-brand-orange/60 focus:ring-1 focus:ring-brand-orange/20 transition-all',
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">万円</span>
                </div>
              </div>
              <div>
                <FieldLabel>所要日数（任意）</FieldLabel>
                <div className="relative">
                  <input
                    type="number"
                    value={form.durationDays || ''}
                    min={0}
                    placeholder="例：7"
                    onChange={(e) => set('durationDays', Number(e.target.value))}
                    className={clsx(
                      'w-full bg-white/5 border border-white/10 rounded-xl px-3 pr-10 py-2.5 text-white text-sm',
                      'placeholder-white/20',
                      'focus:outline-none focus:border-brand-orange/60 focus:ring-1 focus:ring-brand-orange/20 transition-all',
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">日</span>
                </div>
              </div>
            </div>

            {/* アクティビティフェーズ */}
            <div>
              <FieldLabel>アクティビティ種別（期限の自動サジェストに使用）</FieldLabel>
              <select
                value={form.activityPhaseId}
                onChange={(e) => set('activityPhaseId', e.target.value)}
                className={clsx(
                  'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm',
                  'focus:outline-none focus:border-brand-orange/60 transition-all',
                  '[color-scheme:dark]',
                )}
              >
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.label}（〜{p.endAge}歳）
                  </option>
                ))}
              </select>
            </div>

            {/* 誰と */}
            <div>
              <FieldLabel>誰と（任意）</FieldLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {COMPANIONS_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('companions', form.companions === c ? '' : c)}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                      form.companions === c
                        ? 'bg-brand-orange/20 border-brand-orange/50 text-brand-orange'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <TextInput
                value={form.companions}
                onChange={(v) => set('companions', v)}
                placeholder="例：大学の友人3人と"
              />
            </div>

            {/* メモ */}
            <div>
              <FieldLabel>メモ・やりたい理由（任意）</FieldLabel>
              <textarea
                value={form.suggestReason}
                onChange={(e) => set('suggestReason', e.target.value)}
                placeholder="例：体力的なベストは今のうち。絶対に行きたい！"
                rows={2}
                className={clsx(
                  'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm',
                  'placeholder-white/20 resize-none',
                  'focus:outline-none focus:border-brand-orange/60 focus:ring-1 focus:ring-brand-orange/20 transition-all',
                )}
              />
            </div>

            {/* エラー */}
            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            {/* ボタン */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl text-sm font-medium text-white/50 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className={clsx(
                  'flex-1 py-3 rounded-2xl text-sm font-semibold text-white',
                  'bg-gradient-to-r from-brand-orange to-amber-400',
                  'hover:brightness-110 active:scale-[0.98] transition-all duration-200',
                  'shadow-[0_4px_16px_rgba(249,115,22,0.3)]',
                )}
              >
                {isEdit ? '変更を保存' : '追加する'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
