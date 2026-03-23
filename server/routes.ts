import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertTrackAContentSchema, insertTrackAModuleSchema, uploadedImages, trackAContent, surveyResponses, prelimModules, practiceResources, chatFlowResponses, type User } from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, gt } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import sanitizeHtml from "sanitize-html";
import { dailyContentData, practiceResourcesData } from "./content-data";
import { trackAContentData } from "./track-a-content-data";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "attached_assets");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, and WebP images are allowed"));
    }
  },
});

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/aac"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only MP3, WAV, OGG, M4A, and AAC audio files are allowed"));
    }
  },
});

/**
 * Convert calendar days elapsed since cohort start to program day number.
 * Program runs Mon-Sat (6 days/week), skipping Sundays.
 * Cohort starts on a Monday (day 0 of calendar = program day 1).
 */
function calendarDaysToProgramDay(calendarDaysElapsed: number): number {
  if (calendarDaysElapsed < 0) return 0;
  const fullWeeks = Math.floor(calendarDaysElapsed / 7);
  const remainder = calendarDaysElapsed % 7;
  const extraDays = Math.min(remainder, 6);
  const programDay = fullWeeks * 6 + extraDays + 1;
  return Math.min(programDay, 30);
}

function computeCurrentProgramDay(cohortStartDateStr: string | null): number {
  if (!cohortStartDateStr) return 0;
  const startParts = cohortStartDateStr.split('-').map(Number);
  const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = today.getTime() - startDate.getTime();
  const calendarDaysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (calendarDaysElapsed < 0) return 0;
  return calendarDaysToProgramDay(calendarDaysElapsed);
}

// Rate limiters for abuse protection
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many messages, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many uploads, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { message: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

function stripHtml(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}

// Middleware to require specific roles
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user!.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

// Middleware to require authentication only
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Helper to strip sensitive fields from user objects
function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...safeUser } = user;
  return safeUser;
}

