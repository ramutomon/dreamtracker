-- ============================================================
-- Zero2Die — Supabase スキーマ
-- Supabase SQL Editor に貼り付けて実行してください
-- ============================================================

-- ── profiles テーブル ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname                TEXT        NOT NULL DEFAULT '',
  birth_date              DATE,
  gender                  TEXT        NOT NULL DEFAULT 'other'
                            CHECK (gender IN ('male', 'female', 'other')),
  smoking                 BOOLEAN     NOT NULL DEFAULT false,
  exercise_level          TEXT        NOT NULL DEFAULT 'occasional'
                            CHECK (exercise_level IN ('regular', 'occasional', 'none')),
  health_status           TEXT        NOT NULL DEFAULT 'normal'
                            CHECK (health_status IN ('good', 'normal', 'concern')),
  healthy_life_expectancy INTEGER     NOT NULL DEFAULT 73,
  total_life_expectancy   INTEGER     NOT NULL DEFAULT 81,
  experience_budget       INTEGER     NOT NULL DEFAULT 1200000,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── bucket_items テーブル ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS bucket_items (
  id                BIGSERIAL   PRIMARY KEY,
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT        NOT NULL,
  category          TEXT        NOT NULL DEFAULT '',
  emoji             TEXT        NOT NULL DEFAULT '🌟',
  budget            INTEGER     NOT NULL DEFAULT 0,
  deadline          DATE,
  activity_phase_id TEXT        NOT NULL DEFAULT 'travel',
  suggest_reason    TEXT                 DEFAULT '',
  duration_days     INTEGER     NOT NULL DEFAULT 0,
  companions        TEXT        NOT NULL DEFAULT '',
  desire_level      INTEGER     NOT NULL DEFAULT 3
                      CHECK (desire_level BETWEEN 1 AND 5),
  completion_memo   TEXT        NOT NULL DEFAULT '',
  done              BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at 自動更新トリガー ────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER bucket_items_updated_at
  BEFORE UPDATE ON bucket_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own bucket items"
  ON bucket_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 他のユーザーの夢を検索・閲覧できる（未達成のみ）
CREATE POLICY "Authenticated users can browse all items"
  ON bucket_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- マイグレーション（既存プロジェクトに適用する場合）
-- ============================================================
-- experience_budget 列の削除
-- ALTER TABLE profiles DROP COLUMN IF EXISTS experience_budget;
--
-- duration_days 列の追加
-- ALTER TABLE bucket_items ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 0;
--
-- companions 列の追加
-- ALTER TABLE bucket_items ADD COLUMN IF NOT EXISTS companions TEXT NOT NULL DEFAULT '';
--
-- desire_level 列の追加
-- ALTER TABLE bucket_items ADD COLUMN IF NOT EXISTS desire_level INTEGER NOT NULL DEFAULT 3;
--
-- 検索用ポリシーの追加（上記 CREATE POLICY が未実行の場合）
-- CREATE POLICY "Authenticated users can browse all items"
--   ON bucket_items FOR SELECT
--   USING (auth.uid() IS NOT NULL);
