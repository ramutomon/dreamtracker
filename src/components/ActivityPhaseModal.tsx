import { useState } from 'react'
import type { ActivityPhase } from '../data/timeline'

const COLOR_PRESETS = [
  { color: '#F97316', bg: 'rgba(249,115,22,0.15)'  },
  { color: '#34D399', bg: 'rgba(52,211,153,0.15)'  },
  { color: '#38BDF8', bg: 'rgba(56,189,248,0.15)'  },
  { color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)'  },
  { color: '#F472B6', bg: 'rgba(244,114,182,0.15)' },
  { color: '#FB7185', bg: 'rgba(251,113,133,0.15)' },
  { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
]

type FormData = {
  label:       string
  emoji:       string
  startAge:    string
  endAge:      string
  description: string
  color:       string
  bgColor:     string
}

export default function ActivityPhaseModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: ActivityPhase
  onSave:  (data: Omit<ActivityPhase, 'id'>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<FormData>({
    label:       initial?.label       ?? '',
    emoji:       initial?.emoji       ?? '⭐',
    startAge:    String(initial?.startAge ?? 20),
    endAge:      String(initial?.endAge   ?? 60),
    description: initial?.description ?? '',
    color:       initial?.color   ?? COLOR_PRESETS[0].color,
    bgColor:     initial?.bgColor ?? COLOR_PRESETS[0].bg,
  })

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function selectColor(color: string, bg: string) {
    setForm((f) => ({ ...f, color, bgColor: bg }))
  }

  function handleSave() {
    const startAge = parseInt(form.startAge)
    const endAge   = parseInt(form.endAge)
    if (!form.label.trim() || isNaN(startAge) || isNaN(endAge) || startAge >= endAge) return
    onSave({
      label:       form.label.trim(),
      emoji:       form.emoji || '⭐',
      startAge,
      endAge,
      description: form.description.trim(),
      color:       form.color,
      bgColor:     form.bgColor,
    })
  }

  const isValid = form.label.trim() &&
    !isNaN(parseInt(form.startAge)) &&
    !isNaN(parseInt(form.endAge)) &&
    parseInt(form.startAge) < parseInt(form.endAge)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <p className="text-base font-bold text-white">
          {initial ? 'アクティビティ種別を編集' : '新しいアクティビティ種別'}
        </p>

        {/* プレビュー */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border-l-4 text-sm font-medium"
          style={{ backgroundColor: form.bgColor, borderColor: form.color, color: form.color }}
        >
          <span>{form.emoji}</span>
          <span>{form.label || '名前未入力'}</span>
          <span className="ml-auto text-xs opacity-70">{form.startAge}〜{form.endAge}歳</span>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="w-16">
              <label className="block text-xs text-white/40 mb-1">絵文字</label>
              <input
                type="text"
                value={form.emoji}
                onChange={(e) => set('emoji', e.target.value)}
                maxLength={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-white text-center text-lg focus:outline-none focus:border-brand-orange/60"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-white/40 mb-1">名前</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => set('label', e.target.value)}
                placeholder="例：ハードな旅行"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-orange/60"
              />
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-white/40 mb-1">開始年齢</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.startAge}
                onChange={(e) => set('startAge', e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-orange/60"
              />
            </div>
            <span className="text-white/30 text-sm mb-2">〜</span>
            <div className="flex-1">
              <label className="block text-xs text-white/40 mb-1">終了年齢</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.endAge}
                onChange={(e) => set('endAge', e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-orange/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1">説明（任意）</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="この種別の説明"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-orange/60"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-2">カラー</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => selectColor(preset.color, preset.bg)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: preset.color,
                    borderColor: form.color === preset.color ? 'white' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 text-sm hover:bg-white/5 transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
