import { db } from "./db";
import {
  users, dailyContent, userAnswers, messages, trackRequirements, prayerCompletions,
  type User, type InsertUser,
  type DailyContent, type InsertDailyContent,
  type UserAnswer, type InsertUserAnswer,
  type Message, type InsertMessage,
  type TrackRequirement, type InsertTrackRequirement,
  type PrayerCompletion, type InsertPrayerCompletion
} from "@shared/schema";
import { eq, and, or, lt, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(email: string): Promise<User | undefined>;
  getUsersByRole(role: "participant" | "mentor"): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Daily Content
  getDailyContent(dayNumber: number): Promise<DailyContent | undefined>;
  getAllDailyContent(): Promise<DailyContent[]>;
  createDailyContent(content: InsertDailyContent): Promise<DailyContent>;
  upsertDailyContent(content: InsertDailyContent): Promise<DailyContent>;

  // Track Requirements
  getTrackRequirements(track: "A" | "B" | "C", weekNumber: number): Promise<TrackRequirement | undefined>;
  getAllTrackRequirements(track: "A" | "B" | "C"): Promise<TrackRequirement[]>;
  createTrackRequirement(req: InsertTrackRequirement): Promise<TrackRequirement>;

  // Answers
  getUserAnswers(userId: number): Promise<UserAnswer[]>;
  createUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer>;

  // Chat
  getMessages(user1Id: number, user2Id: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  
  // Prayer Completions
  getPrayerCompletion(userId: number, dayNumber: number, period: "morning" | "evening"): Promise<PrayerCompletion | undefined>;
  getUserPrayerCompletions(userId: number): Promise<PrayerCompletion[]>;
  getAllPrayerCompletions(): Promise<PrayerCompletion[]>;
  createPrayerCompletion(completion: InsertPrayerCompletion): Promise<PrayerCompletion>;
  deletePrayerCompletion(userId: number, dayNumber: number, period: "morning" | "evening"): Promise<void>;
  
  // session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByRole(role: "participant" | "mentor"): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }
  
  async getAllUsers(): Promise<User[]> {
      return await db.select().from(users).orderBy(users.id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Daily Content
  async getDailyContent(dayNumber: number): Promise<DailyContent | undefined> {
    const [content] = await db.select().from(dailyContent).where(eq(dailyContent.dayNumber, dayNumber));
    return content;
  }

  async getAllDailyContent(): Promise<DailyContent[]> {
      return await db.select().from(dailyContent).orderBy(dailyContent.dayNumber);
  }

  async createDailyContent(content: InsertDailyContent): Promise<DailyContent> {
    const [newContent] = await db.insert(dailyContent).values(content).returning();
    return newContent;
  }

  async upsertDailyContent(content: InsertDailyContent): Promise<DailyContent> {
    const existing = await this.getDailyContent(content.dayNumber);
    if (existing) {
      const [updated] = await db.update(dailyContent)
        .set(content)
        .where(eq(dailyContent.dayNumber, content.dayNumber))
        .returning();
      return updated;
    }
    return this.createDailyContent(content);
  }

  // Track Requirements
  async getTrackRequirements(track: "A" | "B" | "C", weekNumber: number): Promise<TrackRequirement | undefined> {
    const [req] = await db.select().from(trackRequirements)
      .where(and(eq(trackRequirements.track, track), eq(trackRequirements.weekNumber, weekNumber)));
    return req;
  }

  async getAllTrackRequirements(track: "A" | "B" | "C"): Promise<TrackRequirement[]> {
    return await db.select().from(trackRequirements)
      .where(eq(trackRequirements.track, track))
      .orderBy(asc(trackRequirements.weekNumber));
  }

  async createTrackRequirement(req: InsertTrackRequirement): Promise<TrackRequirement> {
    const [newReq] = await db.insert(trackRequirements).values(req).returning();
    return newReq;
  }

  // Answers
  async getUserAnswers(userId: number): Promise<UserAnswer[]> {
    return await db.select()
      .from(userAnswers)
      .where(eq(userAnswers.userId, userId))
      .orderBy(asc(userAnswers.dayNumber));
  }

  async createUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer> {
    const [newAnswer] = await db.insert(userAnswers).values(answer).returning();
    return newAnswer;
  }

  // Chat
  async getMessages(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
          and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)));
  }

  // Prayer Completions
  async getPrayerCompletion(userId: number, dayNumber: number, period: "morning" | "evening"): Promise<PrayerCompletion | undefined> {
    const [completion] = await db.select().from(prayerCompletions)
      .where(and(
        eq(prayerCompletions.userId, userId),
        eq(prayerCompletions.dayNumber, dayNumber),
        eq(prayerCompletions.period, period)
      ));
    return completion;
  }

  async getUserPrayerCompletions(userId: number): Promise<PrayerCompletion[]> {
    return await db.select().from(prayerCompletions)
      .where(eq(prayerCompletions.userId, userId))
      .orderBy(asc(prayerCompletions.dayNumber));
  }

  async getAllPrayerCompletions(): Promise<PrayerCompletion[]> {
    return await db.select().from(prayerCompletions).orderBy(asc(prayerCompletions.userId), asc(prayerCompletions.dayNumber));
  }

  async createPrayerCompletion(completion: InsertPrayerCompletion): Promise<PrayerCompletion> {
    const [newCompletion] = await db.insert(prayerCompletions).values(completion).returning();
    return newCompletion;
  }

  async deletePrayerCompletion(userId: number, dayNumber: number, period: "morning" | "evening"): Promise<void> {
    await db.delete(prayerCompletions)
      .where(and(
        eq(prayerCompletions.userId, userId),
        eq(prayerCompletions.dayNumber, dayNumber),
        eq(prayerCompletions.period, period)
      ));
  }
}

export const storage = new DatabaseStorage();
