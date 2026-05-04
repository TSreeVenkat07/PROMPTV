-- PromptV Neon PostgreSQL Schema v2
-- Run this in Neon SQL Editor to reset and upgrade your database

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Drop old objects (safe reset)
-- ============================================
DROP VIEW IF EXISTS build_prompts CASCADE;
DROP VIEW IF EXISTS analyze_prompts CASCADE;
DROP VIEW IF EXISTS recovery_prompts CASCADE;
DROP VIEW IF EXISTS vision_prompts CASCADE;
DROP TABLE IF EXISTS prompt_versions CASCADE;
DROP TABLE IF EXISTS analyses CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

-- ============================================
-- CORE TABLE: prompts (all modes in one table)
-- ============================================
CREATE TABLE prompts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original      TEXT NOT NULL,
  refined       TEXT,
  embedding     VECTOR(768),
  mode          TEXT NOT NULL CHECK (mode IN ('build','analyze','recovery','vision')),
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  analysis_data JSONB DEFAULT '{}',
  created_at    TIMESTAMP DEFAULT now()
);

-- ============================================
-- VIEWS: Split by mode for Neon console clarity
-- ============================================

-- 📊 Analyze Prompts
CREATE VIEW analyze_prompts AS
SELECT id, original, refined, quality_score, analysis_data, created_at
FROM prompts WHERE mode = 'analyze'
ORDER BY created_at DESC;

-- 🏗️ Build Prompts (with roadmap & tech stack)
CREATE VIEW build_prompts AS
SELECT id, original, refined, quality_score,
       analysis_data->>'tech_stack' AS tech_stack,
       analysis_data->>'roadmap' AS roadmap,
       created_at
FROM prompts WHERE mode = 'build'
ORDER BY created_at DESC;

-- 🔧 Recovery Prompts
CREATE VIEW recovery_prompts AS
SELECT id, original, refined, quality_score,
       analysis_data->>'diagnosis' AS diagnosis,
       analysis_data->>'root_causes' AS root_causes,
       created_at
FROM prompts WHERE mode = 'recovery'
ORDER BY created_at DESC;

-- 🖼️ Vision Prompts (image extractions)
CREATE VIEW vision_prompts AS
SELECT id, original, refined, quality_score,
       analysis_data->>'detected_type' AS detected_type,
       analysis_data->>'summary' AS summary,
       created_at
FROM prompts WHERE mode = 'vision'
ORDER BY created_at DESC;

-- ============================================
-- ANALYSES TABLE (detailed breakdowns)
-- ============================================
CREATE TABLE analyses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id       UUID REFERENCES prompts(id) ON DELETE CASCADE,
  issues          JSONB NOT NULL DEFAULT '{}',
  risks           JSONB NOT NULL DEFAULT '{}',
  improvements    JSONB NOT NULL DEFAULT '{}',
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMP DEFAULT now()
);

-- ============================================
-- VERSION HISTORY
-- ============================================
CREATE TABLE prompt_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id       UUID REFERENCES prompts(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  content         TEXT NOT NULL,
  score           INTEGER,
  diff_summary    TEXT,
  created_at      TIMESTAMP DEFAULT now()
);

-- ============================================
-- TEMPLATE LIBRARY
-- ============================================
CREATE TABLE templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  content     TEXT NOT NULL,
  tags        TEXT[],
  usage_count INTEGER DEFAULT 0
);

-- ============================================
-- INDEXES (performance)
-- ============================================
CREATE INDEX idx_prompts_embedding ON prompts USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_prompts_mode      ON prompts(mode);
CREATE INDEX idx_prompts_created   ON prompts(created_at DESC);
CREATE INDEX idx_analyses_pid      ON analyses(prompt_id);
CREATE INDEX idx_versions_pid      ON prompt_versions(prompt_id);
CREATE INDEX idx_templates_cat     ON templates(category);
