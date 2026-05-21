# Zero2Die — Claude Code ガイド

## スペック駆動開発ワークフロー

このプロジェクトは **スペック駆動開発** を採用している。
**仕様書 (specs/) が唯一の真実の源** であり、実装はすべて仕様書に基づいて行う。

### 基本原則

1. **仕様書ファースト** — 新機能・変更はコードを書く前に必ず `specs/` に仕様を書く
2. **仕様書が現実を反映する** — 実装後は仕様書を最新状態に更新する
3. **Claude への指示は仕様書を参照する** — "specs/features/dashboard.md を実装して" のように明示する

### ディレクトリ構成

```
specs/
  README.md              # スペックの書き方・テンプレート
  features/              # 画面・機能ごとの仕様書
    dashboard.md
    timeline.md
    bucket-list.md
    profile.md
  data/
    models.md            # データモデル定義
  design/
    system.md            # デザインシステム（カラー・タイポ・コンポーネント）
  roadmap/
    phase-2-auth.md      # Phase 2: 認証・DB
    phase-3-intelligence.md  # Phase 3: インテリジェント機能
```

### 新機能を追加するとき

```
1. specs/features/<feature>.md を作成 (status: draft)
2. 仕様をレビュー・確定 (status: ready)
3. "specs/features/<feature>.md を実装して" と Claude に依頼
4. 実装完了後、仕様書を更新 (status: done)
```

### 既存機能を変更するとき

```
1. 該当する specs/ ファイルを先に更新
2. 変更内容を Claude に説明して実装依頼
```

---

## プロジェクト概要

「死ぬ時に資産ゼロ」を目標に、ユーザーが健康寿命と資産を把握して経験に最適投資するライフデザインアプリ。

- **フレームワーク**: React 19 + Vite 6 + TypeScript
- **スタイリング**: Tailwind CSS 3.4
- **状態管理**: useState + Context + localStorage
- **バックエンド**: Supabase (Phase 2 以降)

## 技術コンテキスト

- ルーティング: React Router v7 (`/dashboard`, `/timeline`, `/bucket-list`)
- データ永続化: localStorage (`z2d_profile`, `z2d_bucket_list`)
- priority は `calcPriority()` で動的算出（永続化しない）
- デザイントークン: `brand.orange (#F97316)`, `brand.navy (#0F172A)`, `brand.slate (#1E293B)`

## 開発コマンド

```bash
npm run dev      # 開発サーバー (localhost:5173)
npm run build    # 本番ビルド
npm run preview  # ビルドプレビュー
```
