import { pgTable, text, serial, integer, boolean, timestamp, varchar, json, jsonb, uniqueIndex, unique, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(), // Acts as username
  password: text("password").notNull(),
  role: text("role", { enum: ["participant", "mentor", "admin", "superuser"] }).default("participant").notNull(),
  track: text("track", { enum: ["A", "B", "C"] }), // Nullable for non-participants
  mentorId: integer("mentor_id"), // Self-referencing FK
  startDate: timestamp("start_date"),
  profilePhotoUrl: text("profile_photo_url"), // Optional profile photo URL
});

export const dailyContent = pgTable("daily_content", {
  id: serial("id").primaryKey(),
  dayNumber: integer("day_number").notNull().unique(),
  weekNumber: integer("week_number").notNull(), // 1-5
  weekTitle: text("week_title").notNull(), // e.g., "God's Loving Plan for Humanity"
  
  // Morning content
  morningScriptureRef: text("morning_scripture_ref").notNull(), // e.g., "John 14:23"
  morningScriptureText: text("morning_scripture_text").notNull(), // The actual verse
  morningMeditation: text("morning_meditation").notNull(), // Reflection text
  morningPrayer: text("morning_prayer"), // Optional closing prayer
  
  // Evening content  
  eveningCatechismRef: text("evening_catechism_ref"), // e.g., "CCC #214-227"
  eveningCatechism: text("evening_catechism"), // Catechism content - now optional
  eveningSummary: text("evening_summary"), // Summary of key concepts
  eveningQuestions: json("evening_questions").$type<string[]>(), // Legacy - kept for migration compatibility
  assignment: text("assignment"), // Optional assignment text - if blank, no assignment shown
  
  isReflectionDay: boolean("is_reflection_day").default(false).notNull(), // Day 6 of each week (synthesis days)
  isMentorDay: boolean("is_mentor_day").default(false).notNull(), // Days requiring mentor message (3, 9, 15, 27)
});

// Practice resources - stores full text of prayers and practice instructions
export const practiceResources = pgTable("practice_resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "Prayer Against Retaliation", "Lectio Divina"
  type: text("type", { enum: ["prayer", "practice"] }).notNull(), // prayer = full text to pray, practice = instructions
  content: text("content").notNull(), // Full text or instructions
  duration: text("duration"), // e.g., "10 minutes" for practices
  order: integer("order").default(0), // Display order within category
  subtitle: text("subtitle"), // Optional subtitle shown below the title (e.g. "The greatest weapon of our faith")
  imageUrl: text("image_url"), // Optional hero image URL for the detail page
  audioUrl: text("audio_url"), // Optional audio file URL for the detail page
});

// Track-specific requirements by week
export const trackRequirements = pgTable("track_requirements", {
  id: serial("id").primaryKey(),
  track: text("track", { enum: ["A", "B", "C"] }).notNull(),
  weekNumber: integer("week_number").notNull(), // 1-5
  morningPractices: json("morning_practices").$type<string[]>().notNull(), // e.g., ["Prayer Against Retaliation", "Miracle Prayer"]
  eveningPractices: json("evening_practices").$type<string[]>().notNull(), // e.g., ["Examen – St Ignatius", "Lectio Divina – 10 Minutes"]
  additionalRequirements: json("additional_requirements").$type<string[]>(), // e.g., ["Abstinence Fridays Only", "Monthly Confession"]
});

export const trackAModules = pgTable("track_a_modules", {
  id: serial("id").primaryKey(),
  weekNumber: integer("week_number").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const trackAContent = pgTable("track_a_content", {
  id: serial("id").primaryKey(),
  dayNumber: integer("day_number").notNull().unique(),
  weekNumber: integer("week_number").notNull(),
  centralTheme: text("central_theme").notNull(),
  subtitle: text("subtitle"),
  slides: json("slides").$type<{ type: string; content: string }[]>(),
  imageUrl: text("image_url"),
  completionMessage: text("completion_message"),
});

// Pre-cohort onboarding modules — 3 sequential modules users complete before the main program
export const prelimModules = pgTable("prelim_modules", {
  id: serial("id").primaryKey(),
  position: integer("position").notNull().unique(), // 1 or 2
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  slides: json("slides").$type<{ type: string; content: string }[]>(),
  imageUrl: text("image_url"),
});

// Tracks which prelim modules each user has completed
export const prelimCompletions = pgTable("prelim_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  modulePosition: integer("module_position").notNull(), // 1 or 2
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_prelim_unique").on(table.userId, table.modulePosition),
]);

export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // FK to users
  dayNumber: integer("day_number").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("user_answers_user_day_unique").on(t.userId, t.dayNumber)]);

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(), // FK to users
  receiverId: integer("receiver_id").notNull(), // FK to users
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const uploadedImages = pgTable("uploaded_images", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Survey responses - stores participant answers to survey slides
export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  track: text("track").notNull(), // "A" or "B"
  dayNumber: integer("day_number").notNull(),
  questionIndex: integer("question_index").notNull(),
  questionLabel: text("question_label").notNull(),
  questionType: text("question_type").notNull(), // single_select | multi_select | rating | text
  response: text("response").notNull(), // plain string; multi_select uses JSON array string
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Chat flow responses - stores per-variable answers for chat_flow slides
export const chatFlowResponses = pgTable("chat_flow_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contextKey: text("context_key").notNull(), // e.g. "prelim-2" or "day-5"
  variableName: text("variable_name").notNull(),
  answer: text("answer").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("chat_flow_user_context_var_unique").on(table.userId, table.contextKey, table.variableName),
]);

