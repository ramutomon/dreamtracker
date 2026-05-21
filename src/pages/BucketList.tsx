import { useState, useMemo } from 'react'
import { differenceInYears, differenceInDays, differenceInMonths, addYears, format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ListChecks, CheckCircle2, Circle, Filter, Plus, Pencil, Trash2, Clock, Users, FileText, ChevronDown, ChevronUp, Trophy, Hourglass, AlertCircle, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { PRIORITY_CONFIG, type BucketItem } from '../data/bucketList'
import type { ActivityPhase } from '../data/timeline'
import { calcPriority, suggestedDeadlineText, type Priority } from '../utils/suggest'
import { useUser } from '../context/UserContext'
import { useBucketList } from '../context/BucketListContext'
import { useActivityPhases } from '../context/ActivityPhasesContext'
import BucketItemModal, { type BucketFormData } from '../components/BucketItemModal'
import ActivityPhaseModal from '../components/ActivityPhaseModal'

type FilterKey   = 'all' | Priority | 'done'
type ModalMode   = 'add' | 'edit' | null
type DeleteState = { id: number; timer: ReturnType<typeof setTimeout> } | null

// ── 達成メモモーダル ─────────────────────────────────────────────
function CompletionModal({ item, onSave, onClose }: {
  item: BucketItem
  onSave:  (memo: string) => void
  onClose: () => void
}) {
  const [memo, setMemo] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl bg-brand-slate border border-white/10 shadow-2xl p-6 space-y-4">
        <div className="text-center space-y-2">
          <span className="text-5xl">{item.emoji}</span>
          <p className="text-brand-orange font-bold">🎉 達成おめでとうございます！</p>
          <p className="text-sm text-white/60">「{item.title}」</p>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">感想・メモ（任意）</label>
          <textarea
            autoFocus
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="どうでしたか？思い出を残しましょう"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-brand-orange/60 transition-all"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl text-sm text-white/40 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            キャンセル
          </button>
          <button
            onClick={() => onSave(memo)}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-brand-orange to-amber-400 hover:brightness-110 transition-all"
          >
            達成登録
          </button>
        </div>
      </div>
    </div>
  )
}

