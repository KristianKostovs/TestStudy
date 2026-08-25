import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const interviewProfiles = sqliteTable("interview_profiles", {
  id: text("id").primaryKey(),
  currentRole: text("current_role").notNull(),
  targetRole: text("target_role").notNull(),
  horizon: text("horizon").notNull(),
  focus: text("focus").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const interviewQuestions = sqliteTable("interview_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  prompt: text("prompt").notNull(),
  competency: text("competency").notNull(),
  tagsJson: text("tags_json").notNull(),
  sourceType: text("source_type").notNull(),
  sourceRef: text("source_ref").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const interviewAttempts = sqliteTable("interview_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id").notNull(),
  answerText: text("answer_text").notNull(),
  score: integer("score").notNull(),
  diagnosisJson: text("diagnosis_json").notNull(),
  weakTagsJson: text("weak_tags_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_interview_attempts_question_created").on(table.questionId, table.createdAt)]);

export const interviewCompetencyScores = sqliteTable("interview_competency_scores", {
  competency: text("competency").primaryKey(),
  score: integer("score").notNull(),
  evidenceCount: integer("evidence_count").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const interviewMarketSignals = sqliteTable("interview_market_signals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  competency: text("competency").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceType: text("source_type").notNull(),
  observedAt: text("observed_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});

export const interviewPlanItems = sqliteTable("interview_plan_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  competency: text("competency").notNull(),
  reason: text("reason").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  status: text("status").notNull().default("open"),
  sourceAttemptId: integer("source_attempt_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_interview_plan_status_created").on(table.status, table.createdAt)]);