// Cohort settings - stores program-wide configuration like start date
export const cohortSettings = pgTable("cohort_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Testimonies — each entry is one person's testimony story
export const testimonies = pgTable("testimonies", {
  id: serial("id").primaryKey(),
  position: integer("position").notNull().unique(),
  personName: text("person_name").notNull(),
  description: text("description").notNull().default(""),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  fullVideoUrl: text("full_video_url").notNull().default(""),
});

// Parts of a testimony — each part has its own video and unlock key
export const testimonyParts = pgTable("testimony_parts", {
  id: serial("id").primaryKey(),
  testimonyId: integer("testimony_id").notNull().references(() => testimonies.id, { onDelete: "cascade" }),
  partNumber: integer("part_number").notNull(),
  title: text("title").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  // "prelim" | "week-1-first" | "week-1-last" | "week-2-first" | "week-2-last" | ...
  unlockKey: text("unlock_key").notNull(),
}, (table) => ({
  uniqueTestimonyPart: unique().on(table.testimonyId, table.partNumber),
}));

export type Testimony = typeof testimonies.$inferSelect;
export type InsertTestimony = typeof testimonies.$inferInsert;
export type TestimonyPart = typeof testimonyParts.$inferSelect;
export type InsertTestimonyPart = typeof testimonyParts.$inferInsert;

export const insertTestimonySchema = createInsertSchema(testimonies).omit({ id: true });
export const insertTestimonyPartSchema = createInsertSchema(testimonyParts).omit({ id: true });

// Per-module reflection overlay configuration
export const moduleOverlays = pgTable("module_overlays", {
  contextKey: text("context_key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  imageUrl: text("image_url").notNull().default(""),
  text: text("text").notNull().default("Reflection Unlocked"),
  subtext: text("subtext").notNull().default(""),
  label: text("label").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ModuleOverlay = typeof moduleOverlays.$inferSelect;
export type InsertModuleOverlay = typeof moduleOverlays.$inferInsert;

// === HEALING TRACK TABLES ===

export const healingModules = pgTable("healing_modules", {
  id: serial("id").primaryKey(),
  moduleNumber: integer("module_number").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const healingContent = pgTable("healing_content", {
  id: serial("id").primaryKey(),
  moduleNumber: integer("module_number").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  slides: jsonb("slides").$type<{ type: string; content: string }[]>(),
  completionMessage: text("completion_message"),
});

export const healingCompletions = pgTable("healing_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleNumber: integer("module_number").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("healing_completions_user_module_unique").on(table.userId, table.moduleNumber),
]);

export const healingAnswers = pgTable("healing_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleNumber: integer("module_number").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("healing_answers_user_module_unique").on(table.userId, table.moduleNumber),
]);

// Insert schemas for Healing Track
export const insertHealingModuleSchema = createInsertSchema(healingModules).omit({ id: true });
export const insertHealingContentSchema = createInsertSchema(healingContent).omit({ id: true });
export const insertHealingCompletionSchema = createInsertSchema(healingCompletions).omit({ id: true, completedAt: true });
export const insertHealingAnswerSchema = createInsertSchema(healingAnswers).omit({ id: true, createdAt: true });

export type HealingModule = typeof healingModules.$inferSelect;
export type InsertHealingModule = z.infer<typeof insertHealingModuleSchema>;
export type HealingContent = typeof healingContent.$inferSelect;
export type InsertHealingContent = z.infer<typeof insertHealingContentSchema>;
export type HealingCompletion = typeof healingCompletions.$inferSelect;
export type InsertHealingCompletion = z.infer<typeof insertHealingCompletionSchema>;
export type HealingAnswer = typeof healingAnswers.$inferSelect;
export type InsertHealingAnswer = z.infer<typeof insertHealingAnswerSchema>;

// Guided prayer process responses — stores collected variable values for each slide session
export const guidedPrayerResponses = pgTable("guided_prayer_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  slideIndex: integer("slide_index").notNull(),
  variables: jsonb("variables").notNull().$type<Record<string, string | string[]>>(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("gpr_user_day_slide_unique").on(table.userId, table.dayNumber, table.slideIndex),
]);

export const insertGuidedPrayerResponseSchema = createInsertSchema(guidedPrayerResponses).omit({ id: true, completedAt: true });
export type GuidedPrayerResponse = typeof guidedPrayerResponses.$inferSelect;
export type InsertGuidedPrayerResponse = z.infer<typeof insertGuidedPrayerResponseSchema>;

// === FREEDOM WORKBOOK TABLES ===

// Per-user, per-section list entries for the Freedom Workbook
export const workbookEntries = pgTable("workbook_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").notNull(), // 1–23
  entryData: jsonb("entry_data").notNull().$type<Record<string, unknown>>(), // flexible field bag per section
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("wb_entries_user_section_idx").on(table.userId, table.sectionId),
]);

// Per-user, per-section "I have nothing to add" attestation
export const workbookAttestations = pgTable("workbook_attestations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").notNull(),
  attestedAt: timestamp("attested_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("wb_attestations_user_section_unique").on(table.userId, table.sectionId),
]);

export const insertWorkbookEntrySchema = createInsertSchema(workbookEntries).omit({ id: true, createdAt: true });
export const insertWorkbookAttestationSchema = createInsertSchema(workbookAttestations).omit({ id: true, attestedAt: true });

export type WorkbookEntry = typeof workbookEntries.$inferSelect;
export type InsertWorkbookEntry = z.infer<typeof insertWorkbookEntrySchema>;
export type WorkbookAttestation = typeof workbookAttestations.$inferSelect;
export type InsertWorkbookAttestation = z.infer<typeof insertWorkbookAttestationSchema>;

// Aggregated per-section summary returned by GET /api/workbook/summary
export type WorkbookSummary = Record<number, { count: number; attested: boolean }>;

// === FREEDOM WORKBOOK STREAKS ===

// Tracks how many consecutive days a user has completed a given prayer (prayer_1, prayer_2, prayer_3)
export const workbookStreaks = pgTable("workbook_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  prayerId: text("prayer_id", { enum: ["prayer_1", "prayer_2", "prayer_3"] }).notNull(),
  count: integer("count").notNull().default(0),
  lastCompletedAt: timestamp("last_completed_at"),
}, (table) => [
  uniqueIndex("wb_streaks_user_prayer_unique").on(table.userId, table.prayerId),
]);

