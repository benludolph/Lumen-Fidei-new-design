import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
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
});

export const dailyContent = pgTable("daily_content", {
  id: serial("id").primaryKey(),
  dayNumber: integer("day_number").notNull().unique(),
  morningScripture: text("morning_scripture").notNull(),
  morningMeditation: text("morning_meditation").notNull(),
  eveningCatechism: text("evening_catechism").notNull(),
  eveningAssignment: text("evening_assignment").notNull(),
  isReflectionDay: boolean("is_reflection_day").default(false).notNull(),
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

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertDailyContentSchema = createInsertSchema(dailyContent).omit({ id: true });
export const insertUserAnswerSchema = createInsertSchema(userAnswers).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, isRead: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type DailyContent = typeof dailyContent.$inferSelect;
export type InsertDailyContent = z.infer<typeof insertDailyContentSchema>;

export type UserAnswer = typeof userAnswers.$inferSelect;
export type InsertUserAnswer = z.infer<typeof insertUserAnswerSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

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
