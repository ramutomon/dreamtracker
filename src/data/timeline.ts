export type ActivityPhase = {
  id: string
  label: string
  emoji: string
  startAge: number
  endAge: number
  color: string
  bgColor: string
  description: string
}

export const ACTIVITY_PHASES: ActivityPhase[] = [
  // === 設計書で定義された 4 種のコアアクティビティ寿命 ===
  {
    id: 'adventure',
    label: 'ハードな旅行',
    emoji: '🧗',
    startAge: 20,
    endAge: 45,           // 仕様: ハードな旅行寿命〜45歳
    color: '#F97316',
    bgColor: 'rgba(249,115,22,0.15)',
    description: '登山・バックパック・極地探検など体力を要するハードな旅',
  },
  {
    id: 'gourmet',
    label: 'グルメ・食体験',
    emoji: '🍽️',
    startAge: 25,
    endAge: 60,           // 仕様: グルメ寿命〜60歳
    color: '#A78BFA',
    bgColor: 'rgba(167,139,250,0.15)',
    description: 'ミシュランレストラン・世界の食文化体験（味覚は60代から鈍化）',
  },
  {
    id: 'sports',
    label: 'アクティブスポーツ',
    emoji: '🏄',
    startAge: 18,
    endAge: 65,           // 仕様: アクティブスポーツ寿命〜65歳
    color: '#34D399',
    bgColor: 'rgba(52,211,153,0.15)',
    description: 'サーフィン・スキー・マラソンなど激しい運動を伴うスポーツ',
  },
  {
    id: 'travel',
    label: '一般的な旅行',
    emoji: '✈️',
    startAge: 22,
    endAge: 75,           // 仕様: 一般的な旅行寿命〜75歳
    color: '#38BDF8',
    bgColor: 'rgba(56,189,248,0.15)',
    description: '海外旅行・長距離移動を伴う旅（体力的な上限）',
  },
  // === 追加フェーズ ===
  {
    id: 'culture',
    label: '文化・学習旅行',
    emoji: '🎭',
    startAge: 20,
    endAge: 85,
    color: '#FBBF24',
    bgColor: 'rgba(251,191,36,0.15)',
    description: '美術館・音楽祭・語学留学など知的体験（年齢制約が少ない）',
  },
  {
    id: 'luxury',
    label: 'ラグジュアリー体験',
    emoji: '💎',
    startAge: 30,
    endAge: 80,
    color: '#F472B6',
    bgColor: 'rgba(244,114,182,0.15)',
    description: '高級リゾート・クルーズ・プライベートジェットなど',
  },
]

export const CURRENT_AGE = 42
export const TOTAL_LIFE = 85
