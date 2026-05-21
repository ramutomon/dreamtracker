export type BucketItem = {
  id: number
  title: string
  category: string
  emoji: string
  budget: number
  deadline: string           // ISO date — ユーザー設定期限
  durationDays: number       // 所要日数（0 = 未設定）
  companions: string         // 誰と（例: 一人で / 家族と）
  desireLevel: number        // やりたい度 1〜5（デフォルト 3）
  activityPhaseId: string    // timeline.ts の ActivityPhase.id と対応
  suggestReason: string      // メモ・やりたい理由
  completionMemo: string     // 達成時の感想メモ
  done: boolean
  // priority は src/utils/suggest.ts の calcPriority() で動的に算出
}

export const BUCKET_LIST: BucketItem[] = [
  {
    id: 1,
    title: 'アイスランドでオーロラを見る',
    category: '旅行',
    emoji: '🌌',
    budget: 500_000,
    deadline: '2028-03-01',
    durationDays: 7,
    companions: 'パートナーと',
    desireLevel: 5,
    activityPhaseId: 'adventure',
    suggestReason: 'オーロラの見頃は9〜3月。ハードな旅行寿命（45歳）前に',
    completionMemo: '',
    done: false,
  },
  {
    id: 2,
    title: 'マチュピチュ遺跡を歩く',
    category: '旅行',
    emoji: '🏔️',
    budget: 600_000,
    deadline: '2029-12-01',
    durationDays: 10,
    companions: '友人と',
    desireLevel: 4,
    activityPhaseId: 'adventure',
    suggestReason: 'インカトレイルは標高4,000m超。体力的に45歳がリミット',
    completionMemo: '',
    done: false,
  },
  {
    id: 3,
    title: '子どもと富士山に登る',
    category: 'アドベンチャー',
    emoji: '🗻',
    budget: 80_000,
    deadline: '2026-08-31',
    durationDays: 2,
    companions: '子どもと',
    desireLevel: 5,
    activityPhaseId: 'adventure',
    suggestReason: '子どもの年齢と登山シーズン（7〜9月）から今夏が最適',
    completionMemo: '',
    done: false,
  },
  {
    id: 4,
    title: 'プロのシェフに料理を習う（パリ）',
    category: 'グルメ',
    emoji: '👨‍🍳',
    budget: 400_000,
    deadline: '2027-09-01',
    durationDays: 14,
    companions: '一人で',
    desireLevel: 3,
    activityPhaseId: 'gourmet',
    suggestReason: 'パリのコルドン・ブルーは人気で先着が必要。早めの申込を',
    completionMemo: '',
    done: false,
  },
  {
    id: 5,
    title: 'スカイダイビングに挑戦',
    category: 'アドベンチャー',
    emoji: '🪂',
    budget: 60_000,
    deadline: '2026-10-01',
    durationDays: 1,
    companions: '友人と',
    desireLevel: 4,
    activityPhaseId: 'adventure',
    suggestReason: '天候が良い秋がベスト。ハードな旅行寿命（45歳）まで残り3年',
    completionMemo: '',
    done: false,
  },
  {
    id: 6,
    title: '親を温泉旅行に連れて行く',
    category: '家族',
    emoji: '♨️',
    budget: 200_000,
    deadline: '2026-12-31',
    durationDays: 2,
    companions: '家族と',
    desireLevel: 5,
    activityPhaseId: 'travel',
    suggestReason: '親の健康寿命を考慮。一緒に行ける時間は限られている',
    completionMemo: '',
    done: true,
  },
  {
    id: 7,
    title: 'ニューヨーク・ブロードウェイを観劇',
    category: '文化',
    emoji: '🎭',
    budget: 350_000,
    deadline: '2030-01-01',
    durationDays: 7,
    companions: 'パートナーと',
    desireLevel: 3,
    activityPhaseId: 'travel',
    suggestReason: '長時間フライトを伴う旅行は75歳がリミット。余裕のある今に',
    completionMemo: '',
    done: false,
  },
  {
    id: 8,
    title: '自分の本を出版する',
    category: '自己実現',
    emoji: '📚',
    budget: 0,
    deadline: '2035-01-01',
    durationDays: 0,
    companions: '一人で',
    desireLevel: 4,
    activityPhaseId: 'culture',
    suggestReason: '知識と経験が熟成される50代が執筆の黄金期',
    completionMemo: '',
    done: false,
  },
]

export const PRIORITY_CONFIG = {
  urgent:  { label: '今すぐ！',   color: 'text-red-400',   bg: 'bg-red-400/10',   border: 'border-red-400/30'   },
  soon:    { label: '近いうちに', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  someday: { label: 'いつかは',   color: 'text-sky-400',   bg: 'bg-sky-400/10',   border: 'border-sky-400/30'   },
}
