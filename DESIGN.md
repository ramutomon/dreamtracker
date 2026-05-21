# Zero2Die — 設計書

**バージョン**: 1.2.0 (MVP)
**作成日**: 2026-05-20
**最終更新**: 2026-05-20
**ステータス**: MVP フロントエンド実装完了

---

## 1. プロダクト概要

### コンセプト

> 「お金を残して死ぬのは、人生を使い切れなかった証拠だ」

ユーザーが年齢・健康状態・資産を総合的に把握し、**「死ぬ時に資産ゼロ」** という目標に向けて経験に最適投資するためのライフデザインアプリ。貯蓄の最大化ではなく、**人生満足度の最大化** を支援する。

### ターゲットユーザー

| 属性 | 内容 |
|---|---|
| 年齢層 | 35〜60歳 |
| 特徴 | ある程度の資産を持ち「このまま貯め続けていいのか」と感じている層 |
| 課題 | やりたいことを先送りしてしまう・いくら使っていいか分からない |
| ゴール | 健康なうちに体験を積み上げ、後悔のない人生を送る |

---

## 2. 技術スタック

| カテゴリ | 採用技術 | バージョン | 選定理由 |
|---|---|---|---|
| フレームワーク | **Vite** + **React** | Vite 6.x / React 19.x | 高速 HMR、最新 React 機能対応 |
| 言語 | **TypeScript** | ~5.8 | 型安全・補完・リファクタリング容易性 |
| スタイリング | **Tailwind CSS** | 3.4.x | ユーティリティファースト、デザイントークン管理 |
| UI コンポーネント | **独自 Tailwind 実装** | — | MVP では軽量な独自実装を採用。Phase 2 以降で shadcn/ui 移行を検討 |
| ルーティング | **React Router** | 7.x | SPA ナビゲーション |
| グラフ | **Recharts** | 2.x | React ネイティブ、カスタマイズ性 |
| アイコン | **lucide-react** | 0.5x | 軽量・一貫したラインアイコン |
| ユーティリティ | **clsx** | 2.x | 条件付きクラス名の安全な結合 |
| 日付処理 | **date-fns** | 4.x | 軽量・ツリーシェイク対応 |

### 開発コマンド

```bash
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # 本番ビルド
npm run preview  # ビルドプレビュー
```

---

## 3. ディレクトリ構成

```
zero2die/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── Layout.tsx           # 共通レイアウト (サイドバー / ボトムナビ)
    │   ├── ProfileModal.tsx     # プロフィール設定モーダル
    │   └── BucketItemModal.tsx  # バケットリスト 追加 / 編集 モーダル
    ├── context/
    │   └── UserContext.tsx      # ユーザープロフィール・localStorage 永続化
    ├── pages/
    │   ├── Dashboard.tsx        # ホーム画面
    │   ├── Timeline.tsx         # タイムライン画面
    │   └── BucketList.tsx       # バケットリスト画面 (CRUD)
    ├── data/
    │   ├── user.ts              # ハイライトダミーデータ（廃止予定）
    │   ├── timeline.ts          # アクティビティフェーズ定義
    │   └── bucketList.ts        # やりたいことリスト（デフォルトデータ）
    └── utils/
        ├── suggest.ts           # 動的 priority / urgency 計算
        └── lifeExpectancy.ts    # 健康寿命自動算出ロジック
```

---

## 4. ルーティング設計

```
/                 → /dashboard (リダイレクト)
/dashboard        → Dashboard.tsx   ホーム画面
/timeline         → Timeline.tsx    タイムライン
/bucket-list      → BucketList.tsx  バケットリスト
```

すべてのページは `Layout.tsx` (Outlet) でラップされ、ナビゲーションを共有する。

---

## 5. デザインシステム

### 5.1 カラーパレット

| トークン | HEX | 用途 |
|---|---|---|
| `brand.orange` | `#F97316` | プライマリ・アクセント・CTA |
| `brand.amber` | `#FB923C` | セカンダリ・グラデーション終点 |
| `brand.navy` | `#0F172A` | ページ背景ベース |
| `brand.slate` | `#1E293B` | カード背景・サイドバー |
| `brand.muted` | `#334155` | 区切り・サブ要素 |
| `white/5〜40` | — | glass-morphism カード・テキスト階層 |
| `red-400` | `#F87171` | urgent バッジ・警告 |
| `amber-400` | `#FBBF24` | soon バッジ・注意 |
| `sky-400` | `#38BDF8` | someday バッジ・情報 |