function sanitizeUsers(users: User[]): Omit<User, 'password'>[] {
  return users.map(sanitizeUser);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Authentication
  setupAuth(app);

  const express = await import("express");
  app.use("/attached_assets", express.default.static(uploadDir));

  app.get("/attached_assets/:filename", async (req, res) => {
    try {
      const [image] = await db.select().from(uploadedImages).where(eq(uploadedImages.filename, req.params.filename));
      if (!image) {
        return res.sendStatus(404);
      }
      const buffer = Buffer.from(image.data, "base64");
      res.set("Content-Type", image.mimeType);
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.send(buffer);
    } catch {
      res.sendStatus(500);
    }
  });

  app.get("/api/images/:filename", async (req, res) => {
    try {
      const [image] = await db.select().from(uploadedImages).where(eq(uploadedImages.filename, req.params.filename));
      if (!image) {
        return res.sendStatus(404);
      }
      const buffer = Buffer.from(image.data, "base64");
      res.set("Content-Type", image.mimeType);
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.send(buffer);
    } catch {
      res.sendStatus(500);
    }
  });

  app.use("/api", generalLimiter);
  
  // Apply stricter rate limiting to auth endpoints
  app.use("/api/register", authLimiter);
  app.use("/api/login", authLimiter);

  // === Users ===
  
  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const role = req.query.role as "participant" | "mentor" | undefined;
    const all = req.query.all === "true";
    
    if (req.user!.role === 'participant') {
      const partnerIds = await storage.getConversationPartnerIds(req.user!.id);
      if (partnerIds.length === 0) return res.json([]);
      const partners = await Promise.all(partnerIds.map(id => storage.getUser(id)));
      const validPartners = partners.filter((u): u is NonNullable<typeof u> => u != null && u.id !== req.user!.id);
      return res.json(sanitizeUsers(validPartners));
    }
    
    // Mentors: if requesting all users, return everyone for new conversation dialog
    if (req.user!.role === 'mentor') {
      if (all) {
        const allUsers = await storage.getAllUsers();
        return res.json(sanitizeUsers(allUsers.filter(u => u.id !== req.user!.id)));
      }
      // Default: see their own mentees plus admins (for communication)
      const allUsers = await storage.getAllUsers();
      const mentees = allUsers.filter(u => u.mentorId === req.user!.id);
      const admins = allUsers.filter(u => u.role === 'admin');
      // Combine mentees and admins (admins first for easy access)
      const contacts = [...admins, ...mentees];
      return res.json(sanitizeUsers(contacts));
    }
    
    // Admin sees all (exclude self from listing for new conversations)
    if (role) {
      const users = await storage.getUsersByRole(role);
      res.json(sanitizeUsers(users));
    } else {
      const users = await storage.getAllUsers();
      // If requesting for new conversations, exclude self
      if (all) {
        res.json(sanitizeUsers(users.filter(u => u.id !== req.user!.id)));
      } else {
        res.json(sanitizeUsers(users));
      }
    }
  });

  app.post(api.users.create.path, async (req, res) => {
    // Only admin can create users usually, but for demo maybe open? 
    // Let's restrict to admin for now, or allow open registration for 'participant'
    // For simplicity, let's allow open registration but force role='participant' if not admin
    
    // Actually, prompt says Admin creates users. So strict check.
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
       // Allow creating the FIRST admin if no users exist? 
       const allUsers = await storage.getAllUsers();
       if (allUsers.length > 0) {
           return res.status(403).json({ message: "Only admins can create users" });
       }
    }

    try {
      const input = api.users.create.input.parse(req.body);
      // Normalize email to lowercase for case-insensitive matching
      const normalizedEmail = input.email.toLowerCase().trim();
      const existing = await storage.getUserByUsername(normalizedEmail);
      if (existing) {
        return res.status(400).json({ message: "Email already taken" });
      }
      
      // Hash the password before storing
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({
        ...input,
        email: normalizedEmail,
        password: hashedPassword
      });
      res.status(201).json(sanitizeUser(user));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.users.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(403);
    
    const userId = Number(req.params.id);
    const input = api.users.update.input.parse(req.body);
    
    const updated = await storage.updateUser(userId, input);
    res.json(sanitizeUser(updated));
  });

  // === Content ===
  
  app.get(api.content.list.path, requireAuth, async (req, res) => {
      // Only admin can get full content list (for content management)
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const content = await storage.getAllDailyContent();
      res.json(content);
  });

  app.get('/api/content-summaries', requireAuth, async (req, res) => {
    const content = await storage.getAllDailyContent();
    const summaries = content.map(c => ({
      dayNumber: c.dayNumber,
      weekNumber: c.weekNumber,
      weekTitle: c.weekTitle,
      title: c.isReflectionDay ? "Weekly Reflection" : (c.morningScriptureRef || `Day ${c.dayNumber}`),
      isReflectionDay: c.isReflectionDay,
      isMentorDay: c.isMentorDay,
    }));
    res.json(summaries);
  });

  app.get(api.content.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const day = Number(req.params.day);
    
    if (req.user!.role === 'participant') {
      // Check prelim completion gate
      const completions = await storage.getUserPrelimCompletions(req.user!.id);
      const allPrelimsComplete = completions.length >= 2;
      if (!allPrelimsComplete) {
        return res.status(403).json({ message: "PRELIMS_INCOMPLETE", code: "PRELIMS_INCOMPLETE" });
      }
      // Day 0 unlocks once prelims are done (regardless of cohort start).
      // Days 1-30 require prelims done AND cohort started.
      if (day !== 0) {
        const cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
        const currentDay = computeCurrentProgramDay(cohortStartDateStr);
        if (currentDay === 0 || day > currentDay) {
          return res.status(403).json({ message: "DAY_LOCKED", code: "DAY_LOCKED" });
        }
      }
    }

    const content = await storage.getDailyContent(day);
    if (!content) return res.sendStatus(404);
    
    res.json(content);
  });

  // === Track A Content ===

  app.get('/api/track-a-content', requireAuth, async (req, res) => {
    const content = await storage.getAllTrackAContent();
    if (req.user!.role !== 'admin') {
      const summaries = content.map(c => ({
        id: c.id,
        dayNumber: c.dayNumber,
        weekNumber: c.weekNumber,
        centralTheme: c.centralTheme,
        subtitle: c.subtitle,
        imageUrl: c.imageUrl,
        completionMessage: c.completionMessage,
      }));
      return res.json(summaries);
    }
    res.json(content);
  });

  app.get('/api/track-a-content/:day', requireAuth, async (req, res) => {
    const day = Number(req.params.day);

    if (req.user!.role === 'participant') {
      // Check prelim completion gate (Day 0 also requires all prelims done)
      const completions = await storage.getUserPrelimCompletions(req.user!.id);
      const allPrelimsComplete = completions.length >= 2;
      if (!allPrelimsComplete) {
        return res.status(403).json({ message: "PRELIMS_INCOMPLETE", code: "PRELIMS_INCOMPLETE" });
      }
      // Day 0 unlocks once prelims are done (regardless of cohort start).
      // Days 1-30 require prelims done AND cohort started.
      if (day !== 0) {
        const cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
        const currentDay = computeCurrentProgramDay(cohortStartDateStr);
        if (currentDay === 0 || day > currentDay) {
          return res.status(403).json({ message: "DAY_LOCKED", code: "DAY_LOCKED" });
        }
      }
    }

    const content = await storage.getTrackAContent(day);
    if (!content) return res.sendStatus(404);
    res.json(content);
  });

  app.post('/api/admin/track-a-content', requireRole('admin'), async (req, res) => {
    try {
      const validated = insertTrackAContentSchema.parse(req.body);
      const content = await storage.upsertTrackAContent(validated);
      res.status(201).json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });

  // === Track A Modules ===

  app.get('/api/track-a-modules', requireAuth, async (req, res) => {
    const modules = await storage.getTrackAModules();
    res.json(modules);
  });

  app.post('/api/admin/track-a-modules', requireRole('admin'), async (req, res) => {
    try {
      const validated = insertTrackAModuleSchema.parse(req.body);
      const module = await storage.upsertTrackAModule(validated);
      res.status(201).json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });

  // === Image Upload ===

  app.post('/api/admin/upload-image', requireRole('admin'), uploadLimiter, upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    try {
      const ext = path.extname(req.file.originalname);
      const base = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${base}_${Date.now()}${ext}`;
      const base64Data = req.file.buffer.toString("base64");

      await db.insert(uploadedImages).values({
        filename,
        mimeType: req.file.mimetype,
        data: base64Data,
      }).onConflictDoUpdate({
        target: uploadedImages.filename,
        set: { data: base64Data, mimeType: req.file.mimetype },
      });

      const filePath = `/api/images/${filename}`;
      res.json({ url: filePath });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to save image" });
    }
  });

  app.post('/api/admin/upload-audio', requireRole('admin'), uploadLimiter, audioUpload.single('audio'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file provided" });
    }
    try {
      const ext = path.extname(req.file.originalname);
      const base = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${base}_${Date.now()}${ext}`;
      const base64Data = req.file.buffer.toString("base64");

      await db.insert(uploadedImages).values({
        filename,
        mimeType: req.file.mimetype,
        data: base64Data,
      }).onConflictDoUpdate({
        target: uploadedImages.filename,
        set: { data: base64Data, mimeType: req.file.mimetype },
      });

      const filePath = `/api/images/${filename}`;
      res.json({ url: filePath });
    } catch (error) {
      console.error("Audio upload error:", error);
      res.status(500).json({ message: "Failed to save audio" });
    }
  });

  // === Survey Responses ===

  const surveyBatchSchema = z.object({
    track: z.string(),
    dayNumber: z.number().int(),
    responses: z.array(z.object({
      questionIndex: z.number().int(),
      questionLabel: z.string(),
      questionType: z.string(),
      response: z.string(),
    })).min(1),
  });

  // Submit survey responses (batch)
  app.post('/api/survey-responses', requireAuth, writeLimiter, async (req, res) => {
    try {
      const body = surveyBatchSchema.parse(req.body);
      const userId = req.user!.id;
      const rows = body.responses.map(r => ({
        userId,
        track: body.track,
        dayNumber: body.dayNumber,
        questionIndex: r.questionIndex,
        questionLabel: r.questionLabel,
        questionType: r.questionType,
        response: r.response,
      }));
      await db.insert(surveyResponses).values(rows);
      res.status(201).json({ success: true });
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid request", errors: e.errors });
      console.error("Survey submit error:", e);
      res.status(500).json({ message: "Failed to save survey responses" });
    }
  });

  // Check if current user already submitted a survey for a given day
  app.get('/api/survey-responses/submitted', requireAuth, async (req, res) => {
    try {
      const dayNumber = parseInt(req.query.dayNumber as string);
      if (isNaN(dayNumber)) return res.status(400).json({ message: "dayNumber required" });
      const userId = req.user!.id;
      const existing = await db.select({ id: surveyResponses.id })
        .from(surveyResponses)
        .where(and(eq(surveyResponses.userId, userId), eq(surveyResponses.dayNumber, dayNumber)))
        .limit(1);
      res.json({ submitted: existing.length > 0 });
    } catch (e) {
      console.error("Survey check error:", e);
      res.status(500).json({ message: "Failed to check survey status" });
    }
  });

  // Admin: get all survey responses for a track + day
  app.get('/api/admin/survey-responses', requireRole('admin'), async (req, res) => {
    try {
      const track = req.query.track as string | undefined;
      const dayNumber = req.query.dayNumber !== undefined ? parseInt(req.query.dayNumber as string) : undefined;
      const hasTrack = !!track;
      const hasDay = dayNumber !== undefined && !isNaN(dayNumber);
      let rows;
      if (hasTrack && hasDay) {
        rows = await db.select().from(surveyResponses)
          .where(and(eq(surveyResponses.track, track!), eq(surveyResponses.dayNumber, dayNumber!)))
          .orderBy(surveyResponses.submittedAt);
      } else if (hasTrack) {
        rows = await db.select().from(surveyResponses)
          .where(eq(surveyResponses.track, track!))
          .orderBy(surveyResponses.submittedAt);
      } else if (hasDay) {
        rows = await db.select().from(surveyResponses)
          .where(eq(surveyResponses.dayNumber, dayNumber!))
          .orderBy(surveyResponses.submittedAt);
      } else {
        rows = await db.select().from(surveyResponses).orderBy(surveyResponses.submittedAt);
      }
      res.json(rows);
    } catch (e) {
      console.error("Admin survey responses error:", e);
      res.status(500).json({ message: "Failed to fetch survey responses" });
    }
  });

  // === Answers ===

  app.get(api.answers.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    let targetUserId = req.user!.id;
    
    // Mentors/Admins can view others
    if (req.query.userId && (req.user!.role === 'mentor' || req.user!.role === 'admin')) {
      targetUserId = Number(req.query.userId);
      // Mentor check: is this my mentee?
      if (req.user!.role === 'mentor') {
          const targetUser = await storage.getUser(targetUserId);
          if (targetUser?.mentorId !== req.user!.id) {
              return res.sendStatus(403);
          }
      }
    }
    
    const answers = await storage.getUserAnswers(targetUserId);
    res.json(answers);
  });

  app.post(api.answers.create.path, writeLimiter, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const input = api.answers.create.input.parse(req.body);
    
    const answer = await storage.createUserAnswer({
      ...input,
      content: stripHtml(input.content),
      userId: req.user!.id
    });
    
    res.status(201).json(answer);
  });

  // === Chat ===

  // Unread message count - must be BEFORE the :otherUserId route
  app.get(api.chat.unreadCount.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const count = await storage.getUnreadMessageCount(req.user!.id);
    res.json({ count });
  });

  // Mark all messages as read for the current user
  app.post("/api/messages/mark-read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await storage.markAllMessagesAsRead(req.user!.id);
    res.json({ success: true });
  });

  app.get(api.chat.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const otherUserId = Number(req.params.otherUserId);
    const otherUser = await storage.getUser(otherUserId);
    if (!otherUser) return res.status(404).json({ message: "User not found" });
    
    // Access control:
    // - Participants can only view messages with their mentor
    // - Mentors can view messages with their mentees OR admins
    // - Admins can view messages with anyone
    if (req.user!.role === 'participant') {
      if (!req.user!.mentorId) {
        return res.status(403).json({ message: "No mentor assigned" });
      }
      if (otherUserId !== req.user!.mentorId) {
        return res.status(403).json({ message: "You can only view messages with your mentor" });
      }
    } else if (req.user!.role === 'mentor') {
      const isMentee = otherUser.mentorId === req.user!.id;
      const isAdmin = otherUser.role === 'admin';
      if (!isMentee && !isAdmin) {
        return res.status(403).json({ message: "You can only view messages with your mentees or admin" });
      }
    }
    
    const messages = await storage.getMessages(req.user!.id, otherUserId);
    res.json(messages);
  });

  app.post(api.chat.send.path, messageLimiter, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const input = api.chat.send.input.parse(req.body);
    const receiver = await storage.getUser(input.receiverId);
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });
    
    if (req.user!.role === 'participant') {
      if (input.receiverId !== req.user!.mentorId) {
        return res.status(403).json({ message: "You can only message your assigned mentor" });
      }
    } else if (req.user!.role === 'mentor') {
      const isMentee = receiver.mentorId === req.user!.id;
      const isAdmin = receiver.role === 'admin';
      if (!isMentee && !isAdmin) {
        return res.status(403).json({ message: "You can only message your mentees or admin" });
      }
    }

    const message = await storage.createMessage({
      senderId: req.user!.id,
      receiverId: input.receiverId,
      content: stripHtml(input.content)
    });
    
    res.status(201).json(message);
  });

  // === Track Requirements ===
  
  app.get(api.trackRequirements.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const track = req.params.track as "A" | "B" | "C";
    const reqs = await storage.getAllTrackRequirements(track);
    res.json(reqs);
  });

  app.get(api.trackRequirements.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const track = req.params.track as "A" | "B" | "C";
    const week = Number(req.params.week);
    const req_ = await storage.getTrackRequirements(track, week);
    if (!req_) return res.status(404).json({ message: "Requirements not found" });
    res.json(req_);
  });

  // === Practice Resources ===
  
  app.get(api.practiceResources.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const resources = await storage.getAllPracticeResources();
    res.json(resources);
  });

  app.get(api.practiceResources.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const identifier = decodeURIComponent(String(req.params.idOrName ?? req.params.name));
    const numericId = parseInt(identifier, 10);
    const resource = (!isNaN(numericId) && String(numericId) === identifier)
      ? await storage.getPracticeResourceById(numericId)
      : await storage.getPracticeResourceByName(identifier);
    if (!resource) return res.status(404).json({ message: "Practice resource not found" });
    res.json(resource);
  });

  app.put("/api/practice-resources/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "admin") return res.sendStatus(403);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const resource = await storage.updatePracticeResourceById(id, req.body);
    if (!resource) return res.status(404).json({ message: "Practice resource not found" });
    res.json(resource);
  });

  // === Prayer Completions ===
  
  app.get(api.prayerCompletions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    let targetUserId = req.user!.id;
    
    // Mentors/Admins can view others' completions
    if (req.query.userId && (req.user!.role === 'mentor' || req.user!.role === 'admin')) {
      targetUserId = Number(req.query.userId);
      // Mentor check: is this my mentee?
      if (req.user!.role === 'mentor') {
        const targetUser = await storage.getUser(targetUserId);
        if (targetUser?.mentorId !== req.user!.id) {
          return res.sendStatus(403);
        }
      }
    }
    
    const completions = await storage.getUserPrayerCompletions(targetUserId);
    res.json(completions);
  });

  app.get(api.prayerCompletions.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const day = Number(req.params.day);
    const period = req.params.period as "morning" | "evening";
    
    const completion = await storage.getPrayerCompletion(req.user!.id, day, period);
    res.json(completion || null);
  });

  app.post(api.prayerCompletions.create.path, writeLimiter, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const input = api.prayerCompletions.create.input.parse(req.body);
    
    if (req.user!.role === 'participant') {
      const cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
      const currentDay = computeCurrentProgramDay(cohortStartDateStr);
      if (input.dayNumber > currentDay || currentDay === 0) {
        return res.status(403).json({ message: "Cannot complete prayers for this day" });
      }
    }
    
    // Check if already completed
    const existing = await storage.getPrayerCompletion(req.user!.id, input.dayNumber, input.period);
    if (existing) {
      return res.status(400).json({ message: "Already completed" });
    }
    
    const completion = await storage.createPrayerCompletion({
      userId: req.user!.id,
      dayNumber: input.dayNumber,
      period: input.period
    });
    
    res.status(201).json(completion);
  });

  app.delete(api.prayerCompletions.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const day = Number(req.params.day);
    const period = req.params.period as "morning" | "evening";
    
    const existing = await storage.getPrayerCompletion(req.user!.id, day, period);
    if (!existing) {
      return res.status(404).json({ message: "Completion not found" });
    }
    
    await storage.deletePrayerCompletion(req.user!.id, day, period);
    res.json({ message: "Completion removed" });
  });

  // === Admin Routes ===

  app.post(api.admin.createContent.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const input = api.admin.createContent.input.parse(req.body);
    const content = await storage.upsertDailyContent(input);
    res.status(201).json(content);
  });

  app.delete(api.admin.deleteUser.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const userId = Number(req.params.id);
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    await storage.deleteUser(userId);
    res.json({ message: "User deleted" });
  });

  app.get(api.admin.progress.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const users = await storage.getAllUsers();
    const completions = await storage.getAllPrayerCompletions();
    
    const cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
    const cohortCurrentDay = computeCurrentProgramDay(cohortStartDateStr);
    
    const progressData = users
      .filter(u => u.role === 'participant')
      .map(u => {
        const currentDay = cohortCurrentDay;
        
        // Get completions for this user
        const userCompletions = completions.filter(c => c.userId === u.id);
        
        // Count unique days where BOTH morning and evening are complete
        const dayCompletionMap = new Map<number, { morning: boolean, evening: boolean }>();
        userCompletions.forEach(c => {
          if (!dayCompletionMap.has(c.dayNumber)) {
            dayCompletionMap.set(c.dayNumber, { morning: false, evening: false });
          }
          const day = dayCompletionMap.get(c.dayNumber)!;
          if (c.period === 'morning') day.morning = true;
          if (c.period === 'evening') day.evening = true;
        });
        
        let daysCompleted = 0;
        dayCompletionMap.forEach((status) => {
          if (u.track === 'A') {
            if (status.morning) daysCompleted++;
          } else {
            if (status.morning && status.evening) daysCompleted++;
          }
        });
        
        // Check today's completion
        const todayStatus = dayCompletionMap.get(currentDay) || { morning: false, evening: false };
        
        // Find mentor name
        const mentor = users.find(m => m.id === u.mentorId);
        
        return {
          userId: u.id,
          userName: u.name,
          userEmail: u.email,
          role: u.role,
          track: u.track,
          mentorName: mentor?.name || null,
          startDate: u.startDate ? new Date(u.startDate).toISOString() : null,
          currentDay,
          daysCompleted,
          morningToday: todayStatus.morning,
          eveningToday: todayStatus.evening,
        };
      });
    
    res.json(progressData);
  });

  // === Cohort (Public) ===
  
  app.get(api.cohort.getStartDate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const startDateStr = await storage.getCohortSetting("cohort_start_date");
    const currentDay = computeCurrentProgramDay(startDateStr);
    
    res.json({ startDate: startDateStr, currentDay });
  });

  // === Cohort Settings (Admin) ===
  
  app.get(api.admin.cohortSettings.get.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const startDate = await storage.getCohortSetting("cohort_start_date");
    res.json({ startDate });
  });

  app.post(api.admin.cohortSettings.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const { startDate } = req.body;
    if (!startDate || typeof startDate !== 'string') {
      return res.status(400).json({ message: "Start date is required" });
    }
    
    await storage.setCohortSetting("cohort_start_date", startDate);
    res.json({ startDate });
  });

  // === Reflection Overlay Settings ===

  app.get('/api/reflection-overlay', requireAuth, async (req, res) => {
    const [imageUrl, text, subtext] = await Promise.all([
      storage.getCohortSetting("reflection_overlay_image"),
      storage.getCohortSetting("reflection_overlay_text"),
      storage.getCohortSetting("reflection_overlay_subtext"),
    ]);
    res.json({
      imageUrl: imageUrl ?? "",
      text: text ?? "Reflection Unlocked",
      subtext: subtext ?? "",
    });
  });

  app.post('/api/admin/reflection-overlay', requireRole('admin'), async (req, res) => {
    const schema = z.object({
      imageUrl: z.string(),
      text: z.string(),
      subtext: z.string(),
    });
    try {
      const { imageUrl, text, subtext } = schema.parse(req.body);
      await Promise.all([
        storage.setCohortSetting("reflection_overlay_image", imageUrl),
        storage.setCohortSetting("reflection_overlay_text", text),
        storage.setCohortSetting("reflection_overlay_subtext", subtext),
      ]);
      res.json({ imageUrl, text, subtext });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  // === Start New Cohort ===
  
  app.post(api.admin.startNewCohort.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const input = api.admin.startNewCohort.input.parse(req.body);
      
      let completionsCleared = 0;
      let agreementsCleared = 0;
      
      if (input.clearCompletions) {
        completionsCleared = await storage.clearAllPrayerCompletions();
      }
      
      // Always clear agreement signatures when starting a new cohort
      // This forces all users back to Day 0
      agreementsCleared = await storage.clearAllAgreementSignatures();
      
      await storage.setCohortSetting("cohort_start_date", input.startDate);
      
      res.json({ 
        message: "New cohort started successfully",
        startDate: input.startDate,
        completionsCleared,
        agreementsCleared
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Admin Password Reset ===
  
  app.post(api.admin.resetPassword.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const userId = Number(req.params.id);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    try {
      const input = api.admin.resetPassword.input.parse(req.body);
      const hashedPassword = await hashPassword(input.newPassword);
      await storage.updateUser(userId, { password: hashedPassword });
      res.json({ message: "Password reset successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Admin User Details ===
  
  app.get(api.admin.userDetails.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const userId = Number(req.params.id);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get mentor name
    let mentorName: string | null = null;
    if (user.mentorId) {
      const mentor = await storage.getUser(user.mentorId);
      mentorName = mentor?.name || null;
    }
    
    const cohortStartDate = await storage.getCohortSetting("cohort_start_date");
    const currentDay = computeCurrentProgramDay(cohortStartDate);
    
    // Get prayer completions
    const prayerCompletions = await storage.getUserPrayerCompletions(userId);
    
    // Calculate days completed based on track
    let daysCompleted: number;
    if (user.track === 'A') {
      daysCompleted = new Set(prayerCompletions.filter(c => c.period === 'morning').map(c => c.dayNumber)).size;
    } else {
      const dayMap = new Map<number, { morning: boolean, evening: boolean }>();
      prayerCompletions.forEach(c => {
        if (!dayMap.has(c.dayNumber)) dayMap.set(c.dayNumber, { morning: false, evening: false });
        const d = dayMap.get(c.dayNumber)!;
        if (c.period === 'morning') d.morning = true;
        if (c.period === 'evening') d.evening = true;
      });
      daysCompleted = 0;
      dayMap.forEach(s => { if (s.morning && s.evening) daysCompleted++; });
    }
    
    // Graduation: 80% of 30 days = 24 days
    const graduationEligible = daysCompleted >= 24;
    
    // Get answers
    const answers = await storage.getUserAnswers(userId);
    
    // Get all daily content to get questions
    const allContent = await storage.getAllDailyContent();
    
    // Enrich answers with question texts
    const enrichedAnswers = answers.map(a => {
      const dayContent = allContent.find(c => c.dayNumber === a.dayNumber);
      return {
        id: a.id,
        dayNumber: a.dayNumber,
        content: a.content,
        createdAt: a.createdAt.toISOString(),
        questions: dayContent?.eveningQuestions || null,
      };
    });
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        track: user.track,
        mentorId: user.mentorId,
        mentorName,
        startDate: user.startDate?.toISOString() || null,
        agreementSignedAt: user.agreementSignedAt?.toISOString() || null,
        currentDay,
        daysCompleted,
        totalPossibleDays: currentDay,
        graduationEligible,
      },
      answers: enrichedAnswers,
      prayerCompletions: prayerCompletions.map(c => ({
        dayNumber: c.dayNumber,
        period: c.period,
        completedAt: c.completedAt.toISOString(),
      })),
    });
  });

  // === Day 0 Settings (Admin) ===
  
  app.get(api.admin.day0Settings.get.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const introVideoUrl = await storage.getCohortSetting("day0_intro_video_url");
    const introContent = await storage.getCohortSetting("day0_intro_content");
    const agreementText = await storage.getCohortSetting("day0_agreement_text");
    res.json({ introVideoUrl, introContent, agreementText });
  });

  app.post(api.admin.day0Settings.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const { introVideoUrl, introContent, agreementText } = req.body;
    
    if (introVideoUrl !== undefined) {
      await storage.setCohortSetting("day0_intro_video_url", introVideoUrl);
    }
    if (introContent !== undefined) {
      await storage.setCohortSetting("day0_intro_content", introContent);
    }
    if (agreementText !== undefined) {
      await storage.setCohortSetting("day0_agreement_text", agreementText);
    }
    
    res.json({ message: "Day 0 settings updated" });
  });

  // === Day 0 (User) ===
  
  app.get(api.day0.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Day 0 agreement requires all prelim modules completed first
    if (req.user!.role === 'participant') {
      const [allModules, completions] = await Promise.all([
        storage.getPrelimModules(),
        storage.getUserPrelimCompletions(req.user!.id),
      ]);
      if (completions.length < allModules.length) {
        return res.status(403).json({ message: "PRELIMS_INCOMPLETE", code: "PRELIMS_INCOMPLETE" });
      }
    }
    
    const introVideoUrl = await storage.getCohortSetting("day0_intro_video_url");
    const agreementText = await storage.getCohortSetting("day0_agreement_text");
    const agreementSigned = !!req.user!.agreementSignedAt;
    
    const day0TrackAContent = await storage.getTrackAContent(0);
    const introSlides = day0TrackAContent?.slides || null;
    
    const introContent = await storage.getCohortSetting("day0_intro_content");
    
    res.json({ introVideoUrl, introContent, introSlides, agreementText, agreementSigned });
  });

  app.post(api.day0.signAgreement.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Agreement requires all prelim modules completed first
    if (req.user!.role === 'participant') {
      const [allModules, completions] = await Promise.all([
        storage.getPrelimModules(),
        storage.getUserPrelimCompletions(req.user!.id),
      ]);
      if (completions.length < allModules.length) {
        return res.status(403).json({ message: "PRELIMS_INCOMPLETE", code: "PRELIMS_INCOMPLETE" });
      }
    }
    
    if (req.user!.agreementSignedAt) {
      return res.status(400).json({ message: "Agreement already signed" });
    }
    
    await storage.updateUser(req.user!.id, { agreementSignedAt: new Date() });
    res.json({ message: "Agreement signed successfully" });
  });

  // === Admin CSV Export Routes ===
  
  // Helper to escape CSV values (with formula injection protection)
  function escapeCSV(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) return '';
    let str = String(value);
    
    // Prevent CSV formula injection by prefixing with single quote
    // Values starting with =, +, -, @, tab, or carriage return can execute formulas in Excel
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  app.get(api.admin.exportUsers.path, requireRole('admin'), async (req, res) => {
    const users = await storage.getAllUsers();
    
    const headers = ['ID', 'Name', 'Email', 'Role', 'Track', 'Mentor ID', 'Start Date', 'Agreement Signed'];
    const rows = users.map(u => [
      escapeCSV(u.id),
      escapeCSV(u.name),
      escapeCSV(u.email),
      escapeCSV(u.role),
      escapeCSV(u.track),
      escapeCSV(u.mentorId),
      escapeCSV(u.startDate ? new Date(u.startDate).toISOString() : null),
      escapeCSV(u.agreementSignedAt ? new Date(u.agreementSignedAt).toISOString() : null),
    ].join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
    res.send(csv);
  });

  app.get(api.admin.exportAnswers.path, requireRole('admin'), async (req, res) => {
    const users = await storage.getAllUsers();
    const allAnswers: Array<{userId: number, userName: string, dayNumber: number, content: string, createdAt: Date}> = [];
    
    for (const u of users.filter(u => u.role === 'participant')) {
      const answers = await storage.getUserAnswers(u.id);
      answers.forEach(a => {
        allAnswers.push({
          userId: u.id,
          userName: u.name,
          dayNumber: a.dayNumber,
          content: a.content,
          createdAt: a.createdAt,
        });
      });
    }
    
    const headers = ['User ID', 'User Name', 'Day Number', 'Response', 'Submitted At'];
    const rows = allAnswers.map(a => [
      escapeCSV(a.userId),
      escapeCSV(a.userName),
      escapeCSV(a.dayNumber),
      escapeCSV(a.content),
      escapeCSV(new Date(a.createdAt).toISOString()),
    ].join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="answers_export.csv"');
    res.send(csv);
  });

  app.get(api.admin.exportProgress.path, requireRole('admin'), async (req, res) => {
    const users = await storage.getAllUsers();
    const completions = await storage.getAllPrayerCompletions();
    
    const cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
    const cohortCurrentDay = computeCurrentProgramDay(cohortStartDateStr);
    
    const progressData = users
      .filter(u => u.role === 'participant')
      .map(u => {
        const currentDay = cohortCurrentDay;
        const userCompletions = completions.filter(c => c.userId === u.id);
        
        const dayCompletionMap = new Map<number, { morning: boolean, evening: boolean }>();
        userCompletions.forEach(c => {
          if (!dayCompletionMap.has(c.dayNumber)) {
            dayCompletionMap.set(c.dayNumber, { morning: false, evening: false });
          }
          const day = dayCompletionMap.get(c.dayNumber)!;
          if (c.period === 'morning') day.morning = true;
          if (c.period === 'evening') day.evening = true;
        });
        
        let daysCompleted = 0;
        dayCompletionMap.forEach((status) => {
          if (u.track === 'A') {
            if (status.morning) daysCompleted++;
          } else {
            if (status.morning && status.evening) daysCompleted++;
          }
        });
        
        const mentor = users.find(m => m.id === u.mentorId);
        const completionRate = currentDay > 0 ? ((daysCompleted / currentDay) * 100).toFixed(1) : '0.0';
        const graduationStatus = daysCompleted >= 24 ? 'Passed' : 
          (currentDay >= 30 ? 'At Risk' : 'In Progress');
        
        return {
          userId: u.id,
          userName: u.name,
          userEmail: u.email,
          track: u.track,
          mentorName: mentor?.name || '',
          currentDay,
          daysCompleted,
          completionRate,
          graduationStatus,
        };
      });
    
    const headers = ['User ID', 'Name', 'Email', 'Track', 'Mentor', 'Current Day', 'Days Completed', 'Completion Rate %', 'Status'];
    const rows = progressData.map(p => [
      escapeCSV(p.userId),
      escapeCSV(p.userName),
      escapeCSV(p.userEmail),
      escapeCSV(p.track),
      escapeCSV(p.mentorName),
      escapeCSV(p.currentDay),
      escapeCSV(p.daysCompleted),
      escapeCSV(p.completionRate),
      escapeCSV(p.graduationStatus),
    ].join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="progress_export.csv"');
    res.send(csv);
  });
  
  // === Admin Message Management ===

  app.get('/api/admin/messages/:userId1/:userId2', requireRole('admin'), async (req, res) => {
    const userId1 = Number(req.params.userId1);
    const userId2 = Number(req.params.userId2);
    if (isNaN(userId1) || isNaN(userId2)) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }
    const msgs = await storage.getMessagesBetweenUsers(userId1, userId2);
    res.json(msgs);
  });

  app.delete('/api/admin/messages/:userId1/:userId2', requireRole('admin'), async (req, res) => {
    const userId1 = Number(req.params.userId1);
    const userId2 = Number(req.params.userId2);
    if (isNaN(userId1) || isNaN(userId2)) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }
    const count = await storage.deleteMessagesBetweenUsers(userId1, userId2);
    res.json({ message: `Deleted ${count} messages`, count });
  });

  // === Prelim Modules ===

  // GET /api/prelim-modules — returns all 3 modules with user completion status
  app.get('/api/prelim-modules', requireAuth, async (req, res) => {
    const modules = await storage.getPrelimModules();
    const userId = req.user!.id;
    let completedPositions: number[] = [];
    if (req.user!.role === 'participant') {
      const completions = await storage.getUserPrelimCompletions(userId);
      completedPositions = completions.map(c => c.modulePosition);
    }
    const result = modules.map(m => ({
      ...m,
      completed: completedPositions.includes(m.position),
    }));
    res.json(result);
  });

  // POST /api/prelim-modules/:position/complete — mark a prelim module as done
  app.post('/api/prelim-modules/:position/complete', requireAuth, async (req, res) => {
    if (req.user!.role !== 'participant') {
      return res.status(403).json({ message: "Only participants can complete prelim modules." });
    }
    const position = Number(req.params.position);
    if (isNaN(position) || position < 1) {
      return res.status(400).json({ message: "Invalid module position." });
    }
    const allModules = await storage.getPrelimModules();
    if (position > allModules.length) {
      return res.status(400).json({ message: "Invalid module position." });
    }
    const userId = req.user!.id;
    // Enforce sequential unlock: must have completed position-1 first
    if (position > 1) {
      const completions = await storage.getUserPrelimCompletions(userId);
      const completedPositions = completions.map(c => c.modulePosition);
      if (!completedPositions.includes(position - 1)) {
        return res.status(403).json({ message: "You must complete the previous module first." });
      }
    }
    const completion = await storage.completePrelimModule(userId, position);
    res.json(completion);
  });

  // GET /api/chat-flow-responses/:contextKey — get all variable answers for current user in a given flow
  app.get('/api/chat-flow-responses/:contextKey', requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const contextKey = String(req.params.contextKey);
    try {
      const rows = await db
        .select()
        .from(chatFlowResponses)
        .where(and(eq(chatFlowResponses.userId, userId), eq(chatFlowResponses.contextKey, contextKey)));
      const result: Record<string, string> = {};
      for (const row of rows) {
        result[row.variableName] = row.answer;
      }
      res.json(result);
    } catch (err) {
      console.error("Error fetching chat flow responses:", err);
      res.status(500).json({ message: "Failed to fetch responses." });
    }
  });

  // POST /api/chat-flow-responses/:contextKey — upsert a variable answer for current user
  app.post('/api/chat-flow-responses/:contextKey', requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const contextKey = String(req.params.contextKey);
    const { variableName, answer } = req.body;
    if (!variableName || typeof variableName !== 'string') {
      return res.status(400).json({ message: "variableName is required." });
    }
    if (answer === undefined || answer === null) {
      return res.status(400).json({ message: "answer is required." });
    }
    const answerStr = String(answer);
    try {
      await db
        .insert(chatFlowResponses)
        .values({ userId, contextKey, variableName, answer: answerStr })
        .onConflictDoUpdate({
          target: [chatFlowResponses.userId, chatFlowResponses.contextKey, chatFlowResponses.variableName],
          set: { answer: answerStr, updatedAt: new Date() },
        });
      res.json({ ok: true });
    } catch (err) {
      console.error("Error saving chat flow response:", err);
      res.status(500).json({ message: "Failed to save response." });
    }
  });

  // PUT /api/admin/prelim-modules/:position — admin-only update of module content
  app.put('/api/admin/prelim-modules/:position', requireRole('admin'), async (req, res) => {
    const position = Number(req.params.position);
    if (isNaN(position) || position < 1) {
      return res.status(400).json({ message: "Invalid module position." });
    }
    try {
      const { title, subtitle, slides, imageUrl } = req.body;
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: "Title is required." });
      }
      const module = await storage.upsertPrelimModule({ position, title, subtitle: subtitle || null, slides: slides || null, imageUrl: imageUrl || null });
      res.json(module);
    } catch (error) {
      console.error("Error updating prelim module:", error);
      res.status(500).json({ message: "Failed to update module." });
    }
  });

  // DELETE /api/admin/prelim-modules/:position — admin-only removal of a module
  app.delete('/api/admin/prelim-modules/:position', requireRole('admin'), async (req, res) => {
    const position = Number(req.params.position);
    if (isNaN(position) || position < 1) {
      return res.status(400).json({ message: "Invalid module position." });
    }
    try {
      await storage.deletePrelimModule(position);
      res.json({ message: "Module deleted." });
    } catch (error) {
      console.error("Error deleting prelim module:", error);
      res.status(500).json({ message: "Failed to delete module." });
    }
  });

  // Seed Data
  await seed();

  return httpServer;
}

