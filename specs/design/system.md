---
status: done
created: 2026-05-20
updated: 2026-05-21
---

# デザインシステム

## カラーパレット

| トークン | HEX | 用途 |
|---|---|---|
| `brand.orange` | `#F97316` | プライマリ・アクセント・CTA |
| `brand.amber` | `#FB923C` | セカンダリ・グラデーション終点 |
| `brand.navy` | `#0F172A` | ページ背景ベース |
| `brand.slate` | `#1E293B` | カード背景・サイドバー |
| `brand.muted` | `#334155` | 区切り・サブ要素 |
| `white/5〜40` | — | glass-morphism カード・テキスト階層 |
| `red-400` (#F87171) | — | urgent バッジ・警告 |
| `amber-400` (#FBBF24) | — | soon バッジ・注意 |
| `sky-400` (#38BDF8) | — | someday バッジ・情報 |

`tailwind.config.js` に `brand.*` トークンとして登録済み。

## 背景グラデーション

全ページ共通で使用するグラデーション:

```css
background: linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1C1917 100%);
```

## タイポグラフィ

| 用途 | フォント | 理由 |
|---|---|---|
| 欧文・数値・UI | **Inter** | 数値の視認性が高い |
| 和文 | **Noto Sans JP** | 日本語混在対応 |

## 共通カードスタイル

```
rounded-2xl  bg-white/5  border border-white/10
```

## アニメーション

| 対象 | 設定 |
|---|---|
| プログレスバー・グラフ | `transition-all duration-700` 〜 `duration-1000` |
| モーダル開閉 | `transition-opacity duration-200` |

## デザインのトーン＆マナー

基本方針: 「あと〇年でできなくなる」という事実を *ネガティブな警告* として見せず、「だからこそ今年やろう！」という **ポジティブな行動喚起** に変換する。

| 原則 | 実装方針 |
|---|---|
| 肯定的な残り時間表現 | 「残り〇〇日しかない」ではなく「あなたにはまだ〇〇日ある」 |
| 鮮やかなカラー | 夕焼けオレンジ × ディープネイビーで生命力・躍動感を演出 |
| 数値を主役にする | カウントダウンや残り年数は `text-5xl font-bold` で大きく表示 |
| 達成感の演出 | バケットリスト完了チェックはオレンジで強調表示 |

## コンポーネントスタイルガイド

### バッジ

```tsx
// urgent
<span className="bg-red-400/20 text-red-400 text-xs px-2 py-0.5 rounded-full">urgent</span>
// soon
<span className="bg-amber-400/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">soon</span>
// someday
<span className="bg-sky-400/20 text-sky-400 text-xs px-2 py-0.5 rounded-full">someday</span>
```

### プライマリボタン

```tsx
<button className="bg-gradient-to-r from-brand-orange to-brand-amber text-white font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
  テキスト
</button>
```
