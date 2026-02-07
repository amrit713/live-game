import {
  pgEnum,
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

/**
 * Drizzle ORM TypeScript schema for a real-time sports application.
 *
 * - Variable names use camelCase.
 * - Database columns use snake_case (explicit column names provided).
 *
 * Exports:
 * - matchStatus: Postgres enum `match_status`
 * - matches: table `matches`
 * - commentary: table `commentary`
 * - Type helpers (Match, NewMatch, Commentary, NewCommentary)
 */

/** Enum: match_status (scheduled | live | finished) */
export const matchStatus = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
] as const);

/** Matches table */
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  sport: text("sport").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  status: matchStatus("status").default("scheduled").notNull(),
  startTime: timestamp("start_time", { mode: "date" }),
  endTime: timestamp("end_time", { mode: "date" }),
  homeScore: integer("home_score").default(0).notNull(),
  awayScore: integer("away_score").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/** Commentary table */
export const commentary = pgTable("commentary", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .references(() => matches.id)
    .notNull(),
  minute: integer("minute"),
  sequence: integer("sequence"),
  period: text("period"),
  eventType: text("event_type"),
  actor: text("actor"),
  team: text("team"),
  message: text("message"),
  metadata: jsonb("metadata"),
  // tags as a Postgres text[] column
  tags: text("tags").array(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});


// Match Types
export type Match = InferSelectModel<typeof matches>;
export type NewMatch = InferInsertModel<typeof matches>;

// Commentary Types
export type Commentary = InferSelectModel<typeof commentary>;
export type NewCommentary = InferInsertModel<typeof commentary>;
