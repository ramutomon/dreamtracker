# Specs — スペック駆動開発ガイド

## このディレクトリについて

`specs/` はプロジェクトの **仕様書の唯一の真実の源** である。
コードを書く前に必ずここに仕様を書き、実装後は最新状態に保つ。

---

## スペックファイルのテンプレート

```markdown
---
status: draft | ready | in-progress | done
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# 機能名

## 概要
この機能が何をするか、なぜ必要かを2〜3文で説明。

## 要件

- [ ] 要件1
- [ ] 要件2
- [ ] 要件3

## 受け入れ基準

- ユーザーが〇〇すると、△△が表示される
- □□の場合は、◇◇が起きる

## 技術メモ

実装上の制約・既存コードとの接続方法など。

## 関連ファイル

- `src/pages/Foo.tsx`
- `src/context/FooContext.tsx`
```

---

## ステータスの意味

| ステータス | 意味 |
|---|---|
| `draft` | 作成中。まだ実装依頼しない |
| `ready` | レビュー済み。実装依頼可能 |
| `in-progress` | 実装中 |
| `done` | 実装完了・仕様書も最新 |

---

## ディレクトリ構成

```
specs/
  README.md              # このファイル
  features/              # 画面・機能単位の仕様書
  data/                  # データモデル定義
  design/                # デザインシステム
  roadmap/               # 将来フェーズの計画
```

---

## Claude への依頼の仕方

```
# 新機能を実装する
specs/features/dashboard.md を実装して

# 仕様を変更してから実装する
specs/features/bucket-list.md の「削除確認」セクションを更新したので実装して

# 仕様の相談
specs/features/timeline.md のこの要件について相談したい
```