### 5.2 背景グラデーション

```css
/* hero-gradient — 全ページ背景 */
background: linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1C1917 100%);
```

### 5.3 タイポグラフィ

| 用途 | フォント | 備考 |
|---|---|---|
| 欧文 | **Inter** | 数値・UI テキスト |
| 和文 | **Noto Sans JP** | 日本語混在対応 |

### 5.4 共通カードスタイル

```
rounded-2xl  bg-white/5  border border-white/10
```

### 5.5 デザインのトーン＆マナー

**基本方針**: 「あと〇年でできなくなる」という事実を *ネガティブな警告* として見せず、「だからこそ今年やろう！」という **ポジティブな行動喚起** に変換する。

| 原則 | 実装方針 |
|---|---|
| 肯定的な残り時間表現 | 「残り〇〇日しかない」ではなく「あなたにはまだ〇〇日ある」と表現 |
| 鮮やかなカラー | 夕焼けオレンジ × ディープネイビーで生命力・躍動感を演出 |
| スムーズなアニメーション | プログレスバー・グラフは `transition-all duration-700〜1000` で滑らかに描画 |
| 数値の大きな表示 | カウントダウンや残り年数は `text-5xl font-bold` で主役にする |
| 達成感の演出 | バケットリストの完了時にチェックアイコンをオレンジで強調表示 |

---

## 6. コンポーネント設計

### 6.1 Layout.tsx

```
Layout
├── <aside>        サイドバー (md 以上)
│   ├── ブランドロゴ
│   ├── NavLink × 3  (Dashboard / Timeline / BucketList)
│   └── 設定ボタン (プロフィール名表示)
├── <main>         <Outlet />
└── <nav>          ボトムナビ (モバイルのみ)
```

### 6.2 Dashboard.tsx

**カスタムフック**:

| フック | 返り値 | 処理内容 |
|---|---|---|
| `useCountdown(birthDate, healthyLifeExpectancy)` | `{ years, months, days, progressPct }` | 健康寿命日付まで date-fns で差分計算 |
| `useBudget(experienceBudget)` | `{ pct, remaining, daysLeft, spent, total }` | localStorage の達成済みアイテム予算合計を spent として算出 |
| `useBucketHighlights(age)` | `BucketItem[]` (最大3件) | localStorage からロードし priority でソート |

**セクション構成**:
1. Header — 日付・ウェルカム文
2. 健康寿命カウントダウンカード — 残り年/月/日 + ライフプログレスバー
3. 経験予算ゲージ — 達成済みバケットアイテム予算合計 / 設定予算
4. ハイライトカード — BucketList の未完了アイテムを priority 順に最大3件表示

### 6.3 Timeline.tsx

**アクティビティ寿命（コア4種）**:

| アクティビティ | ピーク終了年齢 |
|---|---|
| ハードな旅行 | **45歳** |
| グルメ・食体験 | **60歳** |
| アクティブスポーツ | **65歳** |
| 一般的な旅行 | **75歳** |

### 6.4 BucketList.tsx

**状態管理**:
- `items` — localStorage (`z2d_bucket_list`) に永続化。初回は `BUCKET_LIST` デフォルトデータ
- `filter` — `all` / `urgent` / `soon` / `someday` / `done`
- `modalMode` — `add` / `edit` / `null`
- `deleteState` — インライン削除確認（4秒タイマー付き自動キャンセル）

**CRUD**:
- **追加**: FAB（モバイル）/ ヘッダーボタン（PC）→ `BucketItemModal`
- **編集**: カード右上の Pencil アイコン → `BucketItemModal`（初期値入力済み）
- **削除**: Trash2 アイコン → カード内確認バナー → 確定削除

**priority の自動判定**:
```ts
yearsUntilActivityEnd <= 3   → 'urgent'
yearsUntilActivityEnd <= 10  → 'soon'
deadline <= 365 days         → 'urgent'
deadline <= 1095 days        → 'soon'
else                         → 'someday'
```

