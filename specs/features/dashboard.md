---
status: done
created: 2026-05-20
updated: 2026-05-21
---

# ダッシュボード

## 概要

アプリのホーム画面。ユーザーの「残り健康寿命」「今年の体験予算の消化状況」「今すぐやるべきバケットリスト」を一覧で把握できる。訪れるたびに「今日も行動しよう」という気持ちになれる設計。

## 要件

- [x] 今日の日付とウェルカムメッセージをヘッダーに表示する
- [x] 健康寿命カウントダウンを「残り〇年〇ヶ月〇日」形式で大きく表示する
- [x] ライフプログレスバーで「生まれてから今まで」vs「今から健康寿命まで」を可視化する
- [x] 体験予算ゲージ（達成済み予算合計 / 設定予算）を表示する
- [x] バケットリストのハイライト（priority 順に最大3件の未完了アイテム）を表示する

## 受け入れ基準

- プロフィール未設定の場合、デフォルト値でカウントダウンが動く
- カウントダウンは日付をまたぐと自動更新される（date-fns で毎レンダリング計算）
- 体験予算ゲージの spent は「達成済みバケットアイテムの budget 合計」から自動算出される（手動入力不要）
- ハイライトカードをクリックすると `/bucket-list` に遷移する
- 残り時間の表現は「〜しかない」ではなく「まだ〜ある」という肯定形にする

## カスタムフック

| フック | 返り値 | 処理 |
|---|---|---|
| `useCountdown(birthDate, healthyLifeExpectancy)` | `{ years, months, days, progressPct }` | date-fns で健康寿命日付まで差分計算 |
| `useBudget(experienceBudget)` | `{ pct, remaining, daysLeft, spent, total }` | localStorage の達成済みアイテム予算合計を spent として算出 |
| `useBucketHighlights(age)` | `BucketItem[]` (最大3件) | localStorage からロードし priority でソート |

## 関連ファイル

- `src/pages/Dashboard.tsx`
- `src/context/UserContext.tsx`
- `src/context/BucketListContext.tsx`
- `src/utils/lifeExpectancy.ts`
