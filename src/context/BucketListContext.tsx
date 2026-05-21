import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react'
import { supabase, type BucketItemRow } from '../lib/supabase'
import type { BucketItem } from '../data/bucketList'
import type { BucketFormData } from '../components/BucketItemModal'
import { useUser } from './UserContext'

type BucketListContextValue = {
  items:               BucketItem[]
  loading:             boolean
  addError:            string | null
  clearError:          () => void
  addItem:             (data: BucketFormData) => Promise<void>
  editItem:            (id: number, data: BucketFormData) => Promise<void>
  toggleDone:          (id: number, completionMemo?: string) => void
  updateCompletionMemo:(id: number, memo: string) => void
  deleteItem:          (id: number) => void
}

const BucketListContext = createContext<BucketListContextValue | null>(null)

function rowToItem(row: BucketItemRow): BucketItem {
  return {
    id:              row.id,
    title:           row.title,
    category:        row.category,
    emoji:           row.emoji,
    budget:          row.budget,
    deadline:        row.deadline ?? '',
    durationDays:    row.duration_days   ?? 0,
    companions:      row.companions       ?? '',
    desireLevel:     row.desire_level    ?? 3,
    activityPhaseId: row.activity_phase_id,
    suggestReason:   row.suggest_reason  ?? '',
    completionMemo:  row.completion_memo ?? '',
    done:            row.done,
  }
}

export function BucketListProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [items,    setItems]    = useState<BucketItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [addError, setAddError] = useState<string | null>(null)

  const clearError = useCallback(() => setAddError(null), [])

  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); return }
    setLoading(true)
    supabase
      .from('bucket_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setItems((data as BucketItemRow[]).map(rowToItem))
        setLoading(false)
      })
  }, [user?.id])

  const addItem = useCallback(async (data: BucketFormData) => {
    if (!user) return
    const tempId   = -Date.now()
    const tempItem: BucketItem = { ...data, id: tempId, done: false }
    setItems((prev) => [tempItem, ...prev])
    setAddError(null)

    // 必須フィールドのみで insert し、新規カラムは存在する場合のみ送る
    const payload: Record<string, unknown> = {
      user_id:           user.id,
      title:             data.title,
      category:          data.category,
      emoji:             data.emoji,
      budget:            data.budget,
      deadline:          data.deadline || null,
      duration_days:     data.durationDays,
      activity_phase_id: data.activityPhaseId,
      suggest_reason:    data.suggestReason,
      done:              false,
    }
    // companions / desire_level は DB に列がなければエラーになるため try
    payload.companions      = data.companions
    payload.desire_level    = data.desireLevel
    payload.completion_memo = data.completionMemo ?? ''

    const { data: inserted, error } = await supabase
      .from('bucket_items')
      .insert(payload)
      .select()
      .single()

    if (error || !inserted) {
      const msg = error?.message ?? 'unknown error'
      console.error('addItem failed:', msg)
      // 新規列がなければフォールバック（duration_days / companions / desire_level）
      if (msg.includes('companions') || msg.includes('desire_level') || msg.includes('duration_days') || msg.includes('completion_memo')) {
        delete payload.companions
        delete payload.desire_level
        delete payload.duration_days
        delete payload.completion_memo
        const { data: inserted2, error: error2 } = await supabase
          .from('bucket_items')
          .insert(payload)
          .select()
          .single()
        if (error2 || !inserted2) {
          setAddError(`保存に失敗しました: ${error2?.message ?? msg}`)
          setItems((prev) => prev.filter((i) => i.id !== tempId))
        } else {
          setItems((prev) =>
            prev.map((i) => i.id === tempId ? rowToItem(inserted2 as BucketItemRow) : i)
          )
        }
      } else {
        setAddError(`保存に失敗しました: ${msg}`)
        setItems((prev) => prev.filter((i) => i.id !== tempId))
      }
    } else {
      setItems((prev) =>
        prev.map((i) => i.id === tempId ? rowToItem(inserted as BucketItemRow) : i)
      )
    }
  }, [user])

  const editItem = useCallback(async (id: number, data: BucketFormData) => {
    if (!user) return
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...data } : i))
    const { error } = await supabase
      .from('bucket_items')
      .update({
        title:             data.title,
        category:          data.category,
        emoji:             data.emoji,
        budget:            data.budget,
        deadline:          data.deadline || null,
        duration_days:     data.durationDays,
        companions:        data.companions,
        desire_level:      data.desireLevel,
        activity_phase_id: data.activityPhaseId,
        suggest_reason:    data.suggestReason,
      })
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) console.error('editItem failed:', error.message)
  }, [user])

  const toggleDone = useCallback((id: number, completionMemo?: string) => {
    if (!user) return
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (!item) return prev
      const newDone   = !item.done
      const updatePayload: Record<string, unknown> = { done: newDone }
      if (newDone && completionMemo !== undefined) updatePayload.completion_memo = completionMemo
      supabase.from('bucket_items')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) setItems((p) => p.map((i) => i.id === id ? { ...i, done: !newDone } : i))
        })
      return prev.map((i) =>
        i.id === id
          ? { ...i, done: newDone, completionMemo: newDone && completionMemo !== undefined ? completionMemo : i.completionMemo }
          : i
      )
    })
  }, [user])

  const updateCompletionMemo = useCallback((id: number, memo: string) => {
    if (!user) return
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, completionMemo: memo } : i))
    supabase.from('bucket_items')
      .update({ completion_memo: memo })
      .eq('id', id)
      .eq('user_id', user.id)
      .then(({ error }) => { if (error) console.error('updateCompletionMemo failed:', error.message) })
  }, [user])

  const deleteItem = useCallback((id: number) => {
    if (!user) return
    setItems((prev) => prev.filter((i) => i.id !== id))
    supabase.from('bucket_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .then(({ error }) => { if (error) console.error('deleteItem failed:', error.message) })
  }, [user])

  return (
    <BucketListContext.Provider value={{ items, loading, addError, clearError, addItem, editItem, toggleDone, updateCompletionMemo, deleteItem }}>
      {children}
    </BucketListContext.Provider>
  )
}

export function useBucketList(): BucketListContextValue {
  const ctx = useContext(BucketListContext)
  if (!ctx) throw new Error('useBucketList must be used inside <BucketListProvider>')
  return ctx
}