export type WorkbookStreak = typeof workbookStreaks.$inferSelect;

export type PrayerId = "prayer_1" | "prayer_2" | "prayer_3";

export type WorkbookStreakStatus = {
  prayerId: PrayerId;
  count: number;
  lastCompletedAt: string | null;
  /** True if the user has not yet completed this prayer today (within the 48-hour window) */
  canCompleteToday: boolean;
  /** True if the streak is active (last completed within 48 hours) */
  streakActive: boolean;
};

// Password reset tokens — one-time use, expire after 1 hour
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
}, (table) => [
  index("prt_user_idx").on(table.userId),
  index("prt_token_idx").on(table.token),
]);

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Track A content snapshots for version control
export const trackASnapshots = pgTable("track_a_snapshots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  data: json("data").notNull(), // { track_a_content: [...], prelim_modules: [...] }
});

// Prayer completion tracking - records when users complete morning/evening prayers
export const prayerCompletions = pgTable("prayer_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // FK to users
  dayNumber: integer("day_number").notNull(), // 1-30
  period: text("period", { enum: ["morning", "evening"] }).notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_day_period_unique").on(table.userId, table.dayNumber, table.period),
]);

// === RELATIONS ===

export const usersRelations = relations(users, ({ one, many }) => ({
  mentor: one(users, {
    fields: [users.mentorId],
    references: [users.id],
    relationName: "mentor_mentee",
  }),
  mentees: many(users, { relationName: "mentor_mentee" }),
  answers: many(userAnswers),
  sentMessages: many(messages, { relationName: "sent_messages" }),
  receivedMessages: many(messages, { relationName: "received_messages" }),
}));

