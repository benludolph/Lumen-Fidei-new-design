import { db } from "./db";
import {
  users, dailyContent, userAnswers, messages, trackRequirements, prayerCompletions, practiceResources, cohortSettings, trackAContent, trackAModules,
  prelimModules, prelimCompletions, moduleOverlays, testimonies, testimonyParts, passwordResetTokens, surveyResponses, trackASnapshots,
  type User, type InsertUser,
  type DailyContent, type InsertDailyContent,
  type UserAnswer, type InsertUserAnswer,
  type Message, type InsertMessage,
  type TrackRequirement, type InsertTrackRequirement,
  type PrayerCompletion, type InsertPrayerCompletion,
  type PracticeResource, type InsertPracticeResource,
  type CohortSetting,
  type TrackAContent, type InsertTrackAContent,
  type TrackAModule, type InsertTrackAModule,
  type PrelimModule, type InsertPrelimModule,
  type PrelimCompletion,
  type ModuleOverlay,
  type Testimony, type InsertTestimony,
  type TestimonyPart, type InsertTestimonyPart,
  type PasswordResetToken,
  type TrackASnapshot,
} from "@shared/schema";
import { eq, and, or, lt, gt, desc, asc, min, max, count, inArray, isNull, sql } from "drizzle-orm";

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
  getJournalEntries(userId: number): Promise<import("@shared/schema").JournalModule[]>;

  // Chat
  getMessages(user1Id: number, user2Id: number): Promise<Message[]>;
  getConversationPartnerIds(userId: number): Promise<number[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  getUnreadMessageCount(userId: number): Promise<number>;
  markAllMessagesAsRead(userId: number): Promise<void>;
  
  // Prayer Completions
  getPrayerCompletion(userId: number, dayNumber: number, period: "morning" | "evening"): Promise<PrayerCompletion | undefined>;
  getUserPrayerCompletions(userId: number): Promise<PrayerCompletion[]>;
  getAllPrayerCompletions(): Promise<PrayerCompletion[]>;
  createPrayerCompletion(completion: InsertPrayerCompletion): Promise<PrayerCompletion>;
  deletePrayerCompletion(userId: number, dayNumber: number, period: "morning" | "evening"): Promise<void>;
  clearAllPrayerCompletions(): Promise<number>;
  
  // Practice Resources
  getAllPracticeResources(): Promise<PracticeResource[]>;
  getPracticeResourceByName(name: string): Promise<PracticeResource | undefined>;
  getPracticeResourceById(id: number): Promise<PracticeResource | undefined>;
  createPracticeResource(resource: InsertPracticeResource): Promise<PracticeResource>;
  upsertPracticeResource(resource: InsertPracticeResource): Promise<PracticeResource>;
  updatePracticeResourceById(id: number, data: Partial<InsertPracticeResource>): Promise<PracticeResource | undefined>;
  
  // Track A Modules
  getTrackAModules(): Promise<TrackAModule[]>;
  upsertTrackAModule(module: InsertTrackAModule): Promise<TrackAModule>;
  reorderTrackAModules(weekNumbers: number[]): Promise<void>;

  // Track A Content
  getTrackAContent(dayNumber: number): Promise<TrackAContent | undefined>;
  getTrackAContentByPosition(position: number): Promise<TrackAContent | undefined>;
  getAllTrackAContent(): Promise<TrackAContent[]>;
  reorderTrackAContent(dayNumbers: number[]): Promise<void>;
  upsertTrackAContent(content: InsertTrackAContent): Promise<TrackAContent>;

  // Cohort Settings
  getCohortSetting(key: string): Promise<string | null>;
  setCohortSetting(key: string, value: string): Promise<CohortSetting>;

  // Module Overlays
  listModuleOverlays(): Promise<ModuleOverlay[]>;
  getModuleOverlay(contextKey: string): Promise<ModuleOverlay | null>;
  upsertModuleOverlay(overlay: ModuleOverlay): Promise<ModuleOverlay>;
  
  // Admin message management
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  deleteMessagesBetweenUsers(userId1: number, userId2: number): Promise<number>;

  // Prelim Modules
  getPrelimModules(): Promise<PrelimModule[]>;
  getPrelimModule(position: number): Promise<PrelimModule | undefined>;
  upsertPrelimModule(module: InsertPrelimModule): Promise<PrelimModule>;
  deletePrelimModule(position: number): Promise<void>;
  getUserPrelimCompletions(userId: number): Promise<PrelimCompletion[]>;
  completePrelimModule(userId: number, modulePosition: number): Promise<PrelimCompletion>;

  // Testimonies
  getTestimonies(): Promise<Testimony[]>;
  getTestimony(id: number): Promise<Testimony | undefined>;
  createTestimony(data: InsertTestimony): Promise<Testimony>;
  updateTestimony(id: number, data: Partial<InsertTestimony>): Promise<Testimony>;
  deleteTestimony(id: number): Promise<void>;
  getTestimonyParts(testimonyId: number): Promise<TestimonyPart[]>;
  createTestimonyPart(data: InsertTestimonyPart): Promise<TestimonyPart>;
  updateTestimonyPart(id: number, data: Partial<InsertTestimonyPart>): Promise<TestimonyPart>;
  deleteTestimonyPart(id: number): Promise<void>;
  // Unlock derivation: returns a set of unlockKeys that are unlocked for this user
  getUnlockedKeysForUser(userId: number): Promise<Set<string>>;

  // Password reset tokens
  createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  claimPasswordResetToken(token: string): Promise<PasswordResetToken | null>;

  // Track A Snapshots
  listTrackASnapshots(): Promise<TrackASnapshot[]>;
  createTrackASnapshot(name: string): Promise<TrackASnapshot>;
  restoreTrackASnapshot(id: number): Promise<void>;
  deleteTrackASnapshot(id: number): Promise<void>;

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
    // Cascade delete all user-related data
    await db.delete(userAnswers).where(eq(userAnswers.userId, id));
    await db.delete(prayerCompletions).where(eq(prayerCompletions.userId, id));
    await db.delete(messages).where(
      or(eq(messages.senderId, id), eq(messages.receiverId, id))
    );
    // Remove mentor assignment from any participants assigned to this user
    await db.update(users).set({ mentorId: null }).where(eq(users.mentorId, id));
    // Finally delete the user
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
    const [newAnswer] = await db
      .insert(userAnswers)
      .values(answer)
      .onConflictDoUpdate({
        target: [userAnswers.userId, userAnswers.dayNumber],
        set: { content: answer.content },
      })
      .returning();
    return newAnswer;
  }

  async getJournalEntries(userId: number): Promise<import("@shared/schema").JournalModule[]> {
    // Fetch all five modules so the UI can always render all sections
    const allModules = await db.select().from(trackAModules).orderBy(asc(trackAModules.weekNumber));

    // Fetch user's answers joined with track_a_content for metadata
    const rows = await db
      .select({
        dayNumber: userAnswers.dayNumber,
        content: userAnswers.content,
        createdAt: userAnswers.createdAt,
        centralTheme: trackAContent.centralTheme,
        weekNumber: trackAContent.weekNumber,
      })
      .from(userAnswers)
      .innerJoin(trackAContent, eq(userAnswers.dayNumber, trackAContent.dayNumber))
      .where(eq(userAnswers.userId, userId))
      .orderBy(asc(trackAContent.weekNumber), asc(userAnswers.dayNumber));

    // Group entries by weekNumber
    const entryMap = new Map<number, import("@shared/schema").JournalEntry[]>();
    for (const row of rows) {
      if (!entryMap.has(row.weekNumber)) entryMap.set(row.weekNumber, []);
      entryMap.get(row.weekNumber)!.push({
        dayNumber: row.dayNumber,
        centralTheme: row.centralTheme,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
      });
    }

    // Merge: all modules present, entries may be empty
    const result: import("@shared/schema").JournalModule[] = allModules.map(mod => ({
      weekNumber: mod.weekNumber,
      moduleTitle: mod.title,
      moduleSubtitle: mod.subtitle,
      entries: entryMap.get(mod.weekNumber) ?? [],
    }));

    // Prepend Introduction (week 0 / day 0) entries if any exist
    const introEntries = entryMap.get(0) ?? [];
    if (introEntries.length > 0) {
      result.unshift({
        weekNumber: 0,
        moduleTitle: "Introduction",
        moduleSubtitle: "Goal of the Next 30 Days",
        entries: introEntries,
      });
    }

    return result;
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

  async getConversationPartnerIds(userId: number): Promise<number[]> {
    const sent = await db.selectDistinct({ id: messages.receiverId })
      .from(messages)
      .where(eq(messages.senderId, userId));
    const received = await db.selectDistinct({ id: messages.senderId })
      .from(messages)
      .where(eq(messages.receiverId, userId));
    const ids = new Set<number>();
    for (const r of sent) ids.add(r.id);
    for (const r of received) ids.add(r.id);
    return Array.from(ids);
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

  async getUnreadMessageCount(userId: number): Promise<number> {
    const unreadMessages = await db.select()
      .from(messages)
      .where(and(eq(messages.receiverId, userId), eq(messages.isRead, false)));
    return unreadMessages.length;
  }

  async markAllMessagesAsRead(userId: number): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.receiverId, userId));
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

  async clearAllPrayerCompletions(): Promise<number> {
    const allCompletions = await db.select().from(prayerCompletions);
    const count = allCompletions.length;
    await db.delete(prayerCompletions);
    return count;
  }

  // Practice Resources
  async getAllPracticeResources(): Promise<PracticeResource[]> {
    return await db.select().from(practiceResources).orderBy(asc(practiceResources.order));
  }

  async getPracticeResourceByName(name: string): Promise<PracticeResource | undefined> {
    const [resource] = await db.select().from(practiceResources).where(eq(practiceResources.name, name));
    return resource;
  }

  async getPracticeResourceById(id: number): Promise<PracticeResource | undefined> {
    const [resource] = await db.select().from(practiceResources).where(eq(practiceResources.id, id));
    return resource;
  }

  async updatePracticeResourceById(id: number, data: Partial<InsertPracticeResource>): Promise<PracticeResource | undefined> {
    const [updated] = await db.update(practiceResources)
      .set(data)
      .where(eq(practiceResources.id, id))
      .returning();
    return updated;
  }

  async createPracticeResource(resource: InsertPracticeResource): Promise<PracticeResource> {
    const [newResource] = await db.insert(practiceResources).values(resource).returning();
    return newResource;
  }

  async upsertPracticeResource(resource: InsertPracticeResource): Promise<PracticeResource> {
    const existing = await this.getPracticeResourceByName(resource.name);
    if (existing) {
      const [updated] = await db.update(practiceResources)
        .set(resource)
        .where(eq(practiceResources.name, resource.name))
        .returning();
      return updated;
    }
    return this.createPracticeResource(resource);
  }

  // Track A Modules
  async getTrackAModules(): Promise<TrackAModule[]> {
    return await db.select().from(trackAModules).orderBy(asc(trackAModules.sortOrder), asc(trackAModules.weekNumber));
  }

  async upsertTrackAModule(module: InsertTrackAModule): Promise<TrackAModule> {
    const [existing] = await db.select().from(trackAModules).where(eq(trackAModules.weekNumber, module.weekNumber));
    if (existing) {
      const [updated] = await db.update(trackAModules)
        .set(module)
        .where(eq(trackAModules.weekNumber, module.weekNumber))
        .returning();
      return updated;
    }
    const sortOrderForNew = module.sortOrder ?? module.weekNumber;
    const [newModule] = await db.insert(trackAModules).values({ ...module, sortOrder: sortOrderForNew }).returning();
    return newModule;
  }

  async reorderTrackAModules(weekNumbers: number[]): Promise<void> {
    await Promise.all(
      weekNumbers.map((weekNumber, index) =>
        db.update(trackAModules)
          .set({ sortOrder: index })
          .where(eq(trackAModules.weekNumber, weekNumber))
      )
    );
  }

  // Track A Content
  async getTrackAContent(dayNumber: number): Promise<TrackAContent | undefined> {
    const [content] = await db.select().from(trackAContent).where(eq(trackAContent.dayNumber, dayNumber));
    return content;
  }

  async getTrackAContentByPosition(position: number): Promise<TrackAContent | undefined> {
    // Returns the Nth item (1-based) when content is ordered by day_number.
    // day_number is now the authoritative ordering — swapping day numbers via admin drag-and-drop
    // reorders the unlock schedule accordingly.
    const all = await db.select().from(trackAContent)
      .where(sql`${trackAContent.dayNumber} > 0`)
      .orderBy(
        asc(trackAContent.weekNumber),
        asc(trackAContent.dayNumber)
      );
    return all[position - 1];
  }

  async getAllTrackAContent(): Promise<TrackAContent[]> {
    return await db.select().from(trackAContent).orderBy(
      asc(trackAContent.weekNumber),
      asc(trackAContent.dayNumber)
    );
  }

  async reorderTrackAContent(dayNumbers: number[]): Promise<void> {
    if (dayNumbers.length === 0) return;
    const sortedDays = [...dayNumbers].sort((a, b) => a - b);
    const hasChanges = dayNumbers.some((d, i) => d !== sortedDays[i]);
    if (!hasChanges) return;

    await db.transaction(async (tx) => {
      // Step 1: move track_a_content rows to temp day_number values to avoid unique constraint violations
      for (const oldDay of dayNumbers) {
        await tx.execute(sql`UPDATE track_a_content SET day_number = ${oldDay + 10000} WHERE day_number = ${oldDay}`);
      }
      // Step 2: cascade temp values to Track A user data only, to avoid touching other tracks' records
      for (const oldDay of dayNumbers) {
        await tx.execute(sql`
          UPDATE user_answers SET day_number = ${oldDay + 10000}
          WHERE day_number = ${oldDay}
            AND user_id IN (SELECT id FROM users WHERE track = 'A')
        `);
        await tx.execute(sql`
          UPDATE prayer_completions SET day_number = ${oldDay + 10000}
          WHERE day_number = ${oldDay}
            AND user_id IN (SELECT id FROM users WHERE track = 'A')
        `);
        await tx.execute(sql`
          UPDATE survey_responses SET day_number = ${oldDay + 10000}
          WHERE day_number = ${oldDay} AND track = 'A'
        `);
      }
      // Step 3: write final day_number values — dayNumbers[i] (old) becomes sortedDays[i] (new)
      for (let i = 0; i < dayNumbers.length; i++) {
        const tempDay = dayNumbers[i] + 10000;
        const newDay = sortedDays[i];
        await tx.execute(sql`UPDATE track_a_content SET day_number = ${newDay} WHERE day_number = ${tempDay}`);
        await tx.execute(sql`
          UPDATE user_answers SET day_number = ${newDay}
          WHERE day_number = ${tempDay}
            AND user_id IN (SELECT id FROM users WHERE track = 'A')
        `);
        await tx.execute(sql`
          UPDATE prayer_completions SET day_number = ${newDay}
          WHERE day_number = ${tempDay}
            AND user_id IN (SELECT id FROM users WHERE track = 'A')
        `);
        await tx.execute(sql`
          UPDATE survey_responses SET day_number = ${newDay}
          WHERE day_number = ${tempDay} AND track = 'A'
        `);
      }
    });
  }

  async upsertTrackAContent(content: InsertTrackAContent): Promise<TrackAContent> {
    const existing = await this.getTrackAContent(content.dayNumber);
    const data = {
      ...content,
      slides: content.slides ? [...content.slides] : null,
    };
    if (existing) {
      const [updated] = await db.update(trackAContent)
        .set(data)
        .where(eq(trackAContent.dayNumber, content.dayNumber))
        .returning();
      return updated;
    }
    const [newContent] = await db.insert(trackAContent).values(data).returning();
    return newContent;
  }

  // Admin message management
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async deleteMessagesBetweenUsers(userId1: number, userId2: number): Promise<number> {
    const existing = await this.getMessagesBetweenUsers(userId1, userId2);
    const count = existing.length;
    await db.delete(messages).where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    );
    return count;
  }

  // Module Overlays
  async listModuleOverlays(): Promise<ModuleOverlay[]> {
    return await db.select().from(moduleOverlays).orderBy(asc(moduleOverlays.contextKey));
  }

  async getModuleOverlay(contextKey: string): Promise<ModuleOverlay | null> {
    const [row] = await db.select().from(moduleOverlays).where(eq(moduleOverlays.contextKey, contextKey));
    return row ?? null;
  }

  async upsertModuleOverlay(overlay: ModuleOverlay): Promise<ModuleOverlay> {
    const [row] = await db
      .insert(moduleOverlays)
      .values({ ...overlay, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: moduleOverlays.contextKey,
        set: {
          enabled: overlay.enabled,
          imageUrl: overlay.imageUrl,
          text: overlay.text,
          subtext: overlay.subtext,
          label: overlay.label,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  // Cohort Settings
  async getCohortSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(cohortSettings).where(eq(cohortSettings.key, key));
    return setting?.value ?? null;
  }

  async setCohortSetting(key: string, value: string): Promise<CohortSetting> {
    const existing = await this.getCohortSetting(key);
    if (existing !== null) {
      const [updated] = await db.update(cohortSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(cohortSettings.key, key))
        .returning();
      return updated;
    }
    const [newSetting] = await db.insert(cohortSettings).values({ key, value }).returning();
    return newSetting;
  }

  // Prelim Modules
  async getPrelimModules(): Promise<PrelimModule[]> {
    return await db.select().from(prelimModules).orderBy(asc(prelimModules.position));
  }

  async getPrelimModule(position: number): Promise<PrelimModule | undefined> {
    const [mod] = await db.select().from(prelimModules).where(eq(prelimModules.position, position));
    return mod;
  }

  async upsertPrelimModule(module: InsertPrelimModule): Promise<PrelimModule> {
    const existing = await this.getPrelimModule(module.position);
    const setValue = {
      title: module.title,
      position: module.position,
      subtitle: module.subtitle ?? null,
      slides: (module.slides ?? null) as { type: string; content: string }[] | null,
      imageUrl: module.imageUrl ?? null,
    };
    if (existing) {
      const [updated] = await db.update(prelimModules)
        .set(setValue)
        .where(eq(prelimModules.position, module.position))
        .returning();
      return updated;
    }
    const [newMod] = await db.insert(prelimModules).values(setValue).returning();
    return newMod;
  }

  async deletePrelimModule(position: number): Promise<void> {
    await db.delete(prelimModules).where(eq(prelimModules.position, position));
  }

  async getUserPrelimCompletions(userId: number): Promise<PrelimCompletion[]> {
    return await db.select().from(prelimCompletions)
      .where(eq(prelimCompletions.userId, userId))
      .orderBy(asc(prelimCompletions.modulePosition));
  }

  async completePrelimModule(userId: number, modulePosition: number): Promise<PrelimCompletion> {
    const existing = await db.select().from(prelimCompletions)
      .where(and(eq(prelimCompletions.userId, userId), eq(prelimCompletions.modulePosition, modulePosition)));
    if (existing.length > 0) return existing[0];
    const [completion] = await db.insert(prelimCompletions)
      .values({ userId, modulePosition })
      .returning();
    return completion;
  }

  // Testimonies
  async getTestimonies(): Promise<Testimony[]> {
    return await db.select().from(testimonies).orderBy(asc(testimonies.position));
  }

  async getTestimony(id: number): Promise<Testimony | undefined> {
    const [t] = await db.select().from(testimonies).where(eq(testimonies.id, id));
    return t;
  }

  async createTestimony(data: InsertTestimony): Promise<Testimony> {
    const [t] = await db.insert(testimonies).values(data).returning();
    return t;
  }

  async updateTestimony(id: number, data: Partial<InsertTestimony>): Promise<Testimony> {
    const [t] = await db.update(testimonies).set(data).where(eq(testimonies.id, id)).returning();
    return t;
  }

  async deleteTestimony(id: number): Promise<void> {
    await db.delete(testimonyParts).where(eq(testimonyParts.testimonyId, id));
    await db.delete(testimonies).where(eq(testimonies.id, id));
  }

  async getTestimonyParts(testimonyId: number): Promise<TestimonyPart[]> {
    return await db.select().from(testimonyParts)
      .where(eq(testimonyParts.testimonyId, testimonyId))
      .orderBy(asc(testimonyParts.partNumber));
  }

  async createTestimonyPart(data: InsertTestimonyPart): Promise<TestimonyPart> {
    const [p] = await db.insert(testimonyParts).values(data).returning();
    return p;
  }

  async updateTestimonyPart(id: number, data: Partial<InsertTestimonyPart>): Promise<TestimonyPart> {
    const [p] = await db.update(testimonyParts).set(data).where(eq(testimonyParts.id, id)).returning();
    return p;
  }

  async deleteTestimonyPart(id: number): Promise<void> {
    await db.delete(testimonyParts).where(eq(testimonyParts.id, id));
  }

  // Password reset tokens
  async createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [row] = await db.insert(passwordResetTokens).values({ userId, token, expiresAt }).returning();
    return row;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [row] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return row;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.token, token));
  }

  async claimPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const now = new Date();
    const [claimed] = await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now)
        )
      )
      .returning();
    return claimed ?? null;
  }

  async getUnlockedKeysForUser(userId: number): Promise<Set<string>> {
    const unlockedKeys = new Set<string>();

    // 1. Check prelim completion — user must have completed ALL prelim modules
    const [totalPrelimResult] = await db.select({ cnt: count() }).from(prelimModules);
    const [userPrelimResult] = await db.select({ cnt: count() }).from(prelimCompletions)
      .where(eq(prelimCompletions.userId, userId));
    const totalPrelim = Number(totalPrelimResult?.cnt ?? 0);
    const userPrelim = Number(userPrelimResult?.cnt ?? 0);
    if (totalPrelim > 0 && userPrelim >= totalPrelim) {
      unlockedKeys.add("prelim");
    }

    // 2. For each week 1-5, find min and max day in that week, check prayer completions
    const userCompletions = await db.select({ dayNumber: prayerCompletions.dayNumber })
      .from(prayerCompletions)
      .where(eq(prayerCompletions.userId, userId));
    const completedDays = new Set(userCompletions.map(c => c.dayNumber));

    for (let week = 1; week <= 5; week++) {
      const weekDays = await db.select({ dayNumber: trackAContent.dayNumber })
        .from(trackAContent)
        .where(eq(trackAContent.weekNumber, week));

      if (weekDays.length === 0) continue;

      const dayNumbers = weekDays.map(d => d.dayNumber).sort((a, b) => a - b);
      const firstDay = dayNumbers[0];
      const lastDay = dayNumbers[dayNumbers.length - 1];

      if (completedDays.has(firstDay)) {
        unlockedKeys.add(`week-${week}-first`);
      }
      if (completedDays.has(lastDay)) {
        unlockedKeys.add(`week-${week}-last`);
      }
    }

    return unlockedKeys;
  }

  async listTrackASnapshots(): Promise<TrackASnapshot[]> {
    return await db.select().from(trackASnapshots).orderBy(desc(trackASnapshots.createdAt));
  }

  async createTrackASnapshot(name: string): Promise<TrackASnapshot> {
    const [content, prelim] = await Promise.all([
      this.getAllTrackAContent(),
      this.getPrelimModules(),
    ]);
    const data = { track_a_content: content, prelim_modules: prelim };
    const [snap] = await db.insert(trackASnapshots).values({ name, data }).returning();
    return snap;
  }

  async restoreTrackASnapshot(id: number): Promise<void> {
    const [snap] = await db.select().from(trackASnapshots).where(eq(trackASnapshots.id, id));
    if (!snap) throw new Error(`Snapshot ${id} not found`);
    const { track_a_content, prelim_modules } = snap.data as {
      track_a_content: TrackAContent[];
      prelim_modules: PrelimModule[];
    };
    await db.transaction(async (tx) => {
      await tx.delete(trackAContent);
      await tx.delete(prelimModules);
      for (const row of track_a_content) {
        const { id: _id, ...rest } = row;
        await tx.insert(trackAContent).values(rest);
      }
      for (const row of prelim_modules) {
        const { id: _id, ...rest } = row;
        await tx.insert(prelimModules).values(rest);
      }
    });
  }

  async deleteTrackASnapshot(id: number): Promise<void> {
    await db.delete(trackASnapshots).where(eq(trackASnapshots.id, id));
  }
}

export const storage = new DatabaseStorage();