async function migrateFilesystemImages() {
  try {
    const files = fs.readdirSync(uploadDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    if (files.length === 0) return;

    const existing = await db.select({ filename: uploadedImages.filename }).from(uploadedImages);
    const existingSet = new Set(existing.map(e => e.filename));

    let migrated = 0;
    for (const file of files) {
      if (existingSet.has(file)) continue;
      const filePath = path.join(uploadDir, file);
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(file).toLowerCase();
      const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
      await db.insert(uploadedImages).values({
        filename: file,
        mimeType,
        data: buffer.toString("base64"),
      }).onConflictDoNothing();
      migrated++;
    }
    if (migrated > 0) {
      console.log(`Migrated ${migrated} filesystem images to database.`);
    }
  } catch (e) {
    console.warn("Image migration warning (non-fatal):", e);
  }
}

async function ensureSchemaColumns() {
  try {
    const checkCol = async (table: string, column: string, colType: string) => {
      const result = await db.execute(sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = ${table} AND column_name = ${column}
      `);
      if (result.rows.length === 0) {
        await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN ${column} ${colType}`));
        console.log(`Added column ${column} to ${table}`);
      }
    };
    await checkCol("track_a_content", "saint_name", "TEXT");
    await checkCol("track_a_content", "saint_image", "TEXT");
    await checkCol("track_a_content", "saint_quote", "TEXT");

    // Create survey_responses table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS survey_responses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        track TEXT NOT NULL,
        day_number INTEGER NOT NULL,
        question_index INTEGER NOT NULL,
        question_label TEXT NOT NULL,
        question_type TEXT NOT NULL,
        response TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create prelim_modules table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS prelim_modules (
        id SERIAL PRIMARY KEY,
        position INTEGER NOT NULL UNIQUE,
        title TEXT NOT NULL,
        subtitle TEXT,
        slides JSON
      )
    `);

    // Create prelim_completions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS prelim_completions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        module_position INTEGER NOT NULL,
        completed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, module_position)
      )
    `);
  } catch (e) {
    console.warn("Schema migration warning (non-fatal):", e);
  }
}

