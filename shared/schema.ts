import { pgTable, text, serial, integer, boolean, timestamp, varchar, json, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(), // Acts as username
  password: text("password").notNull(),
  role: text("role", { enum: ["participant", "mentor", "admin"] }).default("participant").notNull(),
  track: text("track", { enum: ["A", "B", "C"] }), // Nullable for non-participants
  mentorId: integer("mentor_id"), // Self-referencing FK
  startDate: timestamp("start_date"),
  agreementSignedAt: timestamp("agreement_signed_at"), // When user signed the Day 0 agreement
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
  saintId: text("saint_id"),
  saintName: text("saint_name"),
  saintImage: text("saint_image"),
  saintQuote: text("saint_quote"),
});

export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // FK to users
  dayNumber: integer("day_number").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

// Cohort settings - stores program-wide configuration like start date
export const cohortSettings = pgTable("cohort_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  agreementSignedAt: z.union([z.date(), z.string().transform((s) => new Date(s))]).optional().nullable(),
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