export const userAnswersRelations = relations(userAnswers, ({ one }) => ({
  user: one(users, {
    fields: [userAnswers.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sent_messages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "received_messages",
  }),
}));

export const prayerCompletionsRelations = relations(prayerCompletions, ({ one }) => ({
  user: one(users, {
    fields: [prayerCompletions.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users, {
  // Handle date strings from JSON payload
  startDate: z.union([z.date(), z.string().transform((s) => new Date(s))]).optional().nullable(),
}).omit({ id: true });
export const insertDailyContentSchema = createInsertSchema(dailyContent, {
  eveningQuestions: z.array(z.string()).optional().nullable(),
  assignment: z.string().optional().nullable(),
}).omit({ id: true });
export const insertUserAnswerSchema = createInsertSchema(userAnswers).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, isRead: true, createdAt: true });
export const insertTrackRequirementsSchema = createInsertSchema(trackRequirements, {
  morningPractices: z.array(z.string()),
  eveningPractices: z.array(z.string()),
  additionalRequirements: z.array(z.string()).optional().nullable(),
}).omit({ id: true });
export const insertPrayerCompletionSchema = createInsertSchema(prayerCompletions).omit({ id: true, completedAt: true });
export const insertPracticeResourceSchema = createInsertSchema(practiceResources).omit({ id: true });
export const insertTrackAModuleSchema = createInsertSchema(trackAModules).omit({ id: true });
export const insertTrackAContentSchema = createInsertSchema(trackAContent).omit({ id: true });
export const insertCohortSettingsSchema = createInsertSchema(cohortSettings).omit({ id: true, updatedAt: true });
export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({ id: true, submittedAt: true });
export const insertPrelimModuleSchema = createInsertSchema(prelimModules).omit({ id: true });
export const insertPrelimCompletionSchema = createInsertSchema(prelimCompletions).omit({ id: true, completedAt: true });
export const insertChatFlowResponseSchema = createInsertSchema(chatFlowResponses).omit({ id: true, updatedAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type DailyContent = typeof dailyContent.$inferSelect;
export type InsertDailyContent = z.infer<typeof insertDailyContentSchema>;

export type UserAnswer = typeof userAnswers.$inferSelect;
export type InsertUserAnswer = z.infer<typeof insertUserAnswerSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type TrackRequirement = typeof trackRequirements.$inferSelect;
export type InsertTrackRequirement = z.infer<typeof insertTrackRequirementsSchema>;

export type PrayerCompletion = typeof prayerCompletions.$inferSelect;
export type InsertPrayerCompletion = z.infer<typeof insertPrayerCompletionSchema>;

export type PracticeResource = typeof practiceResources.$inferSelect;
export type InsertPracticeResource = z.infer<typeof insertPracticeResourceSchema>;

export type TrackAModule = typeof trackAModules.$inferSelect;
export type InsertTrackAModule = z.infer<typeof insertTrackAModuleSchema>;

export type TrackAContent = typeof trackAContent.$inferSelect;
export type InsertTrackAContent = z.infer<typeof insertTrackAContentSchema>;

export type CohortSetting = typeof cohortSettings.$inferSelect;
export type InsertCohortSetting = z.infer<typeof insertCohortSettingsSchema>;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

export type PrelimModule = typeof prelimModules.$inferSelect;
export type InsertPrelimModule = z.infer<typeof insertPrelimModuleSchema>;

export type PrelimCompletion = typeof prelimCompletions.$inferSelect;
export type InsertPrelimCompletion = z.infer<typeof insertPrelimCompletionSchema>;

export type ChatFlowResponse = typeof chatFlowResponses.$inferSelect;
export type InsertChatFlowResponse = z.infer<typeof insertChatFlowResponseSchema>;

export type TrackASnapshot = typeof trackASnapshots.$inferSelect;
export type InsertTrackASnapshot = typeof trackASnapshots.$inferInsert;

// Prelim module with user completion status (returned from /api/prelim-modules)
export type PrelimModuleWithStatus = PrelimModule & { completed: boolean };

// Journal types — returned by GET /api/journal
export type JournalEntry = {
  dayNumber: number;
  centralTheme: string;
  content: string;
  createdAt: string;
};

export type JournalModule = {
  weekNumber: number;
  moduleTitle: string;
  moduleSubtitle: string;
  entries: JournalEntry[];
};

// Request/Response types

// Auth
export type LoginRequest = { email: string; password: string };
export type AuthResponse = User;

// Users
export type CreateUserRequest = InsertUser;
export type UpdateUserRequest = Partial<InsertUser>;

// Daily Content
export type DailyContentResponse = DailyContent;

// Answers
export type CreateAnswerRequest = { dayNumber: number; content: string };
export type AnswerResponse = UserAnswer;

// Chat
export type SendMessageRequest = { receiverId: number; content: string };
export type MessageResponse = Message & { senderName?: string }; // Enriched with sender name

// Track Requirements
export type TrackRequirementResponse = TrackRequirement;
