---
status: done
created: 2026-05-20
updated: 2026-05-21
---

# バケットリスト

## 概要

「やりたいこと」を管理するCRUD画面。アイテムごとに予算・期限・アクティビティフェーズを設定でき、priority が自動計算される。フィルター機能でurgent/soon/somedayを絞り込める。

## 要件

- [x] アイテムの追加・編集・削除ができる
- [x] フィルター（all / urgent / soon / someday / done）で絞り込める
- [x] priority バッジ（urgent=赤 / soon=黄 / someday=青）を各カードに表示する
- [x] 削除は確認ステップ付き（インライン確認バナー、4秒タイマーで自動キャンセル）
- [x] アイテム完了チェックでバケットを done 状態にできる

## Priority 自動判定ロジック

```
yearsUntilActivityEnd <= 3   → 'urgent'
yearsUntilActivityEnd <= 10  → 'soon'
deadline <= 365 days         → 'urgent'
deadline <= 1095 days        → 'soon'
else                         → 'someday'
```

priority は `calcPriority()` で動的算出し、永続化しない（年齢変化に追従するため）。

## 受け入れ基準

- 追加・編集は `BucketItemModal` モーダルで行う
- モバイルは FAB（右下固定ボタン）、PC はヘッダーボタンで追加を起動する
- 削除確認バナーは4秒後に自動で消える（ユーザーが誤削除した場合のキャンセル猶予）
- 完了したアイテムの budget は Dashboard の体験予算ゲージに反映される
- デフォルトデータは `src/data/bucketList.ts` の `BUCKET_LIST` 定数

## 状態管理

| 状態 | 型 | 用途 |
|---|---|---|
| `items` | `BucketItem[]` | localStorage (`z2d_bucket_list`) に永続化 |
| `filter` | `'all' \| 'urgent' \| 'soon' \| 'someday' \| 'done'` | 表示フィルター |
| `modalMode` | `'add' \| 'edit' \| null` | モーダル開閉 |
| `deleteState` | `{ id, timer }` | 削除確認インライン表示 |

## 関連ファイル

- `src/pages/BucketList.tsx`
- `src/components/BucketItemModal.tsx`
- `src/context/BucketListContext.tsx`
- `src/data/bucketList.ts`
- `src/utils/suggest.ts`
