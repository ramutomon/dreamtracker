---
status: done
created: 2026-05-20
updated: 2026-05-21
---

# データモデル定義

## UserProfile

localStorage キー: `z2d_profile`

```ts
type Gender = 'male' | 'female' | 'other'
type ExerciseLevel = 'regular' | 'occasional' | 'none'
type HealthStatus = 'good' | 'normal' | 'concern'

interface UserProfile {
  nickname:              string
  birthDate:             string        // YYYY-MM-DD
  gender:                Gender
  smoking:               boolean
  exerciseLevel:         ExerciseLevel
  healthStatus:          HealthStatus
  healthyLifeExpectancy: number        // 年齢（歳）
  totalLifeExpectancy:   number        // 年齢（歳）
  experienceBudget:      number        // 今年の体験予算（円）
}
```

管理場所: `src/context/UserContext.tsx`

---

## BucketItem

localStorage キー: `z2d_bucket_list`

```ts
type Priority = 'urgent' | 'soon' | 'someday'

interface BucketItem {
  id:              number
  title:           string
  category:        string
  emoji:           string
  budget:          number        // 円
  deadline:        string        // ISO date (YYYY-MM-DD)
  activityPhaseId: string        // ActivityPhase.id と対応
  suggestReason:   string
  done:            boolean
  // priority は calcPriority() で動的算出。永続化しない。
}
```

- `priority` は `src/utils/suggest.ts` の `calcPriority()` で毎回計算する
- デフォルトデータ: `src/data/bucketList.ts` の `BUCKET_LIST` 定数
- 管理場所: `src/context/BucketListContext.tsx`

---

## ActivityPhase

静的定義（ユーザー変更不可）。`src/data/timeline.ts` で管理。

```ts
interface ActivityPhase {
  id:          string
  label:       string
  emoji:       string
  startAge:    number
  endAge:      number        // ピーク終了年齢
  color:       string        // Tailwind text-* クラス
  bgColor:     string        // Tailwind bg-* クラス
  description: string
}
```

### コア4フェーズ

| id | label | endAge |
|---|---|---|
| `hard-travel` | ハードな旅行 | 45 |
| `gourmet` | グルメ・食体験 | 60 |
| `active-sports` | アクティブスポーツ | 65 |
| `general-travel` | 一般的な旅行 | 75 |

---

## 設計判断

- `priority` を永続化しない理由: 年齢が変わると priority も変わる。毎回算出することで常に正確な値を保てる。
- `experienceBudget` の spent は手動入力ではなく、`done === true` のアイテムの `budget` 合計から自動算出する（バケットリストと自然に連動）。