### 6.5 ProfileModal.tsx

**セクション構成**:
1. **基本情報** — ニックネーム・生年月日（現在年齢プレビュー付き）
2. **健康プロフィール** — 性別・喫煙・運動習慣・健康診断（寿命自動計算の入力）
3. **寿命設定** — 健康寿命 / 総寿命（手動上書き可・計算値に戻すボタン）
4. **体験予算** — 今年の年間体験予算（ダッシュボード予算ゲージに反映）

---

## 7. データモデル

### 7.1 ユーザープロフィール (`context/UserContext.tsx`)

```ts
UserProfile = {
  nickname:              string
  birthDate:             string        // YYYY-MM-DD
  gender:                Gender        // 'male' | 'female' | 'other'
  smoking:               boolean
  exerciseLevel:         ExerciseLevel // 'regular' | 'occasional' | 'none'
  healthStatus:          HealthStatus  // 'good' | 'normal' | 'concern'
  healthyLifeExpectancy: number
  totalLifeExpectancy:   number
  experienceBudget:      number        // 今年の体験予算（円）
}
```

localStorage キー: `z2d_profile`

### 7.2 アクティビティフェーズ (`data/timeline.ts`)

```ts
ActivityPhase = {
  id: string; label: string; emoji: string
  startAge: number; endAge: number
  color: string; bgColor: string; description: string
}
```

### 7.3 バケットアイテム (`data/bucketList.ts`)

```ts
BucketItem = {
  id: number; title: string; category: string; emoji: string
  budget: number; deadline: string   // ISO date
  activityPhaseId: string            // ActivityPhase.id と対応
  suggestReason: string
  done: boolean
  // priority は calcPriority() で動的算出（永続化しない）
}
```

localStorage キー: `z2d_bucket_list`

---

## 8. 画面仕様サマリー

| 画面 | パス | 主要コンポーネント |
|---|---|---|
| ダッシュボード | `/dashboard` | カウントダウン・予算ゲージ・BucketList ハイライト |
| タイムライン | `/timeline` | フェーズバーチャート・詳細パネル |
| バケットリスト | `/bucket-list` | CRUD・フィルター・サジェストバッジ |

---

## 9. 今後の実装ロードマップ

### Phase 2 — データ永続化

- [ ] **ユーザー認証**: Supabase Auth (Google / Apple サインイン)
- [ ] **DB**: Supabase PostgreSQL
  - `users` テーブル (プロフィール・設定)
  - `bucket_items` テーブル
  - `experience_budgets` テーブル (年度別)

### Phase 3 — インテリジェント機能

- [ ] **サジェストエンジン**: 年齢・健康状態・残予算からバケットリストの最適実行順序を提案
- [ ] **体験予算の年度管理**: 月次消費トラッキング・グラフ可視化
- [ ] **アクティビティ寿命の個人化**: 健康診断データ連携による個人別フェーズ調整

### Phase 4 — エンゲージメント

- [ ] **プッシュ通知**: 期限が近いバケットアイテムのリマインダー
- [ ] **年次レビュー**: 「今年やり切ったこと」振り返りレポート生成
- [ ] **シェア機能**: バケットリスト達成カードのソーシャル共有

---

## 10. 設計上の判断・トレードオフ

| 決定事項 | 選択 | 却下候補 | 理由 |
|---|---|---|---|
| ビルドツール | Vite | CRA, Next.js | SSR 不要な SPA。Vite の起動速度を優先 |
| スタイリング | Tailwind CSS | CSS Modules | ユーティリティクラスによる高速な UI 構築 |
| 状態管理 | useState + Context + localStorage | Redux, Supabase | MVP スコープでは軽量な実装を優先 |
| priority 算出 | 動的計算（calcPriority） | 永続化フィールド | 年齢が変わると priority も変わるため毎回算出が正確 |
| 体験予算の spent 算出 | 達成済みアイテムの予算合計 | 手動入力 | バケットリストと自然に連動。追加入力不要 |
| タイムラインのグラフ | カスタム CSS バー | Recharts GanttChart | Recharts にガントチャートがないため自前実装 |

---

*このドキュメントは実装の変更に合わせて随時更新すること。*