// ── インラインメモ編集 ────────────────────────────────────────────
function MemoEditor({ memo, onSave }: { memo: string; onSave: (m: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(memo)

  function save() {
    onSave(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="mt-1.5 space-y-1.5">
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          className="w-full bg-white/5 border border-brand-orange/40 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 resize-none focus:outline-none"
          placeholder="感想・メモを入力"
        />
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="text-xs text-white/30 hover:text-white/60 transition-colors">キャンセル</button>
          <button onClick={save} className="text-xs font-semibold text-brand-orange hover:brightness-110 transition-colors">保存</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="mt-1.5 group/memo flex items-start gap-1.5 cursor-pointer"
      onClick={() => { setValue(memo); setEditing(true) }}
    >
      {memo
        ? <p className="text-xs text-white/40 leading-relaxed bg-white/5 rounded-lg px-2 py-1.5 flex-1">💬 {memo}</p>
        : <p className="text-xs text-white/20 italic">タップしてメモを追加…</p>
      }
      <Pencil size={11} className="text-white/20 group-hover/memo:text-white/50 transition-colors mt-1.5 shrink-0" />
    </div>
  )
}

const START_AGE = 18

function pct(age: number, totalLife: number) {
  return Math.min(100, Math.max(0, ((age - START_AGE) / (totalLife - START_AGE)) * 100))
}

function fmt(n: number) {
  if (n === 0) return '費用なし'
  if (n >= 10_000) return `¥${Math.round(n / 10_000)}万`
  return `¥${new Intl.NumberFormat('ja-JP').format(n)}`
}

function calcCountdown(birthDate: string, targetAge: number) {
  if (!birthDate) return { years: 0, months: 0, days: 0, progressPct: 0 }
  const today      = new Date()
  const birth      = new Date(birthDate)
  const targetDate = addYears(birth, targetAge)
  const years      = Math.max(0, differenceInYears(targetDate, today))
  const months     = Math.max(0, differenceInMonths(targetDate, today) % 12)
  const days       = Math.max(0, differenceInDays(targetDate, today))
  const totalDays  = differenceInDays(targetDate, birth)
  const passedDays = differenceInDays(today, birth)
  const progressPct = Math.min(100, Math.round((passedDays / totalDays) * 100))
  return { years, months, days, progressPct }
}

function useCountdown(birthDate: string, healthyLifeExpectancy: number, totalLifeExpectancy: number) {
  return useMemo(() => ({
    healthy: calcCountdown(birthDate, healthyLifeExpectancy),
    total:   calcCountdown(birthDate, totalLifeExpectancy),
  }), [birthDate, healthyLifeExpectancy, totalLifeExpectancy])
}

function fmtNum(n: number) {
  return new Intl.NumberFormat('ja-JP').format(n)
}

// ── タイムラインセクション ───────────────────────────────────────
function TimelineSection({ age, totalLife, birthDate, items, onEdit, onDelete }: {
  age: number
  totalLife: number
  birthDate: string
  items: BucketItem[]
  onEdit:   (item: BucketItem) => void
  onDelete: (id: number) => void
}) {
  const { phases, addPhase, updatePhase, deletePhase, resetPhases } = useActivityPhases()
  const [open,           setOpen]           = useState(true)
  const [selectedId,     setSelectedId]     = useState<number | null>(null)
  const [showPhasePanel, setShowPhasePanel] = useState(false)
  const [phaseModal,     setPhaseModal]     = useState<{ mode: 'add' | 'edit'; phase?: ActivityPhase } | null>(null)

  const itemsWithAge = items
    .filter((i) => !i.done && i.deadline && birthDate)
    .map((i) => ({
      ...i,
      deadlineAge: differenceInYears(new Date(i.deadline), new Date(birthDate)),
    }))
    .filter((i) => i.deadlineAge >= START_AGE && i.deadlineAge <= totalLife + 5)

  const selectedItem = itemsWithAge.find((i) => i.id === selectedId) ?? null

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-brand-orange" />
          <span className="text-sm font-medium text-white/70">ライフタイムライン</span>
        </div>
        <div className="flex items-center gap-1">
          {open && (
            <button
              onClick={() => setShowPhasePanel((v) => !v)}
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                showPhasePanel
                  ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30'
                  : 'text-white/40 bg-white/5 hover:bg-white/10',
              )}
              title="種別管理"
            >
              <Pencil size={13} />
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {open && showPhasePanel && (
        <div className="border-t border-white/8 bg-white/3">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">アクティビティ種別の管理</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { if (window.confirm('デフォルト設定にリセットしますか？')) { resetPhases(); setOpen(true) } }}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
                title="デフォルトにリセット"
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={() => setPhaseModal({ mode: 'add' })}
                className="p-1.5 rounded-lg text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20 transition-colors"
                title="種別を追加"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {phases.map((phase) => (
              <div key={phase.id} className="rounded-xl px-3 py-2.5 flex flex-col gap-1" style={{ backgroundColor: phase.bgColor }}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-base leading-none">{phase.emoji}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => setPhaseModal({ mode: 'edit', phase })}
                      className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => { deletePhase(phase.id); setOpen(true) }}
                      className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                <p className="text-xs font-medium leading-snug" style={{ color: phase.color }}>{phase.label}</p>
                <p className="text-xs text-white/35">{phase.startAge}〜{phase.endAge}歳</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="px-5 pb-5">
          <div>
            {/* 年齢マーカー */}
            <div className="relative h-5 mb-1">
              {Array.from({ length: Math.floor((totalLife - START_AGE) / 10) + 1 }, (_, i) => START_AGE + i * 10)
                .filter((a) => a <= totalLife)
                .map((a) => (
                  <span
                    key={a}
                    className={clsx(
                      'absolute text-xs text-white/25 -translate-x-1/2',
                      (a - START_AGE) % 20 !== 0 && 'hidden sm:inline',
                    )}
                    style={{ left: `${pct(a, totalLife)}%` }}
                  >
                    {a}
                  </span>
                ))}
            </div>

            <div className="relative" key={phases.map(p => `${p.id}${p.startAge}${p.endAge}${p.color}`).join(',')}>
              {/* 現在線 */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-brand-orange z-20 pointer-events-none"
                style={{ left: `${pct(age, totalLife)}%` }}
              >
                <div className="absolute -top-1 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-brand-orange shadow-[0_0_8px_2px_rgba(249,115,22,0.5)]" />
              </div>

              {/* フェーズバー */}
              {phases.map((phase) => {
                const left  = pct(phase.startAge, totalLife)
                const width = pct(phase.endAge, totalLife) - left
                return (
                  <div key={phase.id} className="relative h-7 mb-1.5">
                    <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-white/4" />
                    <div
                      className="absolute inset-y-0 rounded-full flex items-center px-2 gap-1 overflow-hidden"
                      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: phase.bgColor, borderLeft: `3px solid ${phase.color}` }}
                    >
                      <span className="text-sm leading-none shrink-0">{phase.emoji}</span>
                      <span className="text-xs font-medium leading-none truncate whitespace-nowrap" style={{ color: phase.color }}>{phase.label}</span>
                    </div>
                  </div>
                )
              })}

              {/* 夢マーカー行 */}
              <div className="relative h-9 mt-1">
                <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-white/3 border border-dashed border-white/8" />
                {itemsWithAge.map((item) => (
                  <button
                    key={item.id}
                    className={clsx(
                      'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 text-lg leading-none transition-transform hover:scale-125',
                      selectedId === item.id && 'scale-125',
                    )}
                    style={{ left: `${pct(item.deadlineAge, totalLife)}%` }}
                    onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                    title={`${item.title}（${item.deadlineAge}歳）`}
                  >
                    {item.emoji}
                  </button>
                ))}
                {itemsWithAge.length === 0 && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-white/15 pointer-events-none">
                    期限を設定した夢がここに表示されます
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-white/25 mt-2 flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 bg-brand-orange" />
              現在 {age}歳
            </p>

            {/* 選択アイテムパネル */}
            {selectedItem && (
              <div className="mt-3 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                <span className="text-2xl leading-none shrink-0">{selectedItem.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{selectedItem.title}</p>
                  <p className="text-xs text-white/40">{selectedItem.deadline} · {selectedItem.deadlineAge}歳</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { onEdit(selectedItem); setSelectedId(null) }}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    title="編集"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => { onDelete(selectedItem.id); setSelectedId(null) }}
                    className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    title="削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {phaseModal && (
        <ActivityPhaseModal
          initial={phaseModal.mode === 'edit' ? phaseModal.phase : undefined}
          onSave={(data) => {
            if (phaseModal.mode === 'edit' && phaseModal.phase) {
              updatePhase(phaseModal.phase.id, data)
            } else {
              addPhase(data)
            }
            setPhaseModal(null)
            setOpen(true)
          }}
          onClose={() => setPhaseModal(null)}
        />
      )}
    </section>
  )
}

// ── BucketCard ───────────────────────────────────────────────────
function BucketCard({
  item, currentAge, birthDate, onToggle, onEdit, onDelete,
  confirmingDelete, onConfirmDelete, onCancelDelete, onUpdateMemo,
}: {
  item: BucketItem
  currentAge: number
  birthDate: string
  onToggle:         (id: number) => void
  onEdit:           (item: BucketItem) => void
  onDelete:         (id: number) => void
  confirmingDelete: boolean
  onConfirmDelete:  (id: number) => void
  onCancelDelete:   () => void
  onUpdateMemo:     (id: number, memo: string) => void
}) {
  const { phases }    = useActivityPhases()
  const priority      = calcPriority(item.activityPhaseId, item.deadline, currentAge, phases)
  const deadlineLabel = suggestedDeadlineText(item.activityPhaseId, currentAge, phases)
  const cfg           = PRIORITY_CONFIG[priority]

  const deadlineInfo = item.deadline ? (() => {
    const dl      = new Date(item.deadline)
    const today   = new Date()
    const ageAt   = birthDate ? differenceInYears(dl, new Date(birthDate)) : null
    const daysLeft = differenceInDays(dl, today)
    return { ageAt, daysLeft }
  })() : null

  const [collapsed, setCollapsed] = useState(false)

  return (
    <article
      className={clsx(
        'rounded-2xl border p-4 transition-all',
        item.done
          ? 'bg-white/3 border-white/5 opacity-60'
          : 'bg-white/5 border-white/10',
        confirmingDelete && 'border-red-400/40 bg-red-400/5',
      )}
    >
      {/* タイトル行 */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(item.id)}
          className="mt-0.5 shrink-0 group/check transition-transform active:scale-95"
          aria-label={item.done ? '未完了に戻す' : '完了にする'}
        >
          {item.done
            ? <CheckCircle2 size={24} className="text-brand-orange" />
            : <Circle size={24} className="text-white/25 group-hover/check:text-emerald-400 transition-colors duration-150" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 min-w-0">
            <span className="text-2xl leading-none shrink-0">{item.emoji}</span>
            <h3 className={clsx('font-semibold text-base leading-snug min-w-0 break-words', item.done && 'line-through text-white/40')}>
              {item.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {!item.done && (
              <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
                {cfg.label}
              </span>
            )}
            <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{item.category}</span>
            <span className="text-xs tracking-tight" title={`やりたい度 ${item.desireLevel}/5`}>
              {'⭐'.repeat(item.desireLevel)}
              <span className="opacity-15">{'⭐'.repeat(5 - item.desireLevel)}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!collapsed && !confirmingDelete && (
            <>
              <button
                onClick={() => onEdit(item)}
                className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/10 transition-all"
                aria-label="編集"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                aria-label="削除"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/10 transition-all"
            aria-label={collapsed ? '展開' : '折りたたむ'}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* 詳細・削除確認（カード全幅） */}
      {!collapsed && (
        <>
          {item.done && (
            <div className="mt-2">
              <MemoEditor
                memo={item.completionMemo}
                onSave={(m) => onUpdateMemo(item.id, m)}
              />
            </div>
          )}

          {!item.done && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex items-start gap-2 text-xs col-span-2">
                <span className="text-white/25 shrink-0 mt-0.5">📅</span>
                <span className="text-white/30 shrink-0 mt-0.5">期限</span>
                <span className="text-white/70">{item.deadline || '未設定'}</span>
                {deadlineInfo && (
                  <span className="text-white/35 ml-1">
                    {deadlineInfo.ageAt !== null && `${deadlineInfo.ageAt}歳 · `}
                    {deadlineInfo.daysLeft >= 0
                      ? `あと${new Intl.NumberFormat('ja-JP').format(deadlineInfo.daysLeft)}日`
                      : `${Math.abs(deadlineInfo.daysLeft)}日超過`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock size={11} className="text-white/25 shrink-0" />
                <span className="text-white/30 shrink-0">日数</span>
                <span className="text-white/70">{item.durationDays > 0 ? `${item.durationDays}日間` : '未設定'}</span>
              </div>
              {item.budget > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white/25 shrink-0">💰</span>
                  <span className="text-white/30 shrink-0">予算</span>
                  <span className="text-white/70">{fmt(item.budget)}</span>
                </div>
              )}
              {deadlineLabel && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white/25 shrink-0">💡</span>
                  <span className="text-white/30 shrink-0">推奨</span>
                  <span className="text-amber-400/70">{deadlineLabel}までに</span>
                </div>
              )}
              {item.companions && (
                <div className="flex items-center gap-2 text-xs">
                  <Users size={11} className="text-white/25 shrink-0" />
                  <span className="text-white/30 shrink-0">誰と</span>
                  <span className="text-white/70">{item.companions}</span>
                </div>
              )}
              {item.suggestReason && (
                <div className="flex items-start gap-2 text-xs col-span-2">
                  <FileText size={11} className="text-white/25 shrink-0 mt-0.5" />
                  <span className="text-white/30 shrink-0">メモ</span>
                  <span className="text-white/50 leading-relaxed">{item.suggestReason}</span>
                </div>
              )}
            </div>
          )}

          {confirmingDelete && (
            <div className="mt-3 flex items-center gap-3 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
              <p className="text-xs text-red-300 flex-1">本当に削除しますか？</p>
              <button
                onClick={() => onConfirmDelete(item.id)}
                className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                削除
              </button>
              <button
                onClick={onCancelDelete}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                キャンセル
              </button>
            </div>
          )}
        </>
      )}
    </article>
  )
}

// ── メインページ ─────────────────────────────────────────────────
export default function BucketList() {
  const { age, profile }                                                         = useUser()
  const { items, addItem, editItem, toggleDone, updateCompletionMemo, deleteItem, addError, clearError } = useBucketList()
  const { phases }                                                               = useActivityPhases()
  const countdown  = useCountdown(profile.birthDate, profile.healthyLifeExpectancy, profile.totalLifeExpectancy)
  const today      = new Date()
  const firstName  = profile.nickname.split(/[\s　]/)[0] || 'ゲスト'

  const [filter, setFilter]                   = useState<FilterKey>('all')
  const [modalMode, setModalMode]             = useState<ModalMode>(null)
  const [editingItem, setEditingItem]         = useState<BucketItem | null>(null)
  const [deleteState, setDeleteState]         = useState<DeleteState>(null)
  const [completingItem, setCompletingItem]   = useState<BucketItem | null>(null)
  const [restoringItem, setRestoringItem]     = useState<BucketItem | null>(null)
  const [showDoneList, setShowDoneList]       = useState(false)
  const [showStats, setShowStats]             = useState(true)
  const [showCountdown, setShowCountdown]     = useState(true)
  function requestDelete(id: number) {
    if (deleteState) clearTimeout(deleteState.timer)
    const timer = setTimeout(() => setDeleteState(null), 4000)
    setDeleteState({ id, timer })
  }

  function confirmDelete(id: number) {
    if (deleteState) clearTimeout(deleteState.timer)
    setDeleteState(null)
    deleteItem(id)
  }

  function cancelDelete() {
    if (deleteState) clearTimeout(deleteState.timer)
    setDeleteState(null)
  }

  function handleToggle(item: BucketItem) {
    if (!item.done) {
      setCompletingItem(item)
    } else {
      setRestoringItem(item)
    }
  }

  function confirmRestore() {
    if (!restoringItem) return
    toggleDone(restoringItem.id)
    setRestoringItem(null)
  }

  function handleCompletionSave(memo: string) {
    if (!completingItem) return
    toggleDone(completingItem.id, memo)
    setCompletingItem(null)
  }


  function openAdd() { setEditingItem(null); setModalMode('add') }
  function openEdit(item: BucketItem) { setEditingItem(item); setModalMode('edit') }
  function closeModal() { setModalMode(null); setEditingItem(null) }

  function handleSave(data: BucketFormData) {
    if (modalMode === 'edit' && editingItem) {
      editItem(editingItem.id, data)
    } else {
      addItem(data)
    }
  }

  const filtered = items.filter((item) => {
    if (filter === 'done') return item.done
    if (!item.done) {
      if (filter === 'all') return true
      return calcPriority(item.activityPhaseId, item.deadline, age, phases) === filter
    }
    return false
  })

  const countByPriority = (p: Priority) =>
    items.filter((i) => !i.done && calcPriority(i.activityPhaseId, i.deadline, age, phases) === p).length

  const doneCount  = items.filter((i) => i.done).length
  const totalCount = items.length

  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'all',     label: 'すべて'     },
    { key: 'urgent',  label: '今すぐ！'   },
    { key: 'soon',    label: '近いうちに' },
    { key: 'someday', label: 'いつかは'   },
    { key: 'done',    label: '達成済み'   },
  ]

  return (
    <div className="min-h-full bg-hero-gradient">
      <header className="sticky top-0 z-40 px-4 sm:px-6 md:px-10 pt-2.5 pb-2.5 bg-brand-navy/80 backdrop-blur-md border-b border-white/8">
        <div className="min-w-0">
          <p className="text-white/40 text-xs">{format(today, 'M月d日（eee）', { locale: ja })}</p>
          <p className="text-sm font-bold leading-tight">
            こんにちは、<span className="text-brand-orange">{firstName}</span>さん
          </p>
        </div>
      </header>

      <div className="px-4 sm:px-6 md:px-10 pt-4 pb-20 md:pb-10 space-y-4">

        {/* カウントダウン */}
        {profile.birthDate && (
          <section className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Hourglass size={14} className="text-brand-orange" />
                <span className="text-sm font-medium text-white/70">寿命カウントダウン</span>
                {!showCountdown && (
                  <span className="text-xs text-white/40 tabular-nums">
                    健康 <span className="text-brand-orange font-semibold">{countdown.healthy.years}</span>年
                    <span className="mx-1 text-white/20">/</span>
                    平均 <span className="text-blue-400/70 font-semibold">{countdown.total.years}</span>年
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowCountdown((v) => !v)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
              >
                {showCountdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showCountdown && (
              <div className="px-5 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* 健康寿命 */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Hourglass size={11} className="text-brand-orange" />
                      <span className="text-xs font-medium text-brand-orange/90">健康寿命</span>
                      <span className="text-xs text-white/30 ml-auto">{profile.healthyLifeExpectancy}歳</span>
                    </div>
                    <div className="flex items-baseline gap-0.5 flex-wrap">
                      <span className="text-3xl font-bold text-white tabular-nums leading-none">{countdown.healthy.years}</span>
                      <span className="text-xs text-white/40 mr-1.5">年</span>
                      <span className="text-3xl font-bold text-white tabular-nums leading-none">{countdown.healthy.months}</span>
                      <span className="text-xs text-white/40 mr-1.5">ヶ月</span>
                    </div>
                    <p className="text-sm font-semibold text-white/50 tabular-nums mt-0.5">
                      {fmtNum(countdown.healthy.days)}<span className="text-xs font-normal text-white/30 ml-0.5">日</span>
                    </p>
                  </div>
                  {/* 平均寿命 */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Hourglass size={11} className="text-blue-400/70" />
                      <span className="text-xs font-medium text-blue-400/70">平均寿命</span>
                      <span className="text-xs text-white/30 ml-auto">{profile.totalLifeExpectancy}歳</span>
                    </div>
                    <div className="flex items-baseline gap-0.5 flex-wrap">
                      <span className="text-3xl font-bold text-white/60 tabular-nums leading-none">{countdown.total.years}</span>
                      <span className="text-xs text-white/30 mr-1.5">年</span>
                      <span className="text-3xl font-bold text-white/60 tabular-nums leading-none">{countdown.total.months}</span>
                      <span className="text-xs text-white/30 mr-1.5">ヶ月</span>
                    </div>
                    <p className="text-sm font-semibold text-white/35 tabular-nums mt-0.5">
                      {fmtNum(countdown.total.days)}<span className="text-xs font-normal text-white/25 ml-0.5">日</span>
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-orange to-amber-400 rounded-full transition-all"
                      style={{ width: `${countdown.healthy.progressPct}%` }} />
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500/60 to-blue-400/40 rounded-full transition-all"
                      style={{ width: `${countdown.total.progressPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-white/20 pt-0.5">
                    <span>0歳</span>
                    <span className="text-white/40">{age}歳（現在）</span>
                    <span>{profile.totalLifeExpectancy}歳</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* エラーバナー */}
        {addError && (
          <div className="rounded-2xl bg-red-400/10 border border-red-400/30 px-4 py-3 flex items-start gap-3">
            <span className="text-red-400 text-lg shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-400 mb-0.5">夢の保存に失敗しました</p>
              <p className="text-xs text-red-300/70 leading-relaxed">{addError}</p>
              <p className="text-xs text-white/30 mt-1">
                Supabase SQL Editor で以下を実行してください：
              </p>
              <pre className="text-xs text-white/40 bg-white/5 rounded-lg px-3 py-2 mt-1 overflow-x-auto whitespace-pre-wrap break-all">{`ALTER TABLE bucket_items ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bucket_items ADD COLUMN IF NOT EXISTS companions TEXT NOT NULL DEFAULT '';
ALTER TABLE bucket_items ADD COLUMN IF NOT EXISTS desire_level INTEGER NOT NULL DEFAULT 3;`}</pre>
            </div>
            <button onClick={clearError} className="text-white/30 hover:text-white text-lg leading-none shrink-0">×</button>
          </div>
        )}

        {/* タイムライン */}
        <TimelineSection
          age={age}
          totalLife={profile.totalLifeExpectancy}
          birthDate={profile.birthDate}
          items={items}
          onEdit={openEdit}
          onDelete={requestDelete}
        />

        {/* 達成状況 + フィルター + リスト */}
        <section className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ListChecks size={14} className="text-brand-orange" />
              <span className="text-sm font-medium text-white/70">夢リスト</span>
              <span className="text-xs text-brand-orange font-semibold tabular-nums">
                {totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%
              </span>
              {!showStats && (
                <span className="text-xs text-white/30 tabular-nums">
                  · {totalCount}件中{doneCount}件達成
                </span>
              )}
            </div>
            <button
              onClick={() => setShowStats((v) => !v)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
            >
              {showStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showStats && (
            <>
              {/* 統計 */}
              <div className="px-4 pb-3 space-y-3 border-t border-white/8 pt-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/5 border border-white/8 p-3 text-center">
                    <ListChecks size={13} className="text-white/30 mx-auto mb-1" />
                    <p className="text-xl font-bold text-white tabular-nums">{totalCount}</p>
                    <p className="text-xs text-white/40 mt-0.5">総数</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/8 p-3 text-center">
                    <CheckCircle2 size={13} className="text-brand-orange mx-auto mb-1" />
                    <p className="text-xl font-bold text-white tabular-nums">{doneCount}</p>
                    <p className="text-xs text-white/40 mt-0.5">達成済み</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/8 p-3 text-center">
                    <AlertCircle size={13} className="text-red-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-white tabular-nums">{countByPriority('urgent')}</p>
                    <p className="text-xs text-white/40 mt-0.5">今すぐ！</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-orange to-amber-400 rounded-full transition-all duration-700"
                        style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white tabular-nums shrink-0">
                    {totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}
                    <span className="text-xs font-normal text-white/40">%</span>
                  </p>
                </div>
              </div>

              {/* フィルター */}
              <div className="px-4 py-2.5 flex flex-wrap items-center gap-1.5 border-t border-white/8">
                <Filter size={13} className="text-white/30 shrink-0" />
                {filterOptions.map(({ key, label }) => {
                  const count = key === 'all'
                    ? items.filter((i) => !i.done).length
                    : key === 'done'
                      ? doneCount
                      : countByPriority(key as Priority)
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={clsx(
                        'text-xs font-medium px-3 py-1.5 rounded-full transition-all',
                        filter === key
                          ? 'bg-brand-orange text-white'
                          : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10',
                      )}
                    >
                      {label}
                      <span className="ml-1 opacity-60">({count})</span>
                    </button>
                  )
                })}
              </div>

              {/* リスト */}
              <div className="p-3 border-t border-white/8 grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.length === 0 ? (
                  <div className="text-center py-10 col-span-full">
                    <p className="text-white/30 text-sm mb-4">
                      {filter === 'done'
                        ? 'まだ達成した夢がありません。さあ、行動しよう！'
                        : 'このカテゴリには夢がありません'}
                    </p>
                    {filter !== 'done' && (
                      <button
                        onClick={openAdd}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-white/10 hover:bg-white/15 transition-all border border-white/10"
                      >
                        <Plus size={14} />
                        夢を追加する
                      </button>
                    )}
                  </div>
                ) : (
                  filtered.map((item) => (
                    <BucketCard
                      key={item.id}
                      item={item}
                      currentAge={age}
                      birthDate={profile.birthDate}
                      onToggle={() => handleToggle(item)}
                      onEdit={openEdit}
                      onDelete={requestDelete}
                      confirmingDelete={deleteState?.id === item.id}
                      onConfirmDelete={confirmDelete}
                      onCancelDelete={cancelDelete}
                      onUpdateMemo={updateCompletionMemo}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </section>

        {/* 達成済み一覧 */}
        {items.some((i) => i.done) && (
          <section className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <button
              onClick={() => setShowDoneList((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-all"
            >
              <span className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Trophy size={14} className="text-brand-orange" />
                達成した夢
                <span className="text-xs text-white/30 bg-white/10 px-2 py-0.5 rounded-full">
                  {items.filter((i) => i.done).length}件
                </span>
              </span>
              {showDoneList
                ? <ChevronUp size={14} className="text-white/30" />
                : <ChevronDown size={14} className="text-white/30" />
              }
            </button>

            {showDoneList && (
              <div className="px-4 pb-4 space-y-2">
                {items.filter((i) => i.done).map((item) => (
                  <div key={item.id} className="bg-white/5 rounded-xl px-4 py-3 flex items-start gap-3">
                    <button
                      onClick={() => handleToggle(item)}
                      className="shrink-0 mt-0.5"
                      aria-label="未完了に戻す"
                    >
                      <CheckCircle2 size={20} className="text-brand-orange" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none">{item.emoji}</span>
                        <p className="text-sm text-white/50 line-through truncate">{item.title}</p>
                      </div>
                      <MemoEditor
                        memo={item.completionMemo}
                        onSave={(m) => updateCompletionMemo(item.id, m)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {/* FAB — モバイル */}
      <button
        onClick={openAdd}
        className={clsx(
          'fixed bottom-6 right-4',
          'w-14 h-14 rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-brand-orange to-amber-400 text-white',
          'shadow-[0_6px_24px_rgba(249,115,22,0.4)]',
          'hover:brightness-110 active:scale-95 transition-all duration-200',
        )}
        aria-label="夢を追加"
      >
        <Plus size={24} />
      </button>

      {modalMode && (
        <BucketItemModal
          initial={modalMode === 'edit' && editingItem ? editingItem : undefined}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {completingItem && (
        <CompletionModal
          item={completingItem}
          onSave={handleCompletionSave}
          onClose={() => setCompletingItem(null)}
        />
      )}

      {restoringItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-brand-slate rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <p className="text-lg font-bold text-white mb-1">達成を取り消しますか？</p>
            <p className="text-sm text-white/50 mb-6">
              「{restoringItem.emoji} {restoringItem.title}」を未完了に戻します。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRestoringItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/70 text-sm hover:bg-white/5 transition"
              >
                キャンセル
              </button>
              <button
                onClick={confirmRestore}
                className="flex-1 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:brightness-110 transition"
              >
                未完了に戻す
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
