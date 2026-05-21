---
status: draft
created: 2026-05-21
updated: 2026-05-21
---

# Phase 2 — データ永続化・認証

## 概要

MVP では localStorage でデータを管理しているが、Phase 2 でユーザー認証と Supabase による本格的なデータ永続化を実現する。

## 要件

- [ ] Supabase Auth でユーザー認証を実装する（Google / Apple サインイン）
- [ ] `users` テーブルにプロフィール・設定を保存する
- [ ] `bucket_items` テーブルでバケットリストを管理する
- [ ] `experience_budgets` テーブルで年度別体験予算を管理する
- [ ] localStorage から Supabase へのデータ移行フローを提供する

## データベーススキーマ（案）

```sql
-- ユーザープロフィール
create table users (
  id uuid primary key references auth.users,
  nickname text,
  birth_date date,
  gender text,
  smoking boolean,
  exercise_level text,
  health_status text,
  healthy_life_expectancy int,
  total_life_expectancy int,
  created_at timestamptz default now()
);

-- バケットリスト
create table bucket_items (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  title text not null,
  category text,
  emoji text,
  budget int,
  deadline date,
  activity_phase_id text,
  suggest_reason text,
  done boolean default false,
  created_at timestamptz default now()
);

-- 年度別体験予算
create table experience_budgets (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  year int not null,
  budget int not null,
  unique(user_id, year)
);
```

## 技術メモ

- `src/lib/supabase.ts` はすでに存在する（MVP 時点でクライアント初期化済み）
- RLS (Row Level Security) を必ず設定する
- Phase 2 導入前に `/login` ページのフロー（`src/pages/Login.tsx`）を完成させる

## 関連ファイル

- `src/lib/supabase.ts`
- `src/pages/Login.tsx`
- `supabase/` (migrations など)