async function seed() {
    await ensureSchemaColumns();
    await migrateFilesystemImages();

    // NOTE: do NOT delete prelim modules — admin can create up to 3 (or more)

    // Seed users if needed
    const users = await storage.getAllUsers();
    if (users.length === 0) {
        console.log("Seeding users...");
        
        // Hash passwords for security
        const adminHash = await hashPassword("admin");
        const passwordHash = await hashPassword("password");
        
        await storage.createUser({
            name: "Admin User",
            email: "admin@example.com",
            password: adminHash,
            role: "admin",
            startDate: new Date(),
        });
        
        const mentor = await storage.createUser({
            name: "Mentor Mike",
            email: "mentor@example.com",
            password: passwordHash,
            role: "mentor",
            startDate: new Date(),
        });
        
        await storage.createUser({
            name: "Participant Paul",
            email: "paul@example.com",
            password: passwordHash,
            role: "participant",
            track: "A",
            mentorId: mentor.id,
            startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Started 3 days ago
        });
    }

    // Seed track requirements if needed
    const existingReqs = await storage.getAllTrackRequirements("A");
    if (existingReqs.length === 0) {
        console.log("Seeding Track A requirements...");
        
        // Track A Week 1
        await storage.createTrackRequirement({
            track: "A",
            weekNumber: 1,
            morningPractices: ["Prayer Against Retaliation", "Miracle Prayer"],
            eveningPractices: ["Examen – St Ignatius", "Lectio Divina – 10 Minutes"],
            additionalRequirements: ["Abstinence Fridays Only", "Monthly Confession, or as Needed"]
        });
        
        // Track A Week 2
        await storage.createTrackRequirement({
            track: "A",
            weekNumber: 2,
            morningPractices: ["Prayer Against Retaliation", "Miracle Prayer"],
            eveningPractices: ["Examen – St Ignatius", "Silence – 5 Minutes", "Lectio Divina – 10 Minutes"],
            additionalRequirements: ["Abstinence Fridays Only", "Monthly Confession, or as Needed"]
        });
        
        // Track A Week 3
        await storage.createTrackRequirement({
            track: "A",
            weekNumber: 3,
            morningPractices: ["Prayer Against Retaliation", "Miracle Prayer"],
            eveningPractices: ["Examen – St Ignatius", "Silence – 5 Minutes", "Lectio Divina – 10 Minutes"],
            additionalRequirements: ["Abstinence Fridays Only", "Monthly Confession, or as Needed"]
        });
        
        // Track A Week 4
        await storage.createTrackRequirement({
            track: "A",
            weekNumber: 4,
            morningPractices: ["Prayer Against Retaliation", "Miracle Prayer", "Silence – 5 Minutes", "Lectio Divina – 10 Minutes"],
            eveningPractices: ["Rosary – OP + 1 Decade", "Examen – St Ignatius"],
            additionalRequirements: ["Abstinence Fridays Only", "Monthly Confession, or as Needed"]
        });
        
        // Track A Week 5
        await storage.createTrackRequirement({
            track: "A",
            weekNumber: 5,
            morningPractices: ["Prayer Against Retaliation", "Miracle Prayer", "Silence – 5 Minutes", "Lectio Divina – 10 Minutes"],
            eveningPractices: ["Rosary – OP + 1 Decade", "Examen – St Ignatius"],
            additionalRequirements: ["Abstinence Fridays Only", "Monthly Confession, or as Needed"]
        });
    }

    // Force-reset practice resources to the canonical set on every startup
    // (admin management of resources is removed; this ensures prod/staging always match)
    {
        console.log("Force-resetting practice resources to canonical set...");
        await db.delete(practiceResources);

        const canonicalResources = [
            {
                name: "The Rosary",
                type: "practice" as const,
                duration: "15-20 minutes",
                order: 1,
                subtitle: "The greatest weapon of our faith",
                imageUrl: "/caravaggio-rosary.webp",
                content: `**How to Pray the Rosary**

The Rosary is a powerful meditation on the life of Christ through the eyes of Mary. Follow these steps:

**Step 1: Make the Sign of the Cross**
In the name of the Father, and of the Son, and of the Holy Spirit. Amen.

**Step 2: Pray the Apostles' Creed** (holding the Crucifix)
I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead.

I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.

**Step 3: Pray the Our Father** (first large bead)
Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.

**Step 4: Pray Three Hail Marys** (for Faith, Hope, and Charity)
Hail Mary, full of grace, the Lord is with you; blessed are you among women, and blessed is the fruit of your womb, Jesus. Holy Mary, Mother of God, pray for us sinners now and at the hour of our death. Amen.

**Step 5: Pray the Glory Be**
Glory be to the Father, and to the Son, and to the Holy Spirit, as it was in the beginning, is now, and ever shall be, world without end. Amen.

**Step 6: Announce the First Mystery, then pray the Our Father**

**Step 7: Pray Ten Hail Marys** while meditating on the Mystery

**Step 8: Pray the Glory Be**
Optional: Pray the Fatima Prayer - "O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to Heaven, especially those most in need of Thy mercy."

**Step 9: Announce the Next Mystery** and repeat Steps 6-8 for all five decades

**Step 10: Closing Prayers**

*Hail Holy Queen:*
Hail, Holy Queen, Mother of Mercy, our life, our sweetness and our hope. To you do we cry, poor banished children of Eve. To you do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, your eyes of mercy toward us, and after this exile, show unto us the blessed fruit of your womb, Jesus. O clement, O loving, O sweet Virgin Mary. Pray for us, O Holy Mother of God, that we may be made worthy of the promises of Christ. Amen.

**Step 11: Make the Sign of the Cross**

---

**Which Mysteries to Pray Each Day:**

**Monday & Saturday - Joyful Mysteries**
1. The Annunciation
2. The Visitation
3. The Nativity
4. The Presentation in the Temple
5. The Finding of Jesus in the Temple

**Tuesday & Friday - Sorrowful Mysteries**
1. The Agony in the Garden
2. The Scourging at the Pillar
3. The Crowning with Thorns
4. The Carrying of the Cross
5. The Crucifixion

**Wednesday & Sunday - Glorious Mysteries**
1. The Resurrection
2. The Ascension
3. The Descent of the Holy Spirit
4. The Assumption of Mary
5. The Coronation of Mary

**Thursday - Luminous Mysteries**
1. The Baptism of Jesus
2. The Wedding at Cana
3. The Proclamation of the Kingdom
4. The Transfiguration
5. The Institution of the Eucharist`,
            },
            {
                name: "Examination of Conscience",
                type: "practice" as const,
                duration: "10-15 minutes",
                order: 2,
                content: `**Examination of Conscience**

In the Sacrament of Penance the Faithful who confess their sins to a Priest, are sorry for those sins and have a purpose of amendment, receive from God, through the absolution given by that Priest, forgiveness of sins they have committed after Baptism, and at the same time they are reconciled with the Church, which by sinning they wounded.

**Act of Contrition:**
O my God, I am heartily sorry for having offended Thee, and I detest all my sins because I dread the loss of Heaven and fear the pains of hell, but most of all, because they offend Thee, my God, who art all good and worthy of all my love. I firmly intend with the help of Thy grace to confess my sins, to do penance and to amend my life. Amen.

---

**I. "I am the Lord, thy God, thou shalt not have strange gods before Me."**

Have I sinned against Religion by seriously believing in New Age, Scientology, Astrology, Horoscopes, Fortune-telling, Superstition or engaging in the Occult? Did I endanger my Catholic Faith or cause scandal by associating with anti-Catholic groups? Have fame, fortune, money, career, pleasure, etc. replaced God as my highest priority? Have I neglected my daily prayers?

**II. "Thou shalt not take the name of the Lord thy God in vain."**

Have I committed blasphemy by using the name of God and Jesus Christ to swear rather than to praise? Have I committed sacrilege by showing disrespect to holy objects (crucifix, rosary) or contempt for religious persons or for sacred places? Have I committed sacrilege by going to Holy Communion in the state of mortal sin without first going to confession?

**III. "Remember to keep holy the Sabbath day."**

Did I miss Mass on any Sunday or Holyday of Obligation? Have I shown disrespect by leaving Mass early, not paying attention or not joining in the prayers? Did I do unnecessary work on Sunday which could have been done the day before? Have I been stingy in my support for the Church?

**IV. "Honor thy Father and Mother."**

*Parents:* Have I set a bad example for my children by casually missing Mass, neglecting prayer, or ignoring my responsibility to provide a Catholic education? Do I show little or no interest in my children's faith? Have I showed disrespect for those in authority?

*Children:* Have I been disobedient and/or disrespectful to my parents or guardians? Did I neglect to help them with household chores? Have I caused them unnecessary worry and anxiety?

**V. "Thou shalt not kill."**

Did I consent, recommend, advise, approve, support or have an abortion? Did I actively or passively cooperate with an act of euthanasia? Have I committed an act of violence or abuse (physical, sexual, emotional or verbal)? Have I endangered the lives of others by reckless driving?

**VI. "Thou shalt not commit adultery."**
**IX. "Thou shalt not covet thy neighbor's wife."**

Did I have any sex before or outside of marriage? Do I view pornographic material? Have I committed the sins of masturbation and/or artificial contraception? Have I not avoided the occasions of sin which would tempt me to be unfaithful to my spouse or to my own chastity? Do I encourage and entertain impure thoughts and desires?

**VII. "Thou shalt not steal."**
**X. "Thou shalt not covet thy neighbor's goods."**

Have I stolen any object, committed any shoplifting or cheated anyone of their money? Did I knowingly deceive someone in business or commit fraud? Have I shown disrespect for other people's property? Am I greedy or envious of another's goods?

**VIII. "Thou shalt not bear false witness against thy neighbor."**

Have I told a lie in order to deceive someone? Have I told the truth with the purpose and intention of ruining someone's reputation (sin of detraction)? Have I told a lie or spread rumors which may ruin someone's reputation (sin of calumny or slander)? Did I commit perjury? Am I a busybody spreading gossip and secrets about others?`,
            },
            {
                name: "Divine Mercy Chaplet",
                type: "prayer" as const,
                duration: "10-15 minutes",
                order: 3,
                content: `**The Divine Mercy Chaplet**

*Using rosary beads*

**Opening Prayers (optional)**

You expired, Jesus, but the source of life gushed forth for souls, and the ocean of mercy opened up for the whole world. O Fount of Life, unfathomable Divine Mercy, envelop the whole world and empty yourself out upon us.

*Repeat three times:*
O Blood and Water, which gushed forth from the Heart of Jesus as a fountain of Mercy for us, I trust in you!

**Our Father**
Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.

**Hail Mary**
Hail, Mary, full of grace, the Lord is with you; blessed are you among women, and blessed is the fruit of your womb, Jesus. Holy Mary, Mother of God, pray for us sinners now and at the hour of our death. Amen.

**The Apostles' Creed**
I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead.

I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.

---

**For each of the five decades:**

*On each "Our Father" bead of the rosary, pray:*
Eternal Father, I offer you the Body and Blood, soul and divinity of your dearly beloved Son, our Lord Jesus Christ, in atonement for our sins and those of the whole world.

*On each of the 10 "Hail Mary" beads, pray:*
For the sake of his sorrowful Passion, have mercy on us and on the whole world.

---

**Conclusion**

*Repeat three times:*
Holy God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world.

**Closing Prayer (optional)**
Eternal God, in whom mercy is endless and the treasury of compassion inexhaustible, look kindly upon us and increase your mercy in us, that in difficult moments we might not despair nor become despondent, but with great confidence submit ourselves to your holy will, which is Love and Mercy itself. Amen.`,
            },
            {
                name: "Examen – St. Ignatius",
                type: "practice" as const,
                duration: "10-15 minutes",
                order: 3,
                content: `The Examen is a practice of prayerful reflection on the events of the day to detect God's presence and discern His direction. St. Ignatius recommended it as the most important prayer of the day.

  **How to Pray the Examen:**

  1. **Become Aware of God's Presence** (1-2 minutes)
     Begin by placing yourself in God's presence. Thank Him for this day and ask for the grace to see it through His eyes.

  2. **Review the Day with Gratitude** (2-3 minutes)
     Walk through your day from start to finish. Note the moments for which you are most grateful. Where did you feel most alive? What brought you joy?

  3. **Pay Attention to Your Emotions** (2-3 minutes)
     As you review the day, notice your emotions. What feelings surface? Where did you feel peace? Where did you feel troubled? God often speaks through our emotions.

  4. **Choose One Feature and Pray** (2-3 minutes)
     Select one moment that stands out—whether positive or negative. Pray about it. If it was a moment of consolation, thank God. If it was a moment of difficulty, ask for insight and healing.

  5. **Look Toward Tomorrow** (1-2 minutes)
     Ask God for guidance for tomorrow. What do you anticipate? What do you need from God? Conclude with the Our Father.

  The Examen should take about 10-15 minutes. Practice it at the same time each day, ideally in the evening.`,
            },
            {
                name: "Retaliation Prayer",
                type: "prayer" as const,
                order: 4,
                content: `**Prayer Against Retaliation**

In the Name of Jesus Christ our Lord and Savior, by the intercession of the Immaculate Virgin Mary, Mother of Jesus, of Blessed Michael the Archangel, of the Blessed Apostles Peter and Paul, and all the Saints, and by the authority residing in my holy ministry, I invoke the blessing of God the Father Almighty, upon all my family members, relatives, friends, and acquaintances.

Lord Jesus, Thou art Almighty and there is none greater. Thou art all powerful, all knowing, and with the authority vested in me, I invoke the sevenfold gifts of the Holy Spirit: wisdom, understanding, counsel, fortitude, knowledge, piety, and fear of the Lord, as a binding and protective Shield for us against all evil that may attempt to retaliate against us, whether physical, emotional, psychological, or spiritual.

Lord, fill us with Your Holy Spirit and protect us from every evil force that may try to cause us harm because of this ministry of liberation. I ask this in Jesus' name. Amen.`,
            },
            {
                name: "Lectio Divina",
                type: "practice" as const,
                duration: "10 minutes",
                order: 4,
                content: `Lectio Divina ("Divine Reading") is an ancient practice of praying with Scripture that allows God's Word to penetrate your heart. The method has four movements:

  **1. LECTIO (Reading) - 2 minutes**
  Read the Scripture passage slowly, attentively, perhaps out loud. Pay attention to any word or phrase that catches your attention. Read it again if needed.

  **2. MEDITATIO (Meditation) - 3 minutes**
  Reflect on the word or phrase that stood out. Why might the Holy Spirit be drawing you to this? What does it mean for your life right now? Let the word sink into your heart.

  **3. ORATIO (Prayer) - 3 minutes**
  Respond to God in prayer. This may be a prayer of thanksgiving, petition, intercession, or praise. Speak to God from your heart about what you have encountered in His Word.

  **4. CONTEMPLATIO (Contemplation) - 2 minutes**
  Rest in God's presence. Let go of words and thoughts. Simply be with God, allowing His love to fill you. If distractions come, gently return to the word or phrase from your reading.

  **Tips for Practice:**
  - Find a quiet place where you won't be interrupted
  - Have a Bible and journal nearby
  - Use today's Morning Scripture as your text
  - Do not rush—allow silence between movements
  - Trust that God is present and speaking to you`,
            },
            {
                name: "Miracle Prayer",
                type: "prayer" as const,
                order: 5,
                content: `**Miracle Prayer**

Lord Jesus, I come before You, just as I am. I am sorry for my sins, I repent of my sins, please forgive me. In Your Name, I forgive all others for what they have done against me. I renounce Satan, the evil spirits and all their works. I give You my entire self, Lord Jesus. I accept You as my Lord, God and Savior. Heal me, change me, strengthen me in body, soul and spirit.

Come Lord Jesus, cover me with Your Precious Blood, and fill me with Your Holy Spirit. I love You Lord Jesus, I praise You Jesus, I thank You Jesus, I shall follow You every day of my life. Amen.

Mary, my mother, Queen of Peace, all the Angels and Saints, please help me. Amen.`,
            },
            {
                name: "Short Form Deliverance Prayer",
                type: "prayer" as const,
                order: 6,
                content: `**Short Form Deliverance Prayer**

In the name of the Lord Jesus Christ, by the power of His Cross, His Blood and His resurrection, I command you Satan, the spirits, powers and forces of darkness, the nether world, and the evil forces of nature to depart now.

I take authority over all curses, hexes, demonic activity, and spells directed against me, my relationships, ministry, air space, finances, and the work of my hands; and I break them by the power and authority of our Lord Jesus Christ.

I bind all demonic interactions, interplay and communications between spirits sent against me, and I command them directly to Jesus Christ for Him to deal with as He wills.

I ask forgiveness for, and denounce all negative inner vows that I have made with the enemy, and I ask that Jesus Christ release me from these vows and from any bondage they have held in me.

I ask Jesus, the Son of the living God, to pour His shed Blood over every aspect of my life for my protection. I pray all these things in the precious name of my Lord and Savior, Jesus Christ.

Amen.`,
            },
        ];

        for (const resource of canonicalResources) {
            await storage.createPracticeResource(resource);
        }
        console.log(`Practice resources reset: ${canonicalResources.length} resources loaded.`);
    }

    // Only seed daily content if none exists (preserves admin edits)
    const existingContent = await storage.getAllDailyContent();
    if (existingContent.length === 0) {
        console.log("No daily content found - seeding from imported data...");
        for (const content of dailyContentData) {
            await storage.upsertDailyContent({
                dayNumber: content.dayNumber,
                weekNumber: content.weekNumber,
                weekTitle: content.weekTitle,
                morningScriptureRef: content.morningScriptureRef,
                morningScriptureText: content.morningScriptureText,
                morningMeditation: content.morningMeditation,
                morningPrayer: null,
                eveningCatechismRef: content.eveningCatechismRef,
                eveningCatechism: content.eveningCatechism,
                eveningSummary: null,
                eveningQuestions: content.eveningQuestions,
                isReflectionDay: content.isReflectionDay,
                isMentorDay: content.isMentorDay
            });
        }
        console.log("Daily content seeded successfully.");
    } else {
        console.log(`Daily content already exists (${existingContent.length} days) - preserving admin edits.`);
    }
    
    // Legacy seeding code - no longer needed but keeping structure
    const existing = await storage.getAllDailyContent();
    if (false) { // Disabled - content is now seeded from imported data above
        
        // Now update Day 1 with the actual content from the document
        await storage.upsertDailyContent({
            dayNumber: 1,
            weekNumber: 1,
            weekTitle: "God's Loving Plan for Humanity",
            morningScriptureRef: "John 14:23",
            morningScriptureText: "Jesus said to His disciples: \"Whoever loves Me will keep My word, and My Father will love him, and We will come to him and make Our dwelling with him.\"",
            morningMeditation: `Do you want our Lord to come to you and dwell within the depths of your soul? Presumably the answer is an easy "Yes." The way to make this happen is to love God and keep His word. When you do that, the Blessed Trinity will come and dwell within you.

It's interesting that the love of God appears to be contingent upon our love of Him. In other words, does God only love us when we love Him first? Strictly speaking, God loves us with a perfect love regardless of whether we love Him or not. But with that said, love takes on a whole new form when it is received and reciprocated. Therefore, when we choose to love God we suddenly realize that our love of Him opens the door for Him to come and dwell within us, transforming us and making our heart His holy sanctuary. What a glorious gift!

It's also interesting to note that love of God means, in part, that we are obedient to Him. But that's the nature of God. He is Love itself and, therefore, loving Him necessarily involves a complete submission of your will to His. Perfect obedience to Him in all things is a powerful way of loving Him. It's a way of allowing Him to dwell within you and, in that act, to take over your will. Only then can you love Him even more fully with your whole being.

Reflect, today, especially upon your desire to have the Most Holy Trinity come and dwell within your soul. This should be the primary goal of our lives. If God lives within us then all else in life will fall into place. All things will work for the good and God will be glorified in and through us. Make the choice to love Him through your obedience this day, and your relationship of love will grow by leaps and bounds.`,
            morningPrayer: `Lord, I do love You and desire to love You in a more perfect way this day. Help me to submit to Your perfect will in all things. Help me to embrace perfect obedience to You always. In that act of love and submission, come and make Your dwelling within me. Jesus, I trust in You.

—Philip Neri`,
            eveningCatechismRef: "CCC #214-227",
            eveningCatechism: `THE PROFESSION OF THE CHRISTIAN FAITH

God, "He Who Is", Is Truth and Love

God, "HE WHO IS", revealed himself to Israel as the One "abounding in steadfast love and faithfulness". These two terms express summarily the riches of the divine name. In all His works God displays, not only His kindness, goodness, grace and steadfast love, but also His trustworthiness, constancy, faithfulness and truth. "I give thanks to Your name for Your steadfast love and Your faithfulness." He is the Truth, for "God is light and in Him there is no darkness"; "God is love", as the apostle John teaches.

God Is Truth

"The sum of Your word is truth; and every one of Your righteous ordinances endures forever." "And now, O LORD God, You are God, and Your words are true"; this is why God's promises always come true. God is Truth itself, whose words cannot deceive. This is why one can abandon oneself in full trust to the truth and faithfulness of His Word in all things. The beginning of sin and of man's fall was due to a lie of the tempter who induced doubt of God's Word, kindness and faithfulness.

God's truth is His wisdom, which commands the whole created order and governs the world. God, who alone made heaven and earth, can alone impart true knowledge of every created thing in relation to Himself.

God is also truthful when he reveals Himself—the teaching that comes from God is "true instruction." When He sends His Son into the world it will be "to bear witness to the truth": "We know that the Son of God has come and has given us understanding, to know Him who is true."

God is Love

In the course of its history, Israel was able to discover that God had only one reason to reveal Himself to them, a single motive for choosing them from among all peoples as His special possession: His sheer gratuitous love. And thanks to the prophets Israel understood that it was again out of love that God never stopped saving them and pardoning their unfaithfulness and sins.

God's love for Israel is compared to a father's love for his son. His love for His people is stronger than a mother's for her children. God loves His people more than a bridegroom his beloved; His love will be victorious over even the worst infidelities and will extend to His most precious gift: "God so loved the world that He gave His only Son."

God's love is "everlasting": "For the mountains may depart and the hills be removed, but My steadfast love shall not depart from you." Through Jeremiah, God declares to His people, "I have loved you with an everlasting love; therefore I have continued my faithfulness to you."

But St. John goes even further when he affirms that "God is love." God's very being is love. By sending His only Son and the Spirit of Love in the fullness of time, God has revealed His innermost secret: God Himself is an eternal exchange of love, Father, Son and Holy Spirit, and He has destined us to share in that exchange.

The Implications of Faith in One God

Believing in God, the only One, and loving Him with all our being has enormous consequences for our whole life.

It means coming to know God's greatness and majesty: "Behold, God is great, and we know Him not." Therefore, we must "serve God first."

It means living in thanksgiving: if God is the only One, everything we are and have comes from Him: "What have you that you did not receive?" "What shall I render to the LORD for all His bounty to me?"

It means knowing the unity and true dignity of all men: everyone is made in the image and likeness of God.

It means making good use of created things: faith in God, the only One, leads us to use everything that is not God only insofar as it brings us closer to Him, and to detach ourselves from it insofar as it turns us away from Him:

My Lord and my God, take from me everything that distances me from You.
My Lord and my God, give me everything that brings me closer to You.
My Lord and my God, detach me from myself to give my all to You.

It means trusting God in every circumstance, even in adversity. A prayer of St. Teresa of Jesus wonderfully expresses this trust:

Let nothing trouble you. Let nothing frighten you.
Everything passes. God never changes.
Patience obtains all.
Whoever has God wants for nothing.
God alone is enough.`,
            eveningSummary: `God's Nature: God is love and truth and He wills our good. He is trustworthy and faithful and continually showers His mercy upon His children despite our unfaithfulness.

The Holy Trinity: The one true God is triune with three distinct persons, the Father, the Son, and the Holy Spirit. When we obey God's laws, Christ dwells in our hearts through the power of the Holy Spirit as granted through the Father's glory (Eph 3: 14–19).

God's Love for All Creation: God's love is perfect and everlasting. It is far greater than the love that any human can offer. It is sacrificial and is made manifest in the offering of His only son, Jesus, to die on the cross to atone for our sins and to bring us to salvation.

Misconceptions About God: People often believe that we must earn God's love. In fact, God's love is steadfast and always available to us, but we must be willing to repent of our sins and make our hearts a suitable home for Him so He can guide us in all things.`,
            eveningQuestions: [
                "Am I obeying all of God's commandments or do I sometimes choose to follow my will rather than His?",
                "Do I love God above all things and all people? If not, what or who have I placed before God in my heart? (e.g. money, power, beauty, spouse, children)",
                "Do I trust God in all circumstances of my life? If not, why not?",
                "What can I do to make my heart and soul a more fit dwelling place for God?"
            ],
            isReflectionDay: false
        });
        
        // Day 2 content
        await storage.upsertDailyContent({
            dayNumber: 2,
            weekNumber: 1,
            weekTitle: "God's Loving Plan for Humanity",
            morningScriptureRef: "Revelations 12:7–17",
            morningScriptureText: `Then war broke out in heaven; Michael and his angels battled against the dragon. The dragon and its angels fought back, but they did not prevail and there was no longer any place for them in heaven. The huge dragon, the ancient serpent, who is called the Devil and Satan, who deceived the whole world, was thrown down to earth, and its angels were thrown down with it.

Then I heard a loud voice in heaven say: "Now have salvation and power come, and the Kingdom of our God and the authority of His Anointed. For the accuser of our brothers is cast out, who accuses them before our God day and night. They conquered him by the blood of the Lamb and by the word of their testimony; love for life did not deter them from death."`,
            morningMeditation: `THE DEVIL AND THE WEAKNESSES OF HUMAN NATURE

We must realize that demons are pure intellectual beings, not rational beings like us. They possess a superior knowledge of our weaknesses and dispositions, which they use to tempt us. St. Teresa is aware that, "The devil knows very well to take advantage of our nature and little understanding."

In his Spiritual Canticle, St. John of the Cross also suggests that demons use the world and flesh to enhance the power of their work: "The temptation of the devils... is stronger than those of the world and the flesh, because the devils reinforce themselves with these other two enemies, the world and the flesh, in order to wage a rugged war."

The devil knows how to exploit our instincts and passions, the weakness of our flesh and our pride. Misfortune, sickness, or mental anxiety are not sins, but they may induce us to rebellion and despair. And Satan may take advantage of all of them to tempt us to sin.

St. Teresa of Avila warns: "But the devil comes with his artful wiles, and, under the color of doing good, sets about undermining it in trivial ways... little by little he darkens its understanding and weakens its will, and causes its self-love to increase."`,
            morningPrayer: null,
            eveningCatechismRef: "CCC #391-395",
            eveningCatechism: `THE FALL OF THE ANGELS

Behind the disobedient choice of our first parents lurks a seductive voice, opposed to God, which makes them fall into death out of envy. Scripture and the Church's Tradition see in this being a fallen angel, called "Satan" or "the devil." The Church teaches that Satan was at first a good angel, made by God: "The devil and the other demons were indeed created naturally good by God, but they became evil by their own doing."

Scripture speaks of a sin of these angels. This "fall" consists in the free choice of these created spirits, who radically and irrevocably rejected God and His reign. We find a reflection of that rebellion in the tempter's words to our first parents: "You will be like God." The devil "has sinned from the beginning"; he is "a liar and the father of lies."

The power of Satan is, nonetheless, not infinite. He is only a creature, powerful from the fact that he is pure spirit, but still a creature. He cannot prevent the building up of God's reign. Although Satan may act in the world out of hatred for God and His Kingdom in Christ Jesus, and although his action may cause grave injuries—of a spiritual nature and, indirectly, even of a physical nature—to each man and to society, the action is permitted by divine providence which with strength and gentleness guides human and cosmic history. It is a great mystery that providence should permit diabolical activity, but "we know that in everything God works for good with those who love Him."`,
            eveningSummary: `Creation of Angels, Lucifer: "The devil and the other demons were indeed created naturally good by God, but they became evil by their own doing" (Lateran Council). Lucifer is another name for Satan and means "angel of light."

The Fall of the Angels: Scripture tells us that "The huge dragon, the ancient serpent, who is called the devil and Satan, who deceived the whole world, was thrown down to earth." The devil refused to serve God because of his pride and desire to be equal to God.

Nature of Angels & Demons: In the natural sphere they were pure spirits with a very keen mind and a strong free will. By their nature, angels are superior to all other creatures, including humans.`,
            eveningQuestions: [
                "Do you believe that the devil and his angels wage war on the children of God on earth through his hatred for God and His Kingdom?",
                "Do you understand that although the devil has greater power than people, that he can only act by the permissive will of God?",
                "Do you trust that God uses diabolical activity to work for good in people's lives?"
            ],
            isReflectionDay: false
        });
        
        // Day 3 content
        await storage.upsertDailyContent({
            dayNumber: 3,
            weekNumber: 1,
            weekTitle: "God's Loving Plan for Humanity",
            morningScriptureRef: "Genesis 3:1–24",
            morningScriptureText: `EXPULSION FROM EDEN

Now the snake was the most cunning of all the wild animals that the LORD God had made. He asked the woman, "Did God really say, 'You shall not eat from any of the trees in the garden'?" The woman answered the snake: "We may eat of the fruit of the trees in the garden; it is only about the fruit of the tree in the middle of the garden that God said, 'You shall not eat it or even touch it, or else you will die.'" But the snake said to the woman: "You certainly will not die! God knows well that when you eat of it your eyes will be opened and you will be like gods, who know good and evil."

The woman saw that the tree was good for food and pleasing to the eyes, and the tree was desirable for gaining wisdom. So she took some of its fruit and ate it; and she also gave some to her husband, who was with her, and he ate it. Then the eyes of both of them were opened, and they knew that they were naked...

The LORD God therefore banished him from the Garden of Eden, to till the ground from which he had been taken.`,
            morningMeditation: `Original Sin is the sin inherited by all humankind from Adam in his disobedience of God's command not to eat from the fruit of the Tree of Knowledge. The Original Sin event is referred to as "The Fall of Man."

Adam's choice to disobey God's command is considered a "fall" because his choice to sin represents a fall from grace. God created Adam in His image and likeness and saw that he was good. Adam was created with an original grace and holiness.

Adam and Eve were given the free choice to love and serve God. God gave us the ability to love God freely (free will) because true love is one that is not forced. With this ability to choose, mankind has chosen not to love God, hence our inheritance of a fallen nature.

Sin is rooted in man's preference for himself over God. Instead of choosing God, Adam chose himself by eating of the fruit of the tree so that he could be like God. Making a choice to sin leads to weakness of the soul and a propensity to continue to sin.

Christ's Redemption and Original Sin: The sin of Adam is linked directly to Christ's redemption; through one man, Adam, sin entered the world, and through one man, Jesus, humanity is restored (Romans 5:12–21). Jesus is the perfect sacrifice that atones for all of our sins. Baptism removes Original Sin and any personal sin, and cleanses the soul making it new and fresh.`,
            morningPrayer: null,
            eveningCatechismRef: "CCC #1704–1705",
            eveningCatechism: `The human person participates in the light and power of the divine Spirit. By his reason, he is capable of understanding the order of things established by the Creator. By free will, he is capable of directing himself toward his true good. He finds his perfection "in seeking and loving what is true and good."

By virtue of his soul and his spiritual powers of intellect and will, man is endowed with freedom, an "outstanding manifestation of the divine image."

What makes us in the image and likeness of God?

Answer: We are made in the image and likeness of God because we can love, create, and truly choose good. We are capable of truly and freely choosing to do good and to love. Human persons are not mere reactionary creatures but a creation that, like God, can choose to do good and to love one another. Human persons are also able to know and understand goodness and love.`,
            eveningSummary: `Original Sin: Original Sin is not one's own personal sin, it is a state of the soul, representing the fallen nature that was handed on to us by Adam who fell into death upon committing the Original Sin.

Made in God's Image & Likeness: We are made in the image and likeness of God because we can love, create, and truly understand, know, and choose to do good.`,
            eveningQuestions: [
                "Do you understand how choices to disobey God's commandments cause people to fall from His grace and can open the door to demonic activity?",
                "Through God's extraordinary love for us He sent His only Son to save us and invites us into a new covenant relationship. Do you understand how you need to choose each day to remain in this relationship by following Him?"
            ],
            isReflectionDay: false
        });
        
        // Day 4 content
        await storage.upsertDailyContent({
            dayNumber: 4,
            weekNumber: 1,
            weekTitle: "God's Loving Plan for Humanity",
            morningScriptureRef: "Matthew 25:31–46",
            morningScriptureText: `When the Son of Man comes in His glory, and all the angels with Him, He will sit upon His glorious throne, and all the nations will be assembled before Him. And He will separate them one from another, as a shepherd separates the sheep from the goats. He will place the sheep on His right and the goats on His left.

Then the King will say to those on His right, 'Come, you who are blessed by My Father. Inherit the Kingdom prepared for you from the foundation of the world. For I was hungry and you gave Me food, I was thirsty and you gave Me drink, a stranger and you welcomed Me, naked and you clothed Me, ill and you cared for Me, in prison and you visited Me.'

Then He will say to those on His left, 'Depart from Me, you accursed, into the eternal fire prepared for the devil and his angels. For I was hungry and you gave Me no food, I was thirsty and you gave Me no drink...'

And these will go off to eternal punishment, but the righteous to eternal life.`,
            morningMeditation: `This powerful passage from Matthew reveals the reality of the Final Judgment. Christ will come in glory to judge the living and the dead. The criteria for judgment is simple yet profound: how did we treat the least of His brothers and sisters?

The King identifies Himself with the hungry, the thirsty, the stranger, the naked, the sick, and the imprisoned. When we serve them, we serve Christ Himself. When we neglect them, we neglect Christ.

This teaching challenges us to see Christ in every person we encounter, especially those who are suffering. Our eternal destiny is connected to how we respond to human need. The works of mercy are not optional extras in the Christian life—they are essential to following Christ.

The passage also reminds us of the reality of hell—a place "prepared for the devil and his angels." Those who persistently reject God's love and refuse to love their neighbor ultimately choose eternal separation from God. But God's desire is for all to be saved, and He gives us the means of grace to live lives of love and service.`,
            morningPrayer: null,
            eveningCatechismRef: "Pope John Paul II on Heaven, Hell, and Purgatory",
            eveningCatechism: `HEAVEN, HELL AND PURGATORY

Heaven is fullness of Communion with God: Heaven "is neither an abstraction nor a physical place in the clouds, but a living, personal relationship with the Holy Trinity. It is our meeting with the Father which takes place in the risen Christ through the communion of the Holy Spirit."

When the form of this world has passed away, those who have welcomed God into their lives and have sincerely opened themselves to His love, at least at the moment of death, will enjoy that fullness of communion with God which is the goal of human life.

Hell is the state of those who reject God: "Hell is the ultimate consequence of sin itself... Rather than a place, hell indicates the state of those who freely and definitively separate themselves from God, the source of all life and joy."

God is the infinitely good and merciful Father. But man, called to respond to Him freely, can unfortunately choose to reject His love and forgiveness once and for all, thus separating himself forever from joyful communion with Him.

Purgatory is necessary purification: Before we enter into full communion with God, every trace of sin within us must be eliminated and every imperfection in our soul must be corrected. The term Purgatory does not indicate a place, but a condition of existence, where Christ "removes... the remnants of imperfection."`,
            eveningSummary: `Particular Judgment: At death, each person is judged by Christ and enters into eternal life or awaits purification before entering heaven, or is condemned to eternal separation from God.

General Judgment: At the end of time, Christ will come in glory to judge the living and the dead. All will be revealed.

Heaven: The ultimate end and fulfillment of the deepest human longings—the state of supreme, definitive happiness in communion with God.

Hell: The state of eternal separation from God, chosen freely by those who reject His love.

Purgatory: A state of purification for those who die in God's grace but still need to be cleansed of venial sins or temporal punishment.`,
            eveningQuestions: [
                "When you imagine Heaven, what things or people are included? Why are these important to you?",
                "Many today do not believe in the existence of Purgatory. How can you help them understand that it is a great blessing for those who just need more purification before they would feel comfortable in the presence of God?",
                "Every trace of sin must be absent before one may enter Heaven. What are you willing to do now so as to make eternal life in Heaven possible?"
            ],
            isReflectionDay: false
        });
        
        // Day 5 content
        await storage.upsertDailyContent({
            dayNumber: 5,
            weekNumber: 1,
            weekTitle: "God's Loving Plan for Humanity",
            morningScriptureRef: "Revelations 21:1–8",
            morningScriptureText: `THE NEW HEAVEN AND THE NEW EARTH

Then I saw a new heaven and a new earth. The former heaven and the former earth had passed away, and the sea was no more. I also saw the holy city, a new Jerusalem, coming down out of heaven from God, prepared as a bride adorned for her husband.

I heard a loud voice from the throne saying, "Behold, God's dwelling is with the human race. He will dwell with them and they will be His people and God Himself will always be with them [as their God]. He will wipe every tear from their eyes, and there shall be no more death or mourning, wailing or pain, [for] the old order has passed away."

The one who sat on the throne said, "Behold, I make all things new." Then He said, "Write these words down, for they are trustworthy and true."

He said to me, "They are accomplished. I [am] the Alpha and the Omega, the beginning and the end. To the thirsty I will give a gift from the spring of life-giving water. The victor will inherit these gifts, and I shall be his God, and he will be My son."`,
            morningMeditation: `This glorious vision from Revelation reveals God's ultimate plan for creation. God will make all things new. The former things—death, mourning, crying, pain—will pass away. God Himself will dwell with His people.

Notice the intimate language: "I shall be his God, and he will be My son." The relationship God desires with us is not distant or formal but familial and personal. We are called to be children of God, heirs with Christ to the Kingdom.

The promise of "living water" echoes Jesus's words to the Samaritan woman. God offers us life in abundance, a spring welling up to eternal life. This living water is available now through faith and the sacraments, but it will be fully realized in the new creation.

The passage also contains a sobering warning: "As for cowards, the unfaithful, the depraved, murderers, the unchaste, sorcerers, idol-worshipers, and deceivers of every sort, their lot is in the burning pool of fire and sulfur, which is the second death." Our choices in this life have eternal consequences.

Let this vision of the new heaven and new earth fill you with hope. No matter what suffering you face now, God has prepared something infinitely better for those who love Him.`,
            morningPrayer: null,
            eveningCatechismRef: "CCC #1023–1027",
            eveningCatechism: `HEAVEN

Those who die in God's grace and friendship and are perfectly purified live forever with Christ. They are like God forever, for they "see Him as He is," face to face.

This perfect life with the Most Holy Trinity—this communion of life and love with the Trinity, with the Virgin Mary, the angels and all the blessed—is called "heaven." Heaven is the ultimate end and fulfillment of the deepest human longings, the state of supreme, definitive happiness.

To live in heaven is "to be with Christ." The elect live "in Christ," but they retain, or rather find, their true identity, their own name. For life is to be with Christ; where Christ is, there is life, there is the Kingdom.

By His death and Resurrection, Jesus Christ has "opened" heaven to us. The life of the blessed consists in the full and perfect possession of the fruits of the redemption accomplished by Christ. He makes partners in His heavenly glorification those who have believed in Him and remained faithful to His will.

This mystery of blessed communion with God and all who are in Christ is beyond all understanding and description. Scripture speaks of it in images: life, light, peace, wedding feast, wine of the Kingdom, the Father's house, the heavenly Jerusalem, paradise: "no eye has seen, nor ear heard, nor the heart of man conceived, what God has prepared for those who love Him."

From the Diary of St. Faustina: "Today I was in heaven, in spirit, and I saw its unconceivable beauties and the happiness that awaits us after death. I saw how all creatures give ceaseless praise and glory to God. I saw how great is happiness in God, which spreads to all creatures, making them happy."`,
            eveningSummary: `Beatific Vision: In heaven, the blessed see God face to face, as He truly is. This is the ultimate source of their happiness.

What is Heaven Like? Heaven is beyond human description, but Scripture uses images of life, light, peace, and the wedding feast to hint at its glory.

St. Faustina's Vision: "God has given me to understand that there is but one thing that is of infinite value in His eyes, and that is love of God; love, love and once again, love."`,
            eveningQuestions: [
                "What images of heaven resonate most with you—light, peace, the wedding feast, the Father's house?",
                "Do you believe that heaven is real and that it's worth any sacrifice to get there?",
                "St. Faustina says only love of God is of infinite value. How can you grow in love today?"
            ],
            isReflectionDay: false
        });
        
        // Day 6 - Weekly Reflection Day
        await storage.upsertDailyContent({
            dayNumber: 6,
            weekNumber: 1,
            weekTitle: "God's Loving Plan for Humanity",
            morningScriptureRef: "Romans 8:28-39",
            morningScriptureText: `We know that all things work for good for those who love God, who are called according to His purpose. For those He foreknew He also predestined to be conformed to the image of His Son, so that He might be the firstborn among many brothers.

What then shall we say to this? If God is for us, who can be against us? He who did not spare His own Son but handed Him over for us all, how will He not also give us everything else along with Him?

Who will bring a charge against God's chosen ones? It is God who acquits us. Who will condemn? It is Christ Jesus who died, rather, was raised, who also is at the right hand of God, who indeed intercedes for us.

What will separate us from the love of Christ? Will anguish, or distress, or persecution, or famine, or nakedness, or peril, or the sword? No, in all these things we conquer overwhelmingly through Him who loved us.

For I am convinced that neither death, nor life, nor angels, nor principalities, nor present things, nor future things, nor powers, nor height, nor depth, nor any other creature will be able to separate us from the love of God in Christ Jesus our Lord.`,
            morningMeditation: `WEEK 1 REFLECTION: THE SPIRITUAL REALITY

This week we have journeyed through profound truths about the spiritual reality in which we live. We learned that God is Love and Truth, that He desires to dwell within us, and that our obedience opens the door for Him to transform our hearts.

We encountered the reality of spiritual warfare—the fall of the angels, the nature of demons, and how they seek to exploit our weaknesses. Yet we also learned that God's power is infinitely greater, and Satan can only act by divine permission.

We reflected on Original Sin and its effects on humanity, recognizing that through baptism and faith in Christ, we can be restored to communion with God. We confronted the reality of heaven, hell, and purgatory—understanding that our choices have eternal consequences.

Through it all, one truth shines clearly: NOTHING CAN SEPARATE US FROM THE LOVE OF GOD IN CHRIST JESUS.

As you complete this first week, consider:
- What struck you most powerfully about the spiritual reality?
- How has your understanding of spiritual warfare changed?
- What practices will you carry forward to strengthen your spiritual life?

Remember: You are loved with an everlasting love. God has a plan for your salvation. The battle is real, but the victory is assured in Christ.`,
            morningPrayer: `Heavenly Father, as I complete this first week of spiritual formation, I thank You for opening my eyes to the reality of the spiritual world. I praise You for Your infinite love and mercy.

I acknowledge the reality of spiritual warfare, but I trust in Your protection and the power of the Blood of Christ. Help me to grow in holiness, to resist temptation, and to choose You above all else.

Mary, my mother, Queen of Peace, pray for me. St. Michael the Archangel, defend me in battle. All you holy angels and saints, intercede for me.

Lord, fill me with Your Holy Spirit and guide me through the days ahead. I surrender my life to You. Jesus, I trust in You. Amen.`,
            eveningCatechismRef: "Reflection Summary",
            eveningCatechism: `WEEK 1 SUMMARY: GOD'S LOVING PLAN FOR HUMANITY

Key Themes:
• God is Love and Truth—He desires to dwell in our hearts
• The reality of angels and demons—spiritual warfare is real
• Original Sin and the Fall—humanity's need for redemption
• Christ's victory—through His death and resurrection, He has conquered sin and death
• Heaven, Hell, and Purgatory—our eternal destiny depends on our response to God's love
• Nothing can separate us from God's love—we are more than conquerors in Christ

Prayer Practices Introduced:
• Prayer Against Retaliation—protection from spiritual attack
• Miracle Prayer—surrender and commitment to Christ
• Lectio Divina—praying with Scripture
• Examen—reviewing the day with God

As you move into Week 2, continue these daily practices. They are building a foundation for a deeper relationship with God and a stronger defense against the enemy.`,
            eveningSummary: null,
            eveningQuestions: [
                "What was the most significant insight or grace you received this week?",
                "How has your prayer life changed since beginning this program?",
                "What areas of your life do you sense God inviting you to surrender more fully?",
                "Are there any sins or attachments you need to confess or renounce?",
                "What are you most looking forward to in the coming week?"
            ],
            isReflectionDay: true
        });
    }
    
    // Seed Track A modules if needed
    const existingModules = await storage.getTrackAModules();
    if (existingModules.length === 0) {
        console.log("No Track A modules found - seeding...");
        const defaultModules = [
            { weekNumber: 1, title: "Foundations", subtitle: "Who God Is & How We Relate to Him" },
            { weekNumber: 2, title: "The Human Condition", subtitle: "Why We Struggle" },
            { weekNumber: 3, title: "Encountering Jesus", subtitle: "Healer, Deliverer, Friend, King" },
            { weekNumber: 4, title: "Conversion & Change", subtitle: "Choosing a New Direction" },
            { weekNumber: 5, title: "Living the Faith", subtitle: "Scripture, Sacraments, and the Church" },
        ];
        for (const mod of defaultModules) {
            await storage.upsertTrackAModule(mod);
        }
        console.log("Track A modules seeded (5 modules).");
    }

    // One-time migration: fix duplicate Introduction at Day 0 and Day 1
    // Production had old Day 1 = "Introduction" which should have been shifted to Day 0.
    // Detects the duplicate and renumbers Day 2-30 → Day 1-29, then pads to 30.
    const preFixContent = await storage.getAllTrackAContent();
    const day0Entry = preFixContent.find(c => c.dayNumber === 0);
    const day1Entry = preFixContent.find(c => c.dayNumber === 1);
    if (day0Entry && day1Entry &&
        day0Entry.centralTheme === "Introduction - Goal of 30 Days" &&
        day1Entry.centralTheme === "Introduction - Goal of 30 Days") {
        console.log("Migrating Track A: removing duplicate Day 1 Introduction and renumbering...");
        // Delete the old Day 1 duplicate
        await db.delete(trackAContent).where(eq(trackAContent.dayNumber, 1));
        // Get remaining content days (Day 0 stays, Days 2-30 need to shift down by 1)
        const toShift = preFixContent
            .filter(c => c.dayNumber >= 2)
            .sort((a, b) => a.dayNumber - b.dayNumber);
        // Shift to temporary negative values to avoid unique constraint conflicts
        for (let i = 0; i < toShift.length; i++) {
            await db.update(trackAContent)
                .set({ dayNumber: -(i + 1) })
                .where(eq(trackAContent.dayNumber, toShift[i].dayNumber));
        }
        // Now set final day numbers (shift down by 1, so old Day 2 → Day 1, etc.)
        for (let i = 0; i < toShift.length; i++) {
            const newDay = i + 1;
            const newWeek = Math.ceil(newDay / 6);
            await db.update(trackAContent)
                .set({ dayNumber: newDay, weekNumber: newWeek })
                .where(eq(trackAContent.dayNumber, -(i + 1)));
        }
        const finalCount = toShift.length; // Should be 29 (old Days 2-30)
        // Pad to 30 if needed
        const padPlaceholders = [
            { theme: "Community & Accountability", slides: [{ type: "text", content: "Faith is not meant to be lived alone. We are the Body of Christ." }, { type: "action", content: "Identify one person you will continue to walk with in faith." }] },
        ];
        for (let i = finalCount; i < 30; i++) {
            const p = padPlaceholders[i - finalCount];
            if (p) {
                await storage.upsertTrackAContent({
                    dayNumber: i + 1,
                    weekNumber: Math.ceil((i + 1) / 6),
                    centralTheme: p.theme,
                    slides: p.slides,
                });
            }
        }
        console.log(`Track A Day 1 duplicate fix complete. Shifted ${toShift.length} days down by 1. Total: ${Math.min(finalCount + padPlaceholders.length, 30)} days.`);
    }

    // One-time migration: remove Sunday "ATTEND SUNDAY MASS" entries from Track A
    // and renumber remaining content as days 1-30 (6 days per week, Sundays are UI-only)
    const existingTrackAContent = await storage.getAllTrackAContent();
    const hasSundayEntries = existingTrackAContent.some(c => c.centralTheme === "ATTEND SUNDAY MASS");
    if (hasSundayEntries && existingTrackAContent.length > 0) {
        console.log("Migrating Track A: removing Sunday entries and renumbering...");
        const sundayDays = existingTrackAContent
            .filter(c => c.centralTheme === "ATTEND SUNDAY MASS")
            .map(c => c.dayNumber);
        for (const sd of sundayDays) {
            await db.delete(trackAContent).where(eq(trackAContent.dayNumber, sd));
        }
        const remaining = existingTrackAContent
            .filter(c => c.centralTheme !== "ATTEND SUNDAY MASS")
            .sort((a, b) => a.dayNumber - b.dayNumber);
        // Renumber to temporary negative values to avoid unique constraint conflicts
        for (let i = 0; i < remaining.length; i++) {
            await db.update(trackAContent)
                .set({ dayNumber: -(i + 1) })
                .where(eq(trackAContent.dayNumber, remaining[i].dayNumber));
        }
        // Now set final day numbers (1-based, 6 per week)
        for (let i = 0; i < remaining.length; i++) {
            const newDay = i + 1;
            const newWeek = Math.ceil(newDay / 6);
            await db.update(trackAContent)
                .set({ dayNumber: newDay, weekNumber: newWeek })
                .where(eq(trackAContent.dayNumber, -(i + 1)));
        }
        // Add placeholder days if we have fewer than 30
        const finalCount = remaining.length;
        const placeholders = [
            { theme: "Living in the Holy Spirit", slides: [{ type: "text", content: "The Holy Spirit is your daily companion on this journey." }, { type: "action", content: "Invite the Holy Spirit into your day with a simple prayer." }] },
            { theme: "The Sacramental Life", slides: [{ type: "text", content: "The sacraments are encounters with the living Christ." }, { type: "action", content: "Reflect on which sacrament has been most meaningful to you." }] },
            { theme: "Building a Rule of Life", slides: [{ type: "text", content: "A Rule of Life is a simple plan for how you will continue to grow spiritually." }, { type: "action", content: "Draft a simple daily prayer plan for after the program ends." }] },
            { theme: "Community & Accountability", slides: [{ type: "text", content: "Faith is not meant to be lived alone. We are the Body of Christ." }, { type: "action", content: "Identify one person you will continue to walk with in faith." }] },
        ];
        for (let i = finalCount; i < 30; i++) {
            const p = placeholders[i - finalCount];
            if (p) {
                await storage.upsertTrackAContent({
                    dayNumber: i + 1,
                    weekNumber: Math.ceil((i + 1) / 6),
                    centralTheme: p.theme,
                    slides: p.slides,
                });
            }
        }
        console.log(`Track A migration complete. Removed ${sundayDays.length} Sunday entries, renumbered to ${Math.min(remaining.length + placeholders.length, 30)} days.`);
    }

    // Seed Track A content if needed (fresh databases only)
    const currentTrackAContent = await storage.getAllTrackAContent();
    if (currentTrackAContent.length === 0) {
        console.log("No Track A content found - seeding...");
        for (const content of trackAContentData) {
            await storage.upsertTrackAContent(content);
        }
        console.log(`Track A content seeded successfully (${trackAContentData.length} days).`);
    } else {
        console.log(`Track A content already exists (${currentTrackAContent.length} days) - preserving admin edits.`);
    }

    // Ensure Day 0 (Introduction) exists in trackAContent
    const day0Content = await storage.getTrackAContent(0);
    if (!day0Content) {
        const existingIntro = await storage.getCohortSetting("day0_intro_content");
        const introSlides: { type: string; content: string }[] = [];
        if (existingIntro) {
            introSlides.push({ type: "text", content: existingIntro });
        } else {
            introSlides.push({ type: "text", content: "Welcome to Lumen Fidei, your 30-day spiritual journey." });
        }
        await storage.upsertTrackAContent({
            dayNumber: 0,
            weekNumber: 0,
            centralTheme: "Introduction - Goal of 30 Days",
            slides: introSlides,
        });
        console.log("Day 0 (Introduction) seeded in Track A content.");
    }

    // Seed prelim modules using ON CONFLICT DO NOTHING to preserve admin edits
    await db.insert(prelimModules).values([
      {
        position: 1,
        title: "Welcome to Lumen Fidei",
        subtitle: "An introduction to your 30-day journey",
        slides: [
          { type: "text", content: "Welcome to Lumen Fidei — Light of Faith. This program is a 30-day journey of healing, prayer, and encounter with God." },
          { type: "text", content: "Over the next 30 days, you will be guided through Scripture, the Catechism, and daily spiritual practices designed to bring lasting transformation." },
          { type: "text", content: "You are not alone on this journey. You have a mentor, a community, and most importantly, the Lord walking with you." },
          { type: "action", content: "Take a moment to pray: \"Lord, I open my heart to what you want to do in me through this program. I surrender my expectations to you. Come, Holy Spirit. Amen.\"" },
        ] as { type: string; content: string }[],
      },
      {
        position: 2,
        title: "The Program Structure",
        subtitle: "What to expect over the next 30 days",
        slides: [
          { type: "text", content: "The program runs Monday through Saturday for 5 weeks (30 days). Sundays are set aside for Mass and rest." },
          { type: "text", content: "Each day begins with a morning lesson — a brief slide-based reflection combining Scripture, teaching, and a practical response." },
          { type: "text", content: "The program is organized into 5 weekly themes: Foundations, The Human Condition, Encountering Jesus, Conversion & Change, and Living the Faith." },
          { type: "text", content: "Your mentor is available to support you throughout the program. Don't hesitate to reach out through the chat feature if you have questions or need encouragement." },
          { type: "action", content: "Identify the best time in your morning to complete your daily lesson. Consistency is key to making lasting change." },
        ] as { type: string; content: string }[],
      },
      {
        position: 3,
        title: "The Bible",
        subtitle: "How to read and understand Scripture",
        slides: [
          { type: "text", content: "The Bible is the inspired Word of God — written by human authors under the guidance of the Holy Spirit." },
          { type: "text", content: "The Catholic Bible contains 73 books: 46 in the Old Testament and 27 in the New Testament. Together they reveal God's plan of salvation." },
          { type: "text", content: "Scripture and Tradition are the two pillars of divine Revelation. The Church's Magisterium authentically interprets both." },
          { type: "text", content: "Throughout this program, each day's lesson draws from Scripture. Read each passage slowly, ask what God is saying, and let it speak to your heart." },
          { type: "action", content: "If you don't have a Bible, download a free Catholic app such as Laudate or iBreviary. Commit to reading each day's passage before completing the lesson." },
        ] as { type: string; content: string }[],
      },
    ]).onConflictDoNothing();
    console.log("Prelim modules seeded (ON CONFLICT DO NOTHING).");

    console.log("Seeding complete.");
}
