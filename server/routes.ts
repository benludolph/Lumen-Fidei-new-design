import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword, verifyPassword } from "./auth";
import { storage } from "./storage";
import { sendPasswordResetEmail } from "./email";
import crypto from "crypto";
import { api } from "@shared/routes";
import { z } from "zod";
import { WORKBOOK_CATEGORY_SECTIONS } from "@shared/workbook-categories";
import { tracks, insertTrackAContentSchema, insertTrackAModuleSchema, uploadedImages, trackAContent, trackAModules, trackASnapshots, surveyResponses, prelimModules, practiceResources, chatFlowResponses, cohortSettings, moduleOverlays, testimonies, testimonyParts, cohorts, users as usersTable, type User, WORKBOOK_MAX_SECTION_ID } from "@shared/schema";
import { trackDb as db } from "./track-db";
import { currentTrackId, withTrack } from "./track-context";
import { registerTrackRoutes, trackScopeMiddleware, validateTrackAssignment } from "./tracks";
import { eq, sql, and, gt } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import sanitizeHtml from "sanitize-html";
import { practiceResourcesData } from "./content-data";
import { trackAContentData } from "./track-a-content-data";
import multer from "multer";
import path from "path";
import fs from "fs";
import { parse as parseCsv } from "csv-parse/sync";

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

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "application/octet-stream", "application/x-pdf", "binary/octet-stream"];
    const looksLikePdf = file.originalname.toLowerCase().endsWith(".pdf");
    if (allowed.includes(file.mimetype) && looksLikePdf) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/ogg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only MP4, WebM, MOV, and OGG video files are allowed"));
    }
  },
});

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel', 'application/octet-stream'];
    const hasValidExt = file.originalname.toLowerCase().endsWith('.csv');
    if (hasValidExt || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted (.csv extension required)'));
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

/**
 * Returns the effective current program day for a user.
 * If the user has a manualDayOverride set, that value is used instead of the
 * global cohort calendar — allowing holdover participants from a previous
 * cohort to finish without being locked out by the new cohort's date.
 */
function effectiveCurrentDay(user: Express.User | undefined, globalCurrentDay: number): number {
  const override = (user as any)?.manualDayOverride;
  if (typeof override === 'number' && override > 0) return override;
  return globalCurrentDay;
}

// Rate limiters for abuse protection
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  // Admins are trusted and do heavy content editing — skip limiting for them
  skip: (req) => !!(req.isAuthenticated?.() && (req.user as any)?.role === 'admin'),
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
  max: 200,
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
  await setupAuth(app);
  registerTrackRoutes(app);
  app.use("/api", trackScopeMiddleware);

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
  app.use("/api/auth/forgot-password", authLimiter);
  app.use("/api/auth/reset-password", authLimiter);

  // === Password Management ===

  // Change password (authenticated)
  app.patch("/api/user/password", requireAuth, async (req, res) => {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, "New password must be at least 8 characters"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await storage.getUser(req.user!.id);
    if (!user) return res.sendStatus(404);

    const isHashed = user.password.startsWith("$2");
    const valid = isHashed
      ? await verifyPassword(currentPassword, user.password)
      : user.password === currentPassword;

    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashed = await hashPassword(newPassword);
    await storage.updateUser(user.id, { password: hashed });
    res.json({ message: "Password updated successfully" });
  });

  // Forgot password — send reset email (public)
  app.post("/api/auth/forgot-password", async (req, res) => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    const { email } = parsed.data;
    const user = await storage.getUserByUsername(email.toLowerCase().trim());

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await storage.createPasswordResetToken(user.id, token, expiresAt);

      if (!process.env.APP_URL) {
        console.warn("[forgot-password] APP_URL env var is not set; reset emails will not be sent");
        return res.json({ message: "If that email exists, a reset link has been sent." });
      }
      const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (err) {
        console.error("Failed to send password reset email:", err);
      }
    }

    // Always return success to prevent user enumeration
    res.json({ message: "If that email exists, a reset link has been sent." });
  });

  // Reset password via token (public)
  app.post("/api/auth/reset-password", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { token, newPassword } = parsed.data;

    const record = await storage.getPasswordResetToken(token);
    if (!record) {
      return res.status(400).json({ message: "Invalid or expired reset link.", code: "INVALID_TOKEN" });
    }
    if (record.usedAt) {
      return res.status(400).json({ message: "This reset link has already been used.", code: "TOKEN_USED" });
    }
    if (new Date() > record.expiresAt) {
      return res.status(400).json({ message: "This reset link has expired.", code: "TOKEN_EXPIRED" });
    }

    const claimed = await storage.claimPasswordResetToken(token);
    if (!claimed) {
      return res.status(400).json({ message: "This reset link is no longer valid.", code: "INVALID_TOKEN" });
    }

    const hashed = await hashPassword(newPassword);
    await storage.updateUser(claimed.userId, { password: hashed });

    res.json({ message: "Password reset successfully." });
  });

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
    
    // Mentors: always scoped to their own mentees plus admins only
    if (req.user!.role === 'mentor') {
      const allUsers = await storage.getAllUsers();
      const mentees = allUsers.filter(u => u.mentorId === req.user!.id);
      const admins = allUsers.filter(u => u.role === 'admin');
      const contacts = [...admins, ...mentees].filter(u => u.id !== req.user!.id);
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

  // Get a single user's public profile (used by participants to get mentor photo)
  app.get('/api/users/:id', requireAuth, async (req, res) => {
    const targetId = Number(req.params.id);
    if (isNaN(targetId)) return res.sendStatus(400);
    const target = await storage.getUser(targetId);
    if (!target) return res.sendStatus(404);

    // Participants can only fetch their own mentor
    if (req.user!.role === 'participant') {
      if (target.id !== req.user!.mentorId && target.id !== req.user!.id) {
        return res.sendStatus(403);
      }
    }
    // Mentors can fetch their mentees or admins
    if (req.user!.role === 'mentor') {
      const isMentee = target.mentorId === req.user!.id;
      const isAdmin = target.role === 'admin';
      const isSelf = target.id === req.user!.id;
      if (!isMentee && !isAdmin && !isSelf) {
        return res.sendStatus(403);
      }
    }
    res.json(sanitizeUser(target));
  });

  app.post(api.users.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can create users" });
    }

    try {
      const input = api.users.create.input.parse(req.body);
      try { await validateTrackAssignment(input.track, input.contentVariantSnapshotId); }
      catch (error) { return res.status(400).json({ message: (error as Error).message }); }
      // Normalize email to lowercase for case-insensitive matching
      const normalizedEmail = input.email.toLowerCase().trim();
      const existing = await storage.getUserByUsername(normalizedEmail);
      if (existing) {
        return res.status(400).json({ message: "Email already taken" });
      }
      
      // Hash the password before storing
      const hashedPassword = await hashPassword(input.password);
      // Auto-assign to active cohort for participants and mentors
      let cohortId: number | null = null;
      if (input.role === 'participant' || input.role === 'mentor') {
        const activeCohort = await storage.getActiveCohort();
        if (activeCohort) cohortId = activeCohort.id;
      }
      const user = await storage.createUser({
        ...input,
        email: normalizedEmail,
        password: hashedPassword,
        ...(cohortId !== null ? { cohortId } : {}),
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
    const existingUser = await storage.getUser(userId);
    if (!existingUser) return res.sendStatus(404);
    if (input.track !== undefined && input.track !== existingUser.track && input.contentVariantSnapshotId === undefined) {
      input.contentVariantSnapshotId = null;
    }
    try {
      await validateTrackAssignment(input.track === undefined ? existingUser.track : input.track,
        input.contentVariantSnapshotId === undefined ? existingUser.contentVariantSnapshotId : input.contentVariantSnapshotId);
    } catch (error) { return res.status(400).json({ message: (error as Error).message }); }
    
    // Hash the password if it is being updated
    const updateData = input.password
      ? { ...input, password: await hashPassword(input.password) }
      : input;

    const updated = await storage.updateUser(userId, updateData);
    res.json(sanitizeUser(updated));
  });

  app.post('/api/admin/users/:id/deactivate', requireRole('admin'), async (req, res) => {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
    const target = await storage.getUser(userId);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.role === 'admin') return res.status(403).json({ message: "Cannot deactivate an admin account" });
    const updated = await storage.updateUser(userId, { isActive: false });
    res.json(sanitizeUser(updated));
  });

  app.post('/api/admin/users/:id/reactivate', requireRole('admin'), async (req, res) => {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
    const target = await storage.getUser(userId);
    if (!target) return res.status(404).json({ message: "User not found" });
    const updated = await storage.updateUser(userId, { isActive: true });
    res.json(sanitizeUser(updated));
  });

  // === Track A Content ===

  // Returns the published-variant Track A data for the given user, or null if
  // the user has no variant assigned (caller should fall back to live tables).
  async function getUserVariantData(userId: number): Promise<{ track_a_content: any[]; prelim_modules: any[] } | null> {
    const user = await storage.getUser(userId);
    if (!user?.contentVariantSnapshotId) return null;
    const snap = await storage.getTrackASnapshot(user.contentVariantSnapshotId);
    if (!snap || !snap.isPublishedVariant) return null;
    const data = snap.data as { track_a_content?: any[]; prelim_modules?: any[] } | null;
    return {
      track_a_content: Array.isArray(data?.track_a_content) ? data!.track_a_content : [],
      prelim_modules: Array.isArray(data?.prelim_modules) ? data!.prelim_modules : [],
    };
  }

  app.get('/api/track-a-content', requireAuth, async (req, res) => {
    const variant = await getUserVariantData(req.user!.id);
    const content = variant ? variant.track_a_content : await storage.getAllTrackAContent();
    if (req.user!.role !== 'admin') {
      const summaries = content.map((c: any) => ({
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
      const [completions, prelimMods] = await Promise.all([
        storage.getUserPrelimCompletions(req.user!.id),
        storage.getPrelimModules(),
      ]);
      const allPrelimsComplete = completions.length >= prelimMods.length;
      if (!allPrelimsComplete) {
        return res.status(403).json({ message: "PRELIMS_INCOMPLETE", code: "PRELIMS_INCOMPLETE" });
      }
      // Day 0 unlocks once prelims are done (regardless of cohort start).
      // Days 1-30 require prelims done AND cohort started.
      if (day !== 0) {
        const cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
        const globalDay = computeCurrentProgramDay(cohortStartDateStr);
        const currentDay = effectiveCurrentDay(req.user, globalDay);
        if (currentDay === 0 || day > currentDay) {
          return res.status(403).json({ message: "DAY_LOCKED", code: "DAY_LOCKED" });
        }
      }
    }

    const variant = await getUserVariantData(req.user!.id);
    let content: any | undefined;
    if (variant) {
      if (day === 0) {
        content = variant.track_a_content.find((c: any) => c.dayNumber === 0);
      } else {
        // Mirror getTrackAContentByPosition: sort positive-day rows by week then day, then pick the Nth.
        const ordered = variant.track_a_content
          .filter((c: any) => typeof c.dayNumber === 'number' && c.dayNumber > 0)
          .sort((a: any, b: any) => a.weekNumber - b.weekNumber || a.dayNumber - b.dayNumber);
        content = currentTrackId() === "A" ? ordered[day - 1] : ordered.find((c: any) => c.dayNumber === day);
      }
    } else {
      content = day === 0
        ? await storage.getTrackAContent(0)
        : currentTrackId() === "A" ? await storage.getTrackAContentByPosition(day) : await storage.getTrackAContent(day);
    }
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

  // === Wrap Prayers (opening/closing defaults + per-day overrides) ===

  app.get('/api/admin/wrap-prayers', requireRole('admin', 'superuser'), async (req, res) => {
    const prayers = await storage.getWrapPrayers();
    res.json(prayers);
  });

  app.put('/api/admin/wrap-prayers/:kind', requireRole('admin'), async (req, res) => {
    const kind = req.params.kind as "opening" | "closing";
    if (kind !== "opening" && kind !== "closing") return res.status(400).json({ message: "kind must be opening or closing" });
    const schema = z.object({ prayerText: z.string(), audioUrl: z.string().nullable().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const prayer = await storage.upsertWrapPrayer(kind, parsed.data.prayerText, parsed.data.audioUrl ?? null);
    res.json(prayer);
  });

  app.post('/api/admin/wrap-prayers/:kind/audio', requireRole('admin'), uploadLimiter, audioUpload.single('audio'), async (req, res) => {
    const kind = req.params.kind as "opening" | "closing";
    if (kind !== "opening" && kind !== "closing") return res.status(400).json({ message: "kind must be opening or closing" });
    if (!req.file) return res.status(400).json({ message: "No audio file provided" });
    try {
      const ext = path.extname(req.file.originalname);
      const filename = `wrap_prayer_${kind}_${Date.now()}${ext}`;
      const base64Data = req.file.buffer.toString("base64");
      await db.insert(uploadedImages).values({ filename, mimeType: req.file.mimetype, data: base64Data })
        .onConflictDoUpdate({ target: uploadedImages.filename, set: { data: base64Data, mimeType: req.file.mimetype } });
      res.json({ url: `/api/images/${filename}` });
    } catch {
      res.status(500).json({ message: "Failed to save audio" });
    }
  });

  // GET /api/track-a/prayers/:day — effective prayers for a day (global defaults merged with per-day overrides)
  app.get('/api/track-a/prayers/:day', requireAuth, async (req, res) => {
    const day = Number(req.params.day);
    if (isNaN(day)) return res.status(400).json({ message: "Invalid day" });

    const [globalPrayers, dayContent] = await Promise.all([
      storage.getWrapPrayers(),
      day > 0 ? storage.getTrackAContentByPosition(day) : storage.getTrackAContent(day),
    ]);

    const globalOpening = globalPrayers.find(p => p.kind === "opening");
    const globalClosing = globalPrayers.find(p => p.kind === "closing");

    const opening = (() => {
      const text = dayContent?.openingPrayerText ?? globalOpening?.prayerText ?? "";
      const audio = dayContent?.openingPrayerAudio ?? globalOpening?.audioUrl ?? null;
      return (text || audio) ? { text, audioUrl: audio } : null;
    })();

    const closing = (() => {
      const text = dayContent?.closingPrayerText ?? globalClosing?.prayerText ?? "";
      const audio = dayContent?.closingPrayerAudio ?? globalClosing?.audioUrl ?? null;
      return (text || audio) ? { text, audioUrl: audio } : null;
    })();

    res.json({ opening, closing });
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

  app.patch('/api/admin/track-a/modules/reorder', requireRole('admin'), async (req, res) => {
    try {
      const schema = z.object({ weekNumbers: z.array(z.number().int().positive()) });
      const { weekNumbers } = schema.parse(req.body);
      await storage.reorderTrackAModules(weekNumbers);
      res.json({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });

  app.patch('/api/admin/track-a/content/reorder', requireRole('admin'), async (req, res) => {
    try {
      const schema = z.object({ dayNumbers: z.array(z.number().int()) });
      const { dayNumbers } = schema.parse(req.body);
      await storage.reorderTrackAContent(dayNumbers);
      res.json({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });

  app.post('/api/admin/track-a/renumber', requireRole('admin'), async (req, res) => {
    try {
      const { dayChanges, weekChanges } = await storage.renumberTrackAContent();
      res.json({ ok: true, changes: dayChanges, weekChanges });
    } catch (error) {
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

  // === Mentor Profile Photo Upload ===

  // Mentor uploads their own profile photo
  app.post('/api/mentor/upload-photo', requireRole('mentor', 'admin'), uploadLimiter, upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    try {
      const ext = path.extname(req.file.originalname);
      const base = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `mentor_photo_${req.user!.id}_${Date.now()}${ext}`;
      const base64Data = req.file.buffer.toString("base64");

      await db.insert(uploadedImages).values({
        filename,
        mimeType: req.file.mimetype,
        data: base64Data,
      }).onConflictDoUpdate({
        target: uploadedImages.filename,
        set: { data: base64Data, mimeType: req.file.mimetype },
      });

      const photoUrl = `/api/images/${filename}`;
      await storage.updateUser(req.user!.id, { profilePhotoUrl: photoUrl });

      res.json({ url: photoUrl });
    } catch (error) {
      console.error("Mentor photo upload error:", error);
      res.status(500).json({ message: "Failed to save photo" });
    }
  });

  // Admin sets profile photo for any mentor
  app.post('/api/admin/mentor/:mentorId/upload-photo', requireRole('admin'), uploadLimiter, upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const mentorId = Number(req.params.mentorId);
    const mentor = await storage.getUser(mentorId);
    if (!mentor || (mentor.role !== 'mentor' && mentor.role !== 'admin')) {
      return res.status(404).json({ message: "Mentor not found" });
    }
    try {
      const ext = path.extname(req.file.originalname);
      const base = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `mentor_photo_${mentorId}_${Date.now()}${ext}`;
      const base64Data = req.file.buffer.toString("base64");

      await db.insert(uploadedImages).values({
        filename,
        mimeType: req.file.mimetype,
        data: base64Data,
      }).onConflictDoUpdate({
        target: uploadedImages.filename,
        set: { data: base64Data, mimeType: req.file.mimetype },
      });

      const photoUrl = `/api/images/${filename}`;
      await storage.updateUser(mentorId, { profilePhotoUrl: photoUrl });

      res.json({ url: photoUrl });
    } catch (error) {
      console.error("Admin mentor photo upload error:", error);
      res.status(500).json({ message: "Failed to save photo" });
    }
  });

  app.post('/api/admin/upload-pdf', requireRole('admin'), uploadLimiter, async (req, res) => {
    const { filename: originalFilename, data: base64Data, mimeType } = req.body ?? {};
    if (!base64Data || !originalFilename) {
      return res.status(400).json({ message: "No PDF data provided" });
    }
    if (!String(originalFilename).toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ message: "Only PDF files are allowed" });
    }
    const binarySize = Math.floor(String(base64Data).length * 3 / 4);
    if (binarySize > 15 * 1024 * 1024) {
      return res.status(400).json({ message: "PDF too large (max 15 MB)" });
    }
    try {
      const base = path.basename(String(originalFilename), ".pdf").replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${base}_${Date.now()}.pdf`;

      await db.insert(uploadedImages).values({
        filename,
        mimeType: "application/pdf",
        data: String(base64Data),
      }).onConflictDoUpdate({
        target: uploadedImages.filename,
        set: { data: String(base64Data), mimeType: "application/pdf" },
      });

      res.json({ url: `/api/images/${filename}` });
    } catch (error) {
      console.error("PDF upload error:", error);
      res.status(500).json({ message: "Failed to save PDF" });
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

  app.post('/api/admin/upload-video', requireRole('admin'), uploadLimiter, videoUpload.single('video'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No video file provided" });
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
      console.error("Video upload error:", error);
      res.status(500).json({ message: "Failed to save video" });
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

  // === Guided Prayer Process Responses ===

  app.get('/api/guided-prayer-responses', requireAuth, async (req, res) => {
    try {
      const dayNumber = parseInt(req.query.dayNumber as string, 10);
      const slideIndex = parseInt(req.query.slideIndex as string, 10);
      if (isNaN(dayNumber) || isNaN(slideIndex)) {
        return res.status(400).json({ message: "dayNumber and slideIndex are required integers" });
      }
      const row = await storage.getGuidedPrayerResponse(req.user!.id, dayNumber, slideIndex);
      res.json(row ?? null);
    } catch (e) {
      console.error("Guided prayer GET error:", e);
      res.status(500).json({ message: "Failed to fetch guided prayer response" });
    }
  });

  app.post('/api/guided-prayer-responses', requireAuth, writeLimiter, async (req, res) => {
    try {
      const bodySchema = z.object({
        dayNumber: z.number().int(),
        slideIndex: z.number().int().min(0),
        variables: z.record(z.union([z.string(), z.array(z.string())])),
      });
      const body = bodySchema.parse(req.body);
      const row = await storage.upsertGuidedPrayerResponse(req.user!.id, body.dayNumber, body.slideIndex, body.variables);
      res.status(201).json(row);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid request", errors: e.errors });
      console.error("Guided prayer POST error:", e);
      res.status(500).json({ message: "Failed to save guided prayer response" });
    }
  });

  app.get('/api/admin/guided-prayer-responses', requireRole('admin', 'mentor'), async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string, 10);
      if (isNaN(userId)) return res.status(400).json({ message: "userId is required" });
      if (req.user!.role === 'mentor') {
        const targetUser = await storage.getUser(userId);
        if (!targetUser || targetUser.mentorId !== req.user!.id) {
          return res.sendStatus(403);
        }
      }
      const rows = await storage.getGuidedPrayerResponsesByUserId(userId);
      res.json(rows);
    } catch (e) {
      console.error("Admin guided prayer GET error:", e);
      res.status(500).json({ message: "Failed to fetch guided prayer responses" });
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

  // === Journal ===

  app.get('/api/journal', requireRole('participant', 'superuser'), async (req, res) => {
    const modules = await storage.getJournalEntries(req.user!.id);
    res.json(modules);
  });

  // === Chat ===

  // Unread message count - must be BEFORE the :otherUserId route
  app.get(api.chat.unreadCount.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const count = await storage.getUnreadMessageCount(req.user!.id);
    res.json({ count });
  });

  app.get(api.chat.unreadByConversation.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const counts = await storage.getUnreadMessageCountsBySender(req.user!.id);
    res.json(counts);
  });

  // Mark messages as read for the current user. If a sender is supplied,
  // only that conversation is marked read; otherwise preserve the legacy
  // mark-all behavior for callers that still use this endpoint.
  app.post("/api/messages/mark-read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const senderId = Number(req.body?.senderId);
    if (Number.isInteger(senderId) && senderId > 0) {
      await storage.markMessagesAsRead(senderId, req.user!.id);
    } else {
      await storage.markAllMessagesAsRead(req.user!.id);
    }
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
    
    const track = req.params.track as string;
    const reqs = await storage.getAllTrackRequirements(track);
    res.json(reqs);
  });

  app.get(api.trackRequirements.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const track = req.params.track as string;
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
      const globalDay = computeCurrentProgramDay(cohortStartDateStr);
      const currentDay = effectiveCurrentDay(req.user, globalDay);
      // Allow Day 0 even before cohort starts (it's the pre-program intro module).
      // Days 1-30 are still blocked when currentDay === 0 because dayNumber > 0.
      if (input.dayNumber > currentDay) {
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

  // === Lesson Progress ===

  app.get("/api/lesson-progress/:dayNumber", requireAuth, async (req, res) => {
    const dayNumber = parseInt(String(req.params.dayNumber), 10);
    if (isNaN(dayNumber)) return res.sendStatus(400);
    const progress = await storage.getLessonProgress(req.user!.id, dayNumber);
    res.json(progress ?? null);
  });

  app.put("/api/lesson-progress/:dayNumber", requireAuth, writeLimiter, async (req, res) => {
    const dayNumber = parseInt(String(req.params.dayNumber), 10);
    if (isNaN(dayNumber)) return res.sendStatus(400);
    const schema = z.object({ slideIndex: z.number().int().min(0) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    await storage.upsertLessonProgress(req.user!.id, dayNumber, parsed.data.slideIndex);
    res.json({ ok: true });
  });

  app.delete("/api/lesson-progress/:dayNumber", requireAuth, async (req, res) => {
    const dayNumber = parseInt(String(req.params.dayNumber), 10);
    if (isNaN(dayNumber)) return res.sendStatus(400);
    await storage.deleteLessonProgress(req.user!.id, dayNumber);
    res.json({ ok: true });
  });

  // === Admin Routes ===

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

  // === Cohorts list ===
  app.get(api.admin.listCohorts.path, requireRole('admin'), async (req, res) => {
    const list = await storage.listCohorts();
    res.json(list.map(c => ({
      id: c.id,
      name: c.name,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate ? c.endDate.toISOString() : null,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    })));
  });

  // === Active cohort ===
  app.get(api.admin.getActiveCohort.path, requireRole('admin'), async (req, res) => {
    const cohort = await storage.getActiveCohort();
    if (!cohort) return res.json(null);
    res.json({
      id: cohort.id,
      name: cohort.name,
      startDate: cohort.startDate.toISOString(),
      endDate: cohort.endDate ? cohort.endDate.toISOString() : null,
      status: cohort.status,
      createdAt: cohort.createdAt.toISOString(),
    });
  });

  app.get(api.admin.progress.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const cohortIdParam = req.query.cohortId ? Number(req.query.cohortId) : null;
    
    const allUsers = await storage.getAllUsers();
    const completions = await storage.getAllPrayerCompletions();
    const totalDays = currentTrackId() === "A" ? 30 : (await storage.getAllTrackAContent()).filter(c => c.dayNumber > 0).length;

    let cohortStartDateStr: string | null;
    let participantUsers: typeof allUsers;

    const cohortList = await storage.listCohorts();

    if (cohortIdParam) {
      // Filter to users in the specified cohort; use that cohort's startDate
      const selectedCohort = cohortList.find(c => c.id === cohortIdParam);
      cohortStartDateStr = selectedCohort ? selectedCohort.startDate.toISOString().split('T')[0] : null;
      participantUsers = allUsers.filter(u => u.track === currentTrackId() && u.role === 'participant' && u.cohortId === cohortIdParam);
    } else {
      // Default to active cohort
      const activeCohort = cohortList.find(c => c.status === "active");
      if (activeCohort) {
        cohortStartDateStr = activeCohort.startDate.toISOString().split('T')[0];
        participantUsers = allUsers.filter(u => u.track === currentTrackId() && u.role === 'participant' && u.cohortId === activeCohort.id);
      } else {
        // Fallback for databases without cohort records
        cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
        participantUsers = allUsers.filter(u => u.track === currentTrackId() && u.role === 'participant');
      }
    }

    const cohortCurrentDay = computeCurrentProgramDay(cohortStartDateStr);
    
    const users = allUsers; // keep alias for mentor lookup below
    const progressData = participantUsers
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
          if (Boolean(u.track)) {
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
          totalDays,
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
    const globalDay = computeCurrentProgramDay(startDateStr);
    
    // Admins and superusers always see all 30 days unlocked;
    // participants with a manualDayOverride use that value instead of the cohort calendar.
    const role = req.user!.role;
    const resolvedDay = (role === 'admin' || role === 'superuser') ? 30 : effectiveCurrentDay(req.user, globalDay);
    
    res.json({ startDate: startDateStr, currentDay: resolvedDay });
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

  // === Per-Module Reflection Overlay Settings ===

  app.get('/api/admin/module-overlays', requireRole('admin'), async (req, res) => {
    const overlays = await storage.listModuleOverlays();
    res.json(overlays);
  });

  app.get('/api/admin/module-overlays/:contextKey', requireRole('admin'), async (req, res) => {
    const overlay = await storage.getModuleOverlay(req.params.contextKey as string);
    res.json(overlay ?? { contextKey: req.params.contextKey as string, enabled: false, imageUrl: "", text: "Reflection Unlocked", subtext: "", label: "" });
  });

  app.post('/api/admin/module-overlays/:contextKey', requireRole('admin'), async (req, res) => {
    const schema = z.object({
      enabled: z.boolean(),
      imageUrl: z.string(),
      text: z.string(),
      subtext: z.string(),
      label: z.string().optional().default(""),
    });
    try {
      const { enabled, imageUrl, text, subtext, label } = schema.parse(req.body);
      const overlay = await storage.upsertModuleOverlay({
        trackId: currentTrackId(),
        contextKey: req.params.contextKey as string,
        enabled,
        imageUrl,
        text,
        subtext,
        label,
        updatedAt: new Date(),
      });
      res.json(overlay);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  // === Reflection Overlay Settings (legacy global — kept for compatibility) ===

  app.get('/api/admin/reflection-overlay', requireRole('admin'), async (req, res) => {
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
      
      if (input.clearCompletions) {
        completionsCleared = await storage.clearAllPrayerCompletions();
      }

      // Archive current active cohort if one exists
      const activeCohort = await storage.getActiveCohort();
      if (activeCohort) {
        await storage.archiveCohort(activeCohort.id, new Date());
      }

      // Create new cohort record
      const newCohort = await storage.createCohort(input.name, new Date(input.startDate));

      // Assign all non-admin users with no cohortId to this new cohort (new users joining)
      // (existing users keep their old cohortId pointing to the archived cohort)
      
      await storage.setCohortSetting("cohort_start_date", input.startDate);
      
      res.json({ 
        message: "New cohort started successfully",
        startDate: input.startDate,
        cohortId: newCohort.id,
        completionsCleared,
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
    if (Boolean(user.track)) {
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
    const totalDays = currentTrackId() === "A" ? 30 : (await storage.getAllTrackAContent()).filter(c => c.dayNumber > 0).length;
    const graduationEligible = totalDays > 0 && daysCompleted >= Math.ceil(totalDays * 0.8);
    
    // Get answers
    const answers = await storage.getUserAnswers(userId);
    
    // Get all daily content to get questions
    const allContent = await storage.getAllTrackAContent();
    
    // Enrich answers with question texts
    const enrichedAnswers = answers.map(a => {
      const dayContent = allContent.find(c => c.dayNumber === a.dayNumber);
      return {
        id: a.id,
        dayNumber: a.dayNumber,
        content: a.content,
        createdAt: a.createdAt.toISOString(),
        questions: null,
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
        currentDay,
        daysCompleted,
        totalPossibleDays: Math.min(currentDay, totalDays),
        totalDays,
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
    
    const headers = ['ID', 'Name', 'Email', 'Role', 'Track', 'Mentor ID', 'Start Date'];
    const rows = users.map(u => [
      escapeCSV(u.id),
      escapeCSV(u.name),
      escapeCSV(u.email),
      escapeCSV(u.role),
      escapeCSV(u.track),
      escapeCSV(u.mentorId),
      escapeCSV(u.startDate ? new Date(u.startDate).toISOString() : null),
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
    const totalDays = currentTrackId() === "A" ? 30 : (await storage.getAllTrackAContent()).filter(c => c.dayNumber > 0).length;
    
    const cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
    const cohortCurrentDay = computeCurrentProgramDay(cohortStartDateStr);
    
    const progressData = users
      .filter(u => u.role === 'participant' && u.track === currentTrackId())
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
          if (Boolean(u.track)) {
            if (status.morning) daysCompleted++;
          } else {
            if (status.morning && status.evening) daysCompleted++;
          }
        });
        
        const mentor = users.find(m => m.id === u.mentorId);
        const completionRate = currentDay > 0 ? ((daysCompleted / currentDay) * 100).toFixed(1) : '0.0';
        const graduationStatus = daysCompleted >= Math.ceil(totalDays * .8) && totalDays > 0 ? 'Passed' : 
          (currentDay >= totalDays ? 'At Risk' : 'In Progress');
        
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
  
  // === Admin Content Backup & Restore ===

  function escapeCSVContent(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  app.get('/api/admin/export/track-a.csv', requireRole('admin'), async (req, res) => {
    const [allContent, allPrelim] = await Promise.all([
      storage.getAllTrackAContent(),
      storage.getPrelimModules(),
    ]);

    const headers = ['dayNumber', 'weekNumber', 'centralTheme', 'subtitle', 'dayImageUrl', 'completionMessage', 'slideIndex', 'slideType', 'slideContent'];

    const rows: string[] = [];

    // Prelim modules exported with dayNumber = -position so they round-trip cleanly
    for (const mod of allPrelim) {
      const slides = (mod.slides || []) as { type: string; content: string }[];
      if (slides.length === 0) {
        rows.push([
          escapeCSVContent(-mod.position),
          escapeCSVContent(0),
          escapeCSVContent(mod.title),
          escapeCSVContent(mod.subtitle),
          escapeCSVContent(mod.imageUrl),
          '',
          '',
          '',
          '',
        ].join(','));
      } else {
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          rows.push([
            escapeCSVContent(-mod.position),
            escapeCSVContent(0),
            escapeCSVContent(mod.title),
            escapeCSVContent(mod.subtitle),
            escapeCSVContent(mod.imageUrl),
            '',
            escapeCSVContent(i),
            escapeCSVContent(slide.type),
            escapeCSVContent(slide.content),
          ].join(','));
        }
      }
    }

    for (const day of allContent) {
      const slides = (day.slides || []) as { type: string; content: string }[];
      if (slides.length === 0) {
        rows.push([
          escapeCSVContent(day.dayNumber),
          escapeCSVContent(day.weekNumber),
          escapeCSVContent(day.centralTheme),
          escapeCSVContent(day.subtitle),
          escapeCSVContent(day.imageUrl),
          escapeCSVContent(day.completionMessage),
          '',
          '',
          '',
        ].join(','));
      } else {
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          rows.push([
            escapeCSVContent(day.dayNumber),
            escapeCSVContent(day.weekNumber),
            escapeCSVContent(day.centralTheme),
            escapeCSVContent(day.subtitle),
            escapeCSVContent(day.imageUrl),
            escapeCSVContent(day.completionMessage),
            escapeCSVContent(i),
            escapeCSVContent(slide.type),
            escapeCSVContent(slide.content),
          ].join(','));
        }
      }
    }

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="track-a-content.csv"');
    res.send(csv);
  });

  app.post('/api/admin/import/track-a', requireRole('admin'), csvUpload.single('csv'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No CSV file provided" });
    }

    try {
      const csvText = req.file.buffer.toString('utf-8');
      const records = parseCsv(csvText, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        trim: true,
      }) as Record<string, string>[];

      if (records.length === 0) {
        return res.status(400).json({ message: "CSV file is empty or has no data rows" });
      }

      // Auto-snapshot the current state before any import overwrites it
      const autoSnapName = `Auto-save: before import – ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
      await storage.createTrackASnapshot(autoSnapName);

      const requiredColumns = ['dayNumber', 'weekNumber', 'centralTheme'];
      const firstRow = records[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      if (missingColumns.length > 0) {
        return res.status(400).json({
          message: `CSV is missing required columns: ${missingColumns.join(', ')}. Expected headers: dayNumber, weekNumber, centralTheme, subtitle, dayImageUrl, completionMessage, slideIndex, slideType, slideContent`,
        });
      }

      type DayAccumulator = {
        weekNumber: number;
        centralTheme: string;
        subtitle: string;
        dayImageUrl: string;
        completionMessage: string;
        slides: { slideIndex: number; type: string; content: string }[];
      };

      const dayMap = new Map<number, DayAccumulator>();

      for (const row of records) {
        const dayNum = parseInt(row.dayNumber, 10);
        if (isNaN(dayNum)) continue;

        // Negative dayNumbers are prelim modules (position = abs(dayNum))
        // Track A days must be 0–30
        if (dayNum > 30) {
          return res.status(400).json({ message: `Invalid dayNumber ${row.dayNumber} on row — must be ≤ 30` });
        }

        if (dayNum >= 0) {
          const weekNum = parseInt(row.weekNumber, 10);
          if (!isNaN(weekNum) && weekNum !== 0 && (weekNum < 1 || weekNum > 5)) {
            return res.status(400).json({ message: `Invalid weekNumber ${row.weekNumber} for day ${dayNum} — must be 0–5` });
          }
        }

        if (!dayMap.has(dayNum)) {
          const weekNum = parseInt(row.weekNumber, 10);
          dayMap.set(dayNum, {
            weekNumber: isNaN(weekNum) ? 0 : weekNum,
            centralTheme: row.centralTheme || '',
            subtitle: row.subtitle || '',
            dayImageUrl: row.dayImageUrl || '',
            completionMessage: row.completionMessage || '',
            slides: [],
          });
        }

        const dayData = dayMap.get(dayNum)!;
        if (row.slideType && row.slideType.trim() !== '') {
          const slideIndex = parseInt(row.slideIndex, 10);
          dayData.slides.push({
            slideIndex: isNaN(slideIndex) ? dayData.slides.length : slideIndex,
            type: row.slideType,
            content: row.slideContent || '',
          });
        }
      }

      let updatedCount = 0;
      for (const [dayNum, data] of Array.from(dayMap.entries())) {
        const slides = data.slides
          .sort((a: { slideIndex: number; type: string; content: string }, b: { slideIndex: number; type: string; content: string }) => a.slideIndex - b.slideIndex)
          .map(({ type, content }: { slideIndex: number; type: string; content: string }) => ({ type, content }));

        if (dayNum < 0) {
          // Prelim module — dayNumber encodes position as negative
          const position = Math.abs(dayNum);
          await storage.upsertPrelimModule({
            position,
            title: data.centralTheme || 'Untitled',
            subtitle: data.subtitle || null,
            imageUrl: data.dayImageUrl || null,
            slides: slides.length > 0 ? slides : null,
          });
        } else {
          let imageUrl = data.dayImageUrl;
          if (!imageUrl) {
            const existing = await storage.getTrackAContent(dayNum);
            if (existing) imageUrl = existing.imageUrl || '';
          }

          await storage.upsertTrackAContent({
            dayNumber: dayNum,
            weekNumber: data.weekNumber,
            centralTheme: data.centralTheme || 'Untitled',
            subtitle: data.subtitle || null,
            imageUrl: imageUrl || null,
            completionMessage: data.completionMessage || null,
            slides: slides.length > 0 ? slides : null,
          });
        }
        updatedCount++;
      }

      res.json({ updated: updatedCount });
    } catch (err: any) {
      res.status(400).json({ message: err?.message || 'Failed to parse CSV' });
    }
  });

  // === Track A Snapshots (version control) ===

  app.get('/api/admin/track-a/snapshots', requireRole('admin'), async (req, res) => {
    const snaps = await storage.listTrackASnapshots();
    res.json(snaps);
  });

  app.post('/api/admin/track-a/snapshots', requireRole('admin'), async (req, res) => {
    const rawName = (req.body?.name ?? '').toString().trim();
    const name = rawName || `Manual save – ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    const snap = await storage.createTrackASnapshot(name);
    res.json(snap);
  });

  app.post('/api/admin/track-a/snapshots/:id/restore', requireRole('admin'), async (req, res) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid snapshot id' });
    await storage.restoreTrackASnapshot(id);
    res.json({ ok: true });
  });

  app.delete('/api/admin/track-a/snapshots/:id', requireRole('admin'), async (req, res) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid snapshot id' });
    await storage.deleteTrackASnapshot(id);
    res.json({ ok: true });
  });

  // Toggle a snapshot's published-variant status and label.
  // Body: { isPublished: boolean, variantLabel?: string | null }
  app.patch('/api/admin/track-a/snapshots/:id/publication', requireRole('admin'), async (req, res) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid snapshot id' });
    const isPublished = !!req.body?.isPublished;
    const variantLabel = typeof req.body?.variantLabel === 'string' ? req.body.variantLabel : null;
    try {
      const updated = await storage.setTrackASnapshotPublication(id, isPublished, variantLabel);
      res.json(updated);
    } catch (err: any) {
      if (err?.message === 'SNAPSHOT_NOT_FOUND') {
        return res.status(404).json({ message: 'Snapshot not found' });
      }
      res.status(400).json({ message: err?.message || 'Failed to update snapshot publication' });
    }
  });

  // List published Track A variants — used to populate the admin user-row variant dropdown.
  app.get('/api/admin/track-a/variants', requireRole('admin'), async (req, res) => {
    const variants = await storage.listPublishedTrackAVariants();
    res.json(variants.map(v => ({
      id: v.id,
      name: v.name,
      variantLabel: v.variantLabel,
      createdAt: v.createdAt,
    })));
  });

  // GET /api/admin/track-a/snapshots/:id/modules — week-module structure from a snapshot, for merge preview UI
  app.get('/api/admin/track-a/snapshots/:id/modules', requireRole('admin'), async (req, res) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid snapshot id' });
    const snap = await storage.getTrackASnapshot(id);
    if (!snap) return res.status(404).json({ message: 'Snapshot not found' });

    const { track_a_content } = snap.data as { track_a_content: any[] };
    const liveModules = await storage.getTrackAModules();
    const moduleMap = new Map(liveModules.map(m => [m.weekNumber, m]));

    const weekMap = new Map<number, any[]>();
    for (const day of (track_a_content ?? [])) {
      const wn: number = day.weekNumber;
      if (!weekMap.has(wn)) weekMap.set(wn, []);
      weekMap.get(wn)!.push(day);
    }

    const result = Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([weekNumber, days]) => {
        const mod = moduleMap.get(weekNumber);
        return {
          weekNumber,
          title: mod?.title ?? `Week ${weekNumber}`,
          subtitle: mod?.subtitle ?? '',
          days: days
            .sort((a: any, b: any) => a.dayNumber - b.dayNumber)
            .map((d: any) => ({
              dayNumber: d.dayNumber,
              centralTheme: d.centralTheme,
              subtitle: d.subtitle ?? null,
              slides: d.slides ?? null,
            })),
        };
      });

    res.json(result);
  });

  // POST /api/admin/track-a/snapshots/:targetId/merge — copy selected week modules from source into target snapshot
  app.post('/api/admin/track-a/snapshots/:targetId/merge', requireRole('admin'), async (req, res) => {
    const targetId = parseInt(req.params.targetId as string, 10);
    if (isNaN(targetId)) return res.status(400).json({ message: 'Invalid snapshot id' });

    const schema = z.object({
      sourceSnapshotId: z.number().int().positive(),
      weekNumbers: z.array(z.number().int()).min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    const { sourceSnapshotId, weekNumbers } = parsed.data;
    if (sourceSnapshotId === targetId) return res.status(400).json({ message: 'Source and target must be different snapshots' });

    const [target, source] = await Promise.all([
      storage.getTrackASnapshot(targetId),
      storage.getTrackASnapshot(sourceSnapshotId),
    ]);
    if (!target) return res.status(404).json({ message: 'Target snapshot not found' });
    if (!source) return res.status(404).json({ message: 'Source snapshot not found' });

    const weekSet = new Set(weekNumbers);
    const targetData = target.data as { track_a_content: any[]; prelim_modules: any[] };
    const sourceData = source.data as { track_a_content: any[]; prelim_modules: any[] };

    const kept = (targetData.track_a_content ?? []).filter((d: any) => !weekSet.has(d.weekNumber));
    const imported = (sourceData.track_a_content ?? []).filter((d: any) => weekSet.has(d.weekNumber));
    const merged = [...kept, ...imported].sort((a: any, b: any) =>
      a.weekNumber !== b.weekNumber ? a.weekNumber - b.weekNumber : a.dayNumber - b.dayNumber
    );

    const updatedData = { ...targetData, track_a_content: merged };
    const [updated] = await db
      .update(trackASnapshots)
      .set({ data: updatedData })
      .where(eq(trackASnapshots.id, targetId))
      .returning();

    res.json(updated);
  });

  app.get('/api/admin/backup', requireRole('admin'), async (req, res) => {
    try {
      const [
        dbPrelimModules,
        dbTrackAContent,
        dbTrackAModules,
        dbModuleOverlays,
        dbPracticeResources,
        dbCohortSettings,
      ] = await Promise.all([
        db.select().from(prelimModules),
        db.select().from(trackAContent),
        db.select().from(trackAModules),
        db.select().from(moduleOverlays),
        db.select().from(practiceResources),
        db.select().from(cohortSettings),
      ]);

      const backup = {
        version: 1,
        trackId: currentTrackId(),
        exportedAt: new Date().toISOString(),
        data: {
          prelim_modules: dbPrelimModules,
          track_a_content: dbTrackAContent,
          track_a_modules: dbTrackAModules,
          daily_content: [],
          module_overlays: dbModuleOverlays,
          practice_resources: dbPracticeResources,
          cohort_settings: dbCohortSettings,
        },
      };

      const filename = `lumen-fidei-backup-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(backup);
    } catch (error) {
      console.error("Backup error:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  const backupRestoreSchema = z.object({
    version: z.literal(1),
    trackId: z.string().optional(),
    exportedAt: z.string(),
    data: z.object({
      prelim_modules: z.array(z.object({ position: z.number(), title: z.string() }).passthrough()),
      track_a_content: z.array(z.object({ dayNumber: z.number(), weekNumber: z.number(), centralTheme: z.string() }).passthrough()),
      track_a_modules: z.array(z.object({ weekNumber: z.number(), title: z.string(), subtitle: z.string() }).passthrough()),
      daily_content: z.array(z.object({ dayNumber: z.number(), weekNumber: z.number(), weekTitle: z.string() }).passthrough()),
      module_overlays: z.array(z.object({ contextKey: z.string() }).passthrough()),
      practice_resources: z.array(z.object({ name: z.string(), type: z.string(), content: z.string() }).passthrough()),
      cohort_settings: z.array(z.object({ key: z.string(), value: z.string() }).passthrough()),
      uploaded_images: z.array(z.object({ filename: z.string(), mimeType: z.string(), data: z.string() }).passthrough()).optional(),
    }),
  });

  app.post('/api/admin/restore', requireRole('admin'), async (req, res) => {
    try {
      const parsed = backupRestoreSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid backup file format", errors: parsed.error.errors });
      }

      if ((parsed.data.trackId || "A") !== currentTrackId()) return res.status(400).json({ message: "Select the track this backup belongs to before restoring it." });
      const { data } = parsed.data;

      await db.transaction(async (tx) => {
        // Always delete all content tables first so restore is exact regardless of array length
        await tx.delete(prelimModules);
        await tx.delete(trackAContent);
        await tx.delete(trackAModules);
        await tx.delete(moduleOverlays);
        await tx.delete(cohortSettings);

        for (const row of data.prelim_modules) {
          const { id: _id, ...rest } = row;
          await tx.insert(prelimModules).values(rest);
        }

        for (const row of data.track_a_content) {
          const { id: _id, ...rest } = row;
          await tx.insert(trackAContent).values(rest);
        }

        for (const row of data.track_a_modules) {
          const { id: _id, ...rest } = row;
          await tx.insert(trackAModules).values(rest);
        }

        for (const row of data.module_overlays) {
          const { updatedAt: _ua, ...rest } = row;
          await tx.insert(moduleOverlays).values(rest as any);
        }

        for (const row of data.cohort_settings) {
          const { id: _id, updatedAt: _ua, ...rest } = row;
          await tx.insert(cohortSettings).values(rest);
        }
      });

      const counts = {
        prelim_modules: data.prelim_modules.length,
        track_a_content: data.track_a_content.length,
        track_a_modules: data.track_a_modules.length,
        daily_content: 0,
        module_overlays: data.module_overlays.length,
        practice_resources: 0,
        cohort_settings: data.cohort_settings.length,
      };

      res.json({ message: "Restore completed successfully", counts });
    } catch (error) {
      console.error("Restore error:", error);
      res.status(500).json({ message: "Restore failed. No changes were saved." });
    }
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
    const userId = req.user!.id;
    const variant = await getUserVariantData(userId);
    const modules = variant
      ? [...variant.prelim_modules].sort((a: any, b: any) => a.position - b.position)
      : await storage.getPrelimModules();
    let completedPositions: number[] = [];
    if (req.user!.role === 'participant' || req.user!.role === 'superuser') {
      const completions = await storage.getUserPrelimCompletions(userId);
      completedPositions = completions.map(c => c.modulePosition);
    }
    const result = modules.map((m: any) => ({
      ...m,
      completed: completedPositions.includes(m.position),
    }));
    res.json(result);
  });

  // POST /api/prelim-modules/:position/complete — mark a prelim module as done
  app.post('/api/prelim-modules/:position/complete', requireAuth, async (req, res) => {
    if (req.user!.role !== 'participant' && req.user!.role !== 'superuser') {
      return res.status(403).json({ message: "Only participants can complete prelim modules." });
    }
    const position = Number(req.params.position);
    if (isNaN(position) || position < 1) {
      return res.status(400).json({ message: "Invalid module position." });
    }
    const userId = req.user!.id;
    const variant = await getUserVariantData(userId);
    const allModules = variant ? variant.prelim_modules : await storage.getPrelimModules();
    if (position > allModules.length) {
      return res.status(400).json({ message: "Invalid module position." });
    }
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

  // === Confession Finder ===

  app.post('/api/confession-finder/search', requireAuth, async (req, res) => {
    const apiKey = process.env.MASSTIMES_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "Confession finder is not configured. Please contact your administrator." });
    }

    const zipSchema = z.object({ zipCode: z.string().regex(/^\d{5}$/, "Please enter a valid 5-digit ZIP code.") });
    const parsed = zipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid ZIP code." });
    }
    const { zipCode } = parsed.data;

    let latitude: number;
    let longitude: number;
    try {
      const geoRes = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      if (!geoRes.ok) {
        return res.status(422).json({ message: "We could not find that ZIP code. Please check it and try again." });
      }
      const geoData = await geoRes.json() as { places?: Array<{ latitude?: string; longitude?: string }> };
      const place = geoData.places?.[0];
      if (!place?.latitude || !place?.longitude) {
        return res.status(422).json({ message: "We could not find that ZIP code. Please check it and try again." });
      }
      latitude = parseFloat(place.latitude);
      longitude = parseFloat(place.longitude);
    } catch {
      return res.status(502).json({ message: "Something went wrong while looking up your location. You can still check a parish website or ask your mentor for help." });
    }

    let churches: unknown[];
    try {
      const massUrl = `https://masstimes.org/Churchs/?lat=${latitude}&long=${longitude}&pg=1&apikey=${apiKey}`;
      const massRes = await fetch(massUrl, {
        headers: {
          'Referer': 'https://masstimes.org/',
          'Origin': 'https://masstimes.org',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0',
        },
      });
      if (!massRes.ok) {
        return res.status(502).json({ message: "Something went wrong while searching. You can still check a parish website or ask your mentor for help." });
      }
      const massData = await massRes.json();
      churches = Array.isArray(massData) ? massData : (Array.isArray((massData as Record<string, unknown>)?.churches) ? (massData as Record<string, unknown[]>).churches : []);
    } catch {
      return res.status(502).json({ message: "Something went wrong while searching. You can still check a parish website or ask your mentor for help." });
    }

    // Format a raw time string from the MassTimes API (e.g. "14:30:00" or "1/1/1900 12:00:00 AM") to "2:30 PM"
    function formatMassTime(raw: string): string {
      if (!raw) return "";
      // Placeholder value the API uses when there is no specific time
      if (raw.startsWith("1/1/1900")) return "";
      const match = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
      if (!match) return raw;
      let hour = parseInt(match[1], 10);
      const min = match[2];
      const ampm = hour >= 12 ? "PM" : "AM";
      if (hour > 12) hour -= 12;
      if (hour === 0) hour = 12;
      return min === "00" ? `${hour} ${ampm}` : `${hour}:${min} ${ampm}`;
    }

    const CONFESSION_RE = /confession|reconciliation|penance/i;
    const resultsWithConfessionTimes: unknown[] = [];
    const nearbyParishesWithoutListedTimes: unknown[] = [];

    for (const raw of churches) {
      if (!raw || typeof raw !== "object") continue;
      const c = raw as Record<string, unknown>;
      const worshipTimes: unknown[] = Array.isArray(c.church_worship_times) ? c.church_worship_times : [];

      const confessionTimes = worshipTimes
        .filter((wt: unknown) => {
          if (!wt || typeof wt !== "object") return false;
          const t = wt as Record<string, unknown>;
          return CONFESSION_RE.test(String(t.service_typename || "")) || CONFESSION_RE.test(String(t.comment || ""));
        })
        .map((wt: unknown) => {
          const t = wt as Record<string, unknown>;
          // day_of_week is a full name string with trailing spaces (e.g. "Saturday  ")
          // "99" means perpetual / no specific day
          const rawDay = String(t.day_of_week || "").trim();
          const dayOfWeek = rawDay === "99" ? "By appointment" : rawDay;
          const timeStart = formatMassTime(String(t.time_start || ""));
          const timeEnd = formatMassTime(String(t.time_end || ""));
          return {
            dayOfWeek,
            timeStart,
            timeEnd: timeEnd || undefined,
            comment: t.comment ? String(t.comment).trim() : undefined,
          };
        });

      // Normalize website URL
      const rawUrl = c.url ? String(c.url).trim() : "";
      const website = rawUrl
        ? rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
        : undefined;

      const parishData = {
        churchId: String(c.id ?? Math.random()),
        name: String(c.name ?? "Unknown Parish"),
        distance: parseFloat(String(c.distance ?? "0")) || 0,
        address: {
          street: c.church_address_street_address ? String(c.church_address_street_address) : undefined,
          city: c.church_address_city_name ? String(c.church_address_city_name) : undefined,
          state: c.church_address_providence_name ? String(c.church_address_providence_name) : undefined,
          postalCode: c.church_address_postal_code ? String(c.church_address_postal_code) : undefined,
        },
        phone: c.phone_number ? String(c.phone_number).trim() : undefined,
        website,
        latitude: parseFloat(String(c.latitude ?? "")),
        longitude: parseFloat(String(c.longitude ?? "")),
        confessionTimes,
        source: "MassTimes",
      };

      if (confessionTimes.length > 0) {
        resultsWithConfessionTimes.push(parishData);
      } else {
        nearbyParishesWithoutListedTimes.push(parishData);
      }
    }

    res.json({ searchLocation: { zipCode, latitude, longitude }, resultsWithConfessionTimes, nearbyParishesWithoutListedTimes });
  });

  app.post('/api/adoration-finder/search', requireAuth, async (req, res) => {
    const apiKey = process.env.MASSTIMES_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "Adoration finder is not configured. Please contact your administrator." });
    }

    const zipSchema = z.object({ zipCode: z.string().regex(/^\d{5}$/, "Please enter a valid 5-digit ZIP code.") });
    const parsed = zipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid ZIP code." });
    }
    const { zipCode } = parsed.data;

    let latitude: number;
    let longitude: number;
    try {
      const geoRes = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      if (!geoRes.ok) {
        return res.status(422).json({ message: "We could not find that ZIP code. Please check it and try again." });
      }
      const geoData = await geoRes.json() as { places?: Array<{ latitude?: string; longitude?: string }> };
      const place = geoData.places?.[0];
      if (!place?.latitude || !place?.longitude) {
        return res.status(422).json({ message: "We could not find that ZIP code. Please check it and try again." });
      }
      latitude = parseFloat(place.latitude);
      longitude = parseFloat(place.longitude);
    } catch {
      return res.status(502).json({ message: "Something went wrong while looking up your location. Please try again." });
    }

    let churches: unknown[];
    try {
      const massUrl = `https://masstimes.org/Churchs/?lat=${latitude}&long=${longitude}&pg=1&apikey=${apiKey}`;
      const massRes = await fetch(massUrl, {
        headers: {
          'Referer': 'https://masstimes.org/',
          'Origin': 'https://masstimes.org',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0',
        },
      });
      if (!massRes.ok) {
        return res.status(502).json({ message: "Something went wrong while searching. Please try again." });
      }
      const massData = await massRes.json();
      churches = Array.isArray(massData) ? massData : (Array.isArray((massData as Record<string, unknown>)?.churches) ? (massData as Record<string, unknown[]>).churches : []);
    } catch {
      return res.status(502).json({ message: "Something went wrong while searching. Please try again." });
    }

    function formatMassTime(raw: string): string {
      if (!raw) return "";
      if (raw.startsWith("1/1/1900")) return "";
      const match = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
      if (!match) return raw;
      let hour = parseInt(match[1], 10);
      const min = match[2];
      const ampm = hour >= 12 ? "PM" : "AM";
      if (hour > 12) hour -= 12;
      if (hour === 0) hour = 12;
      return min === "00" ? `${hour} ${ampm}` : `${hour}:${min} ${ampm}`;
    }

    const ADORATION_RE = /adoration|eucharistic|benediction/i;
    const resultsWithAdorationTimes: unknown[] = [];
    const nearbyParishesWithoutListedTimes: unknown[] = [];

    for (const raw of churches) {
      if (!raw || typeof raw !== "object") continue;
      const c = raw as Record<string, unknown>;
      const worshipTimes: unknown[] = Array.isArray(c.church_worship_times) ? c.church_worship_times : [];

      const adorationTimes = worshipTimes
        .filter((wt: unknown) => {
          if (!wt || typeof wt !== "object") return false;
          const t = wt as Record<string, unknown>;
          return ADORATION_RE.test(String(t.service_typename || "")) || ADORATION_RE.test(String(t.comment || ""));
        })
        .map((wt: unknown) => {
          const t = wt as Record<string, unknown>;
          const rawDay = String(t.day_of_week || "").trim();
          const dayOfWeek = rawDay === "99" ? "Perpetual (24/7)" : rawDay;
          const timeStart = formatMassTime(String(t.time_start || ""));
          const timeEnd = formatMassTime(String(t.time_end || ""));
          return {
            dayOfWeek,
            timeStart,
            timeEnd: timeEnd || undefined,
            comment: t.comment ? String(t.comment).trim() : undefined,
          };
        });

      const rawUrl = c.url ? String(c.url).trim() : "";
      const website = rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`) : undefined;

      const parishData = {
        churchId: String(c.id ?? Math.random()),
        name: String(c.name ?? "Unknown Parish"),
        distance: parseFloat(String(c.distance ?? "0")) || 0,
        address: {
          street: c.church_address_street_address ? String(c.church_address_street_address) : undefined,
          city: c.church_address_city_name ? String(c.church_address_city_name) : undefined,
          state: c.church_address_providence_name ? String(c.church_address_providence_name) : undefined,
          postalCode: c.church_address_postal_code ? String(c.church_address_postal_code) : undefined,
        },
        phone: c.phone_number ? String(c.phone_number).trim() : undefined,
        website,
        adorationTimes,
        source: "MassTimes",
      };

      if (adorationTimes.length > 0) {
        resultsWithAdorationTimes.push(parishData);
      } else {
        nearbyParishesWithoutListedTimes.push(parishData);
      }
    }

    res.json({ searchLocation: { zipCode, latitude, longitude }, resultsWithAdorationTimes, nearbyParishesWithoutListedTimes });
  });

  // === Testimonies (Participant) ===

  function testimonyUnlockHint(unlockKey: string): string {
    if (unlockKey === "prelim") return "Complete Preliminary Modules";
    const weekFirstMatch = unlockKey.match(/^week-(\d+)-first$/);
    if (weekFirstMatch) return `Complete Week ${weekFirstMatch[1]} first lesson`;
    const weekLastMatch = unlockKey.match(/^week-(\d+)-last$/);
    if (weekLastMatch) return `Complete Week ${weekLastMatch[1]}`;
    return "Complete more lessons";
  }

  app.get('/api/testimonies', requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const [allTestimonies, unlockedKeys] = await Promise.all([
        storage.getTestimonies(),
        storage.getUnlockedKeysForUser(userId),
      ]);

      const result = await Promise.all(allTestimonies.map(async (testimony) => {
        const parts = await storage.getTestimonyParts(testimony.id);
        const partsWithStatus = parts.map(part => {
          const unlocked = unlockedKeys.has(part.unlockKey);
          const { videoUrl, unlockKey, ...rest } = part;
          return {
            ...rest,
            lockHint: testimonyUnlockHint(unlockKey),
            unlocked,
            ...(unlocked ? { videoUrl } : {}),
          };
        });
        const unlockedCount = partsWithStatus.filter(p => p.unlocked).length;
        const fullyUnlocked = parts.length > 0 && unlockedCount === parts.length;
        const { fullVideoUrl, ...testimonyRest } = testimony;
        return {
          ...testimonyRest,
          ...(fullyUnlocked ? { fullVideoUrl } : {}),
          parts: partsWithStatus,
          unlockedCount,
          totalParts: parts.length,
          fullyUnlocked,
        };
      }));

      res.json(result);
    } catch (err) {
      console.error("Error fetching testimonies:", err);
      res.status(500).json({ message: "Failed to fetch testimonies" });
    }
  });

  // === Testimonies Admin CRUD ===

  app.get('/api/admin/testimonies', requireRole('admin'), async (req, res) => {
    try {
      const allTestimonies = await storage.getTestimonies();
      const result = await Promise.all(allTestimonies.map(async (testimony) => {
        const parts = await storage.getTestimonyParts(testimony.id);
        return { ...testimony, parts };
      }));
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch testimonies" });
    }
  });

  app.post('/api/admin/testimonies', requireRole('admin'), async (req, res) => {
    const schema = z.object({
      position: z.number().int().positive(),
      personName: z.string().min(1),
      description: z.string().default(""),
      thumbnailUrl: z.string().default(""),
      fullVideoUrl: z.string().default(""),
    });
    try {
      const data = schema.parse(req.body);
      const testimony = await storage.createTestimony(data);
      res.json(testimony);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to create testimony" });
    }
  });

  app.patch('/api/admin/testimonies/:id', requireRole('admin'), async (req, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const schema = z.object({
      position: z.number().int().positive().optional(),
      personName: z.string().min(1).optional(),
      description: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      fullVideoUrl: z.string().optional(),
    });
    try {
      const data = schema.parse(req.body);
      const testimony = await storage.updateTestimony(id, data);
      res.json(testimony);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update testimony" });
    }
  });

  app.delete('/api/admin/testimonies/:id', requireRole('admin'), async (req, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    try {
      await storage.deleteTestimony(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete testimony" });
    }
  });

  app.get('/api/admin/testimonies/:id/parts', requireRole('admin'), async (req, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    try {
      const parts = await storage.getTestimonyParts(id);
      res.json(parts);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch parts" });
    }
  });

  app.post('/api/admin/testimonies/:id/parts', requireRole('admin'), async (req, res) => {
    const testimonyId = parseInt(req.params.id as string);
    if (isNaN(testimonyId)) return res.status(400).json({ message: "Invalid id" });
    const schema = z.object({
      partNumber: z.number().int().positive(),
      title: z.string().default(""),
      videoUrl: z.string().default(""),
      unlockKey: z.string().min(1),
    });
    try {
      const data = schema.parse(req.body);
      const part = await storage.createTestimonyPart({ ...data, testimonyId });
      res.json(part);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to create part" });
    }
  });

  app.patch('/api/admin/testimonies/:id/parts/:partId', requireRole('admin'), async (req, res) => {
    const partId = parseInt(req.params.partId as string);
    if (isNaN(partId)) return res.status(400).json({ message: "Invalid partId" });
    const schema = z.object({
      partNumber: z.number().int().positive().optional(),
      title: z.string().optional(),
      videoUrl: z.string().optional(),
      unlockKey: z.string().min(1).optional(),
    });
    try {
      const data = schema.parse(req.body);
      const part = await storage.updateTestimonyPart(partId, data);
      res.json(part);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update part" });
    }
  });

  app.delete('/api/admin/testimonies/:id/parts/:partId', requireRole('admin'), async (req, res) => {
    const partId = parseInt(req.params.partId as string);
    if (isNaN(partId)) return res.status(400).json({ message: "Invalid partId" });
    try {
      await storage.deleteTestimonyPart(partId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete part" });
    }
  });

  // === Certificate Generation ===

  app.post('/api/generate-certificate', requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "name is required and must be a non-empty string" });
      }

      const safeName = name.replace(/[^a-zA-Z0-9 ]/g, '');
      if (safeName.trim().length === 0) {
        return res.status(400).json({ message: "name must contain at least one alphanumeric character" });
      }

      const { PDFDocument, rgb } = await import('pdf-lib');
      const fontkit = (await import('@pdf-lib/fontkit')).default;

      const certDir = path.join(process.cwd(), 'server', 'assets', 'certificate');
      const bgBytes = fs.readFileSync(path.join(certDir, 'certificate-bg.png'));
      const fontBytes = fs.readFileSync(path.join(certDir, 'custom-font.otf'));

      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      const bgImage = await pdfDoc.embedPng(bgBytes);
      const { width, height } = bgImage.scale(1);

      const page = pdfDoc.addPage([width, height]);
      page.drawImage(bgImage, { x: 0, y: 0, width, height });

      const font = await pdfDoc.embedFont(fontBytes);

      // Scale font proportionally to the certificate height, then shrink to fit within 60% of width
      const maxFontSize = Math.round(height * 0.052);
      const minFontSize = Math.round(height * 0.025);
      let fontSize = maxFontSize;
      while (fontSize > minFontSize && font.widthOfTextAtSize(safeName, fontSize) > width * 0.60) {
        fontSize -= 1;
      }

      const textWidth = font.widthOfTextAtSize(safeName, fontSize);
      const x = (width - textWidth) / 2;
      // Name sits in the blank space — roughly 59% from top = 41% from bottom
      const y = height * 0.41;

      page.drawText(safeName, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(1, 1, 1),
      });

      const pdfBytes = await pdfDoc.save();
      const buffer = Buffer.from(pdfBytes);

      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', `attachment; filename="certificate-${safeName}.pdf"`);
      res.send(buffer);
    } catch (error) {
      console.error("Certificate generation error:", error);
      res.status(500).json({ message: "Failed to generate certificate" });
    }
  });

  // === Healing Track Routes — Participant ===

  // Migration: convert timer slides to scripture_practice
  app.post('/api/admin/migrate-timer-to-scripture-practice', requireRole('admin'), async (req, res) => {
    try {
      const stripHtml = (html: string): string =>
        html
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&ldquo;|&#8220;/g, '\u201c')
          .replace(/&rdquo;|&#8221;/g, '\u201d')
          .replace(/&lsquo;|&#8216;/g, '\u2018')
          .replace(/&rsquo;|&#8217;/g, '\u2019')
          .replace(/&amp;/g, '&')
          .replace(/&hellip;|&#8230;/g, '...')
          .replace(/\s+/g, ' ')
          .trim();

      const splitIntoChunks = (html: string): string[] => {
        const text = stripHtml(html);
        const parts = text.split(/(?<=[,;.!?])\s+/);
        return parts.map(p => p.trim()).filter(p => p.length > 1);
      };

      const convertSlides = (slides: { type: string; content: string }[]): { converted: number; slides: { type: string; content: string }[] } => {
        let converted = 0;
        const newSlides = slides.map(slide => {
          if (slide.type !== 'timer') return slide;
          let parsed: Record<string, unknown> = {};
          try { parsed = JSON.parse(slide.content); } catch {}
          const text = typeof parsed.text === 'string' ? parsed.text : '';
          const chunks = splitIntoChunks(text);
          converted++;
          return {
            type: 'scripture_practice',
            content: JSON.stringify({
              duration: typeof parsed.duration === 'number' ? parsed.duration : 180,
              text,
              ...(typeof parsed.audioUrl === 'string' && parsed.audioUrl ? { audioUrl: parsed.audioUrl } : {}),
              reference: '',
              chunks: chunks.length > 0 ? chunks : [stripHtml(text)],
              reflectionDuration: 120,
              reflectionTitle: 'Stay with this and bring it to God.\nReflect on the thoughts that come up.',
            }),
          };
        });
        return { converted, slides: newSlides };
      };

      let totalConverted = 0;
      const log: string[] = [];

      // Migrate track_a_content
      const trackARows = await db.select().from(trackAContent);
      for (const row of trackARows) {
        const slides = (row.slides ?? []) as { type: string; content: string }[];
        const { converted, slides: newSlides } = convertSlides(slides);
        if (converted > 0) {
          await db.update(trackAContent).set({ slides: newSlides }).where(eq(trackAContent.id, row.id));
          log.push(`track_a_content day ${row.dayNumber}: converted ${converted} timer slide(s)`);
          totalConverted += converted;
        }
      }

      // Migrate prelim_modules
      const prelimRows = await db.select().from(prelimModules);
      for (const row of prelimRows) {
        const slides = (row.slides ?? []) as { type: string; content: string }[];
        const { converted, slides: newSlides } = convertSlides(slides);
        if (converted > 0) {
          await db.update(prelimModules).set({ slides: newSlides }).where(eq(prelimModules.id, row.id));
          log.push(`prelim_modules position ${row.position}: converted ${converted} timer slide(s)`);
          totalConverted += converted;
        }
      }

      res.json({ success: true, totalConverted, log });
    } catch (err: unknown) {
      console.error('Migration error:', err);
      res.status(500).json({ error: String(err) });
    }
  });

  // POST /api/admin/bulk-update-timer-durations — set duration and/or reflectionDuration on ALL scripture_practice slides
  app.post('/api/admin/bulk-update-timer-durations', requireRole('admin'), async (req, res) => {
    try {
      const { duration, reflectionDuration } = req.body as { duration?: number; reflectionDuration?: number };
      if (duration === undefined && reflectionDuration === undefined) {
        return res.status(400).json({ error: 'Provide at least one of: duration, reflectionDuration' });
      }

      let totalUpdated = 0;
      const log: string[] = [];

      const patchSlides = (slides: { type: string; content: string }[]): { updated: number; slides: { type: string; content: string }[] } => {
        let updated = 0;
        const newSlides = slides.map(slide => {
          if (slide.type !== 'scripture_practice' && slide.type !== 'timer') return slide;
          let parsed: Record<string, unknown> = {};
          try { parsed = JSON.parse(slide.content); } catch {}
          if (duration !== undefined) parsed.duration = duration;
          if (reflectionDuration !== undefined) parsed.reflectionDuration = reflectionDuration;
          updated++;
          return { ...slide, content: JSON.stringify(parsed) };
        });
        return { updated, slides: newSlides };
      };

      const trackARows = await db.select().from(trackAContent);
      for (const row of trackARows) {
        const slides = (row.slides ?? []) as { type: string; content: string }[];
        const { updated, slides: newSlides } = patchSlides(slides);
        if (updated > 0) {
          await db.update(trackAContent).set({ slides: newSlides }).where(eq(trackAContent.id, row.id));
          log.push(`Day ${row.dayNumber}: updated ${updated} slide(s)`);
          totalUpdated += updated;
        }
      }

      const prelimRows = await db.select().from(prelimModules);
      for (const row of prelimRows) {
        const slides = (row.slides ?? []) as { type: string; content: string }[];
        const { updated, slides: newSlides } = patchSlides(slides);
        if (updated > 0) {
          await db.update(prelimModules).set({ slides: newSlides }).where(eq(prelimModules.id, row.id));
          log.push(`Prelim module ${row.position}: updated ${updated} slide(s)`);
          totalUpdated += updated;
        }
      }

      res.json({ success: true, totalUpdated, log });
    } catch (err: unknown) {
      console.error('Bulk timer update error:', err);
      res.status(500).json({ error: String(err) });
    }
  });

  // === Workbook Modules ===

  // GET /api/workbook-modules — all modules with completion + unlock status for the current user
  app.get('/api/workbook-modules', requireAuth, async (req, res) => {
    // Exempt participants skip the lesson workbook entirely — return an empty list
    if ((req.user! as any).workbookExempt) {
      return res.json([]);
    }
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'superuser';
    const [modules, completions] = await Promise.all([
      storage.getAllLessonWorkbookModules(),
      storage.getLessonWorkbookCompletionsByUser(req.user!.id),
    ]);
    const completedIds = new Set(completions.map(c => c.workbookModuleId));
    const morningCompletions = await storage.getUserPrayerCompletions(req.user!.id);
    const morningDays = new Set(
      morningCompletions.filter(c => c.period === 'morning').map(c => c.dayNumber)
    );
    const result = modules.map(m => {
      const completed = completedIds.has(m.id);
      const unlocked = morningDays.has(m.dayNumber);
      const accessible = isAdmin || completed || unlocked;
      return {
        id: m.id,
        dayNumber: m.dayNumber,
        title: m.title,
        completed,
        unlocked,
        // Only expose slides & completionMessage when the module is accessible
        ...(accessible ? { slides: m.slides, completionMessage: m.completionMessage } : {}),
      };
    });
    res.json(result);
  });

  // GET /api/workbook-modules/:id — full module with slides (gated by unlock)
  app.get('/api/workbook-modules/:id', requireAuth, async (req, res) => {
    if ((req.user! as any).workbookExempt) {
      return res.status(403).json({ error: 'Workbook is not required for your program path' });
    }
    const id = Number(req.params.id);
    if (isNaN(id)) return res.sendStatus(400);
    const mod = await storage.getLessonWorkbookModule(id);
    if (!mod) return res.sendStatus(404);
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'superuser';
    if (!isAdmin) {
      const [completions, morningCompletions] = await Promise.all([
        storage.getLessonWorkbookCompletionsByUser(req.user!.id),
        storage.getUserPrayerCompletions(req.user!.id),
      ]);
      const alreadyCompleted = completions.some(c => c.workbookModuleId === id);
      const morningDone = morningCompletions.some(c => c.period === 'morning' && c.dayNumber === mod.dayNumber);
      if (!alreadyCompleted && !morningDone) {
        return res.status(403).json({ error: 'Complete parent day morning prayer to unlock this workbook' });
      }
    }
    res.json(mod);
  });

  // GET /api/workbook-completions — current user's workbook completions
  app.get('/api/workbook-completions', requireAuth, async (req, res) => {
    const completions = await storage.getLessonWorkbookCompletionsByUser(req.user!.id);
    res.json(completions);
  });

  // POST /api/workbook-completions/:id — mark a workbook module complete
  app.post('/api/workbook-completions/:id', requireAuth, writeLimiter, async (req, res) => {
    if ((req.user! as any).workbookExempt) {
      return res.status(403).json({ error: 'Workbook is not required for your program path' });
    }
    const id = Number(req.params.id);
    if (isNaN(id)) return res.sendStatus(400);
    const mod = await storage.getLessonWorkbookModule(id);
    if (!mod) return res.sendStatus(404);
    const morningCompletions = await storage.getUserPrayerCompletions(req.user!.id);
    const morningDone = morningCompletions.some(c => c.period === 'morning' && c.dayNumber === mod.dayNumber);
    if (!morningDone && req.user!.role !== 'admin' && req.user!.role !== 'superuser') {
      return res.status(403).json({ error: 'Parent day morning prayer must be completed first' });
    }
    const completion = await storage.completeLessonWorkbookModule(req.user!.id, id);
    res.json(completion);
  });

  // GET /api/admin/workbook-modules — admin: list all modules
  app.get('/api/admin/workbook-modules', requireRole('admin'), async (req, res) => {
    const modules = await storage.getAllLessonWorkbookModules();
    res.json(modules);
  });

  // POST /api/admin/workbook-modules — admin: create a new module
  app.post('/api/admin/workbook-modules', requireRole('admin'), async (req, res) => {
    const { dayNumber, title, slides, completionMessage } = req.body;
    if (!dayNumber || !title) return res.status(400).json({ error: 'dayNumber and title required' });
    const mod = await storage.upsertLessonWorkbookModule({ dayNumber, title, slides: slides ?? [], completionMessage: completionMessage ?? null });
    res.status(201).json(mod);
  });

  // PATCH /api/admin/workbook-modules/:id — admin: update a module's title/slides
  app.patch('/api/admin/workbook-modules/:id', requireRole('admin'), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.sendStatus(400);
    const existing = await storage.getLessonWorkbookModule(id);
    if (!existing) return res.sendStatus(404);
    const { title, slides, completionMessage } = req.body;
    const mod = await storage.upsertLessonWorkbookModule({
      dayNumber: existing.dayNumber,
      title: title ?? existing.title,
      slides: slides ?? existing.slides ?? [],
      completionMessage: completionMessage !== undefined ? completionMessage : existing.completionMessage,
    });
    res.json(mod);
  });

  // DELETE /api/admin/workbook-modules/:id — admin: delete a module
  app.delete('/api/admin/workbook-modules/:id', requireRole('admin'), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.sendStatus(400);
    await storage.deleteLessonWorkbookModule(id);
    res.json({ success: true });
  });

  // PUT /api/admin/workbook-modules — admin: upsert a module by dayNumber (used by admin panel)
  app.put('/api/admin/workbook-modules', requireRole('admin'), async (req, res) => {
    const { dayNumber, title, slides, completionMessage } = req.body;
    if (!dayNumber || !title) return res.status(400).json({ error: 'dayNumber and title required' });
    const mod = await storage.upsertLessonWorkbookModule({ dayNumber, title, slides: slides ?? [], completionMessage: completionMessage ?? null });
    res.json(mod);
  });

  // === Deliverance Workbook ===

  // GET /api/workbook/summary — aggregated section counts + attestations
  app.get("/api/workbook/summary", requireAuth, async (req, res) => {
    if ((req.user! as any).workbookExempt) return res.json({});
    const summary = await storage.getWorkbookSummary(req.user!.id);
    res.json(summary);
  });

  // Trigger-day → category mapping for progressive unlock
  const WORKBOOK_TRIGGER_DAY_CATEGORY: Record<number, number> = {
    7: 1,  // Personal Sins
    9: 2,  // Occult & Dark Powers
    11: 3, // Generational Lines
    12: 4, // Inner Vows
    15: 5, // Wounds & Forgiveness
  };

  // Section-to-category mapping (mirrors client section-definitions.ts after swap)

  // GET /api/workbook/unlock-status — which categories the current user has unlocked
  app.get("/api/workbook/unlock-status", requireAuth, async (req, res) => {
    const user = req.user!;
    if (user.role === 'admin' || user.role === 'superuser') {
      return res.json({ unlockedCategories: [1, 2, 3, 4, 5] });
    }
    if ((user as any).workbookExempt) {
      return res.json({ unlockedCategories: [], exempt: true });
    }
    if (user.track !== 'A') {
      return res.json({ unlockedCategories: [] });
    }
    // Primary signal: morning prayer completion on the trigger day.
    // Fallback signal: user already has workbook entries or attestations in that
    // category's sections (data survives even if prayer completion records are lost).
    const [completions, workbookSummary] = await Promise.all([
      storage.getUserPrayerCompletions(user.id),
      storage.getWorkbookSummary(user.id),
    ]);
    const completedDays = new Set(
      completions.filter(c => c.period === 'morning').map(c => c.dayNumber)
    );
    const sectionsWithData = new Set(
      Object.entries(workbookSummary)
        .filter(([, v]) => v.count > 0 || v.attested)
        .map(([sId]) => Number(sId))
    );

    const unlockedCategories: number[] = [];
    for (const [dayStr, catId] of Object.entries(WORKBOOK_TRIGGER_DAY_CATEGORY)) {
      const hasPrayer = completedDays.has(Number(dayStr));
      const hasWorkbookData = (WORKBOOK_CATEGORY_SECTIONS[catId] ?? []).some(
        (sId: number) => sectionsWithData.has(sId)
      );
      if (hasPrayer || hasWorkbookData) {
        unlockedCategories.push(catId);
      }
    }
    return res.json({ unlockedCategories });
  });

  // GET /api/workbook/week4-ready — whether all 5 workbook categories have ≥1 entry or attestation
  app.get("/api/workbook/week4-ready", requireAuth, async (req, res) => {
    const user = req.user!;
    if (user.role === 'admin' || user.role === 'superuser') {
      return res.json({ ready: true });
    }
    if ((user as any).workbookExempt) {
      return res.json({ ready: true });
    }
    if (user.track !== 'A') {
      return res.json({ ready: false });
    }
    const summary = await storage.getWorkbookSummary(user.id);
    const allCategoriesReady = Object.values(WORKBOOK_CATEGORY_SECTIONS).every((sectionIds) =>
      sectionIds.some(id => {
        const sec = summary[id];
        return sec && (sec.count > 0 || sec.attested);
      })
    );
    return res.json({ ready: allCategoriesReady });
  });

  // GET /api/workbook/:sectionId — entries for one section
  app.get("/api/workbook/:sectionId", requireAuth, async (req, res) => {
    if ((req.user! as any).workbookExempt) return res.json([]);
    const sectionId = Number(req.params.sectionId);
    if (isNaN(sectionId) || sectionId < 1 || sectionId > WORKBOOK_MAX_SECTION_ID) return res.sendStatus(400);
    const entries = await storage.getWorkbookEntries(req.user!.id, sectionId);
    res.json(entries);
  });

  // POST /api/workbook/:sectionId — create or update an entry
  app.post("/api/workbook/:sectionId", requireAuth, writeLimiter, async (req, res) => {
    if ((req.user! as any).workbookExempt) {
      return res.status(403).json({ error: 'Workbook is not required for your program path' });
    }
    const sectionId = Number(req.params.sectionId);
    if (isNaN(sectionId) || sectionId < 1 || sectionId > WORKBOOK_MAX_SECTION_ID) return res.sendStatus(400);

    const schema = z.object({
      id: z.number().optional(),
      entryData: z.record(z.string(), z.unknown()),
      position: z.number().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    let { id, entryData, position } = parsed.data;

    // Section 17: upsert by junior_spirit_ref — find existing entry for this spirit
    if (sectionId === 17 && !id) {
      const ref = typeof entryData.junior_spirit_ref === "string" ? entryData.junior_spirit_ref : null;
      if (ref) {
        const existing = await storage.getWorkbookEntries(req.user!.id, 17);
        const match = existing.find((e) => {
          const d = e.entryData as Record<string, unknown>;
          return d.junior_spirit_ref === ref;
        });
        if (match) id = match.id;
      }
    }

    const entry = await storage.upsertWorkbookEntry(req.user!.id, sectionId, entryData as Record<string, unknown>, position ?? 0, id);
    res.json(entry);
  });

  // DELETE /api/workbook/entry/:id — delete an entry (verifies ownership)
  app.delete("/api/workbook/entry/:id", requireAuth, async (req, res) => {
    if ((req.user! as any).workbookExempt) {
      return res.status(403).json({ error: 'Workbook is not required for your program path' });
    }
    const id = Number(req.params.id);
    if (isNaN(id)) return res.sendStatus(400);
    await storage.deleteWorkbookEntry(id, req.user!.id);
    res.sendStatus(204);
  });

  // POST /api/workbook/attest/:sectionId — set attestation
  app.post("/api/workbook/attest/:sectionId", requireAuth, async (req, res) => {
    if ((req.user! as any).workbookExempt) {
      return res.status(403).json({ error: 'Workbook is not required for your program path' });
    }
    const sectionId = Number(req.params.sectionId);
    if (isNaN(sectionId) || sectionId < 1 || sectionId > WORKBOOK_MAX_SECTION_ID) return res.sendStatus(400);
    await storage.setWorkbookAttestation(req.user!.id, sectionId);
    res.sendStatus(204);
  });

  // DELETE /api/workbook/attest/:sectionId — clear attestation
  app.delete("/api/workbook/attest/:sectionId", requireAuth, async (req, res) => {
    if ((req.user! as any).workbookExempt) {
      return res.status(403).json({ error: 'Workbook is not required for your program path' });
    }
    const sectionId = Number(req.params.sectionId);
    if (isNaN(sectionId) || sectionId < 1 || sectionId > WORKBOOK_MAX_SECTION_ID) return res.sendStatus(400);
    await storage.clearWorkbookAttestation(req.user!.id, sectionId);
    res.sendStatus(204);
  });

  // === User Profile ===

  // GET /api/user-profile — returns current user's profile, or empty defaults if not yet created
  app.get("/api/user-profile", requireAuth, async (req, res) => {
    const profile = await storage.getUserProfile(req.user!.id);
    if (!profile) {
      return res.json({
        id: null,
        userId: req.user!.id,
        familyMembers: [],
        spouseName: "",
        childrenNames: [],
        chronicIssues: [],
        chronicIdentityLabels: [],
        updatedAt: null,
        faithTradition: null,
        workbookIntroAcknowledged: false,
      });
    }
    res.json(profile);
  });

  // PUT /api/user-profile — upserts the current user's profile
  app.put("/api/user-profile", requireAuth, writeLimiter, async (req, res) => {
    const schema = z.object({
      familyMembers: z.array(z.string().max(200)).max(100),
      spouseName: z.string().max(300),
      childrenNames: z.array(z.string().max(200)).max(50),
      chronicIssues: z.array(z.string().max(500)).max(100),
      chronicIdentityLabels: z.array(z.string().max(300)).max(100),
      bio: z.string().max(2000).optional().nullable(),
      faithTradition: z.enum(["Yes", "No, I'm a Christian of another tradition", "No, I'm exploring faith"]).nullable().optional(),
      workbookIntroAcknowledged: z.boolean().optional(),
    }).partial();
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const profile = await storage.upsertUserProfile(req.user!.id, parsed.data);
    res.json(profile);
  });

  // PATCH /api/user/name — lets the current user update their own display name
  app.patch("/api/user/name", requireAuth, writeLimiter, async (req, res) => {
    const schema = z.object({ name: z.string().min(1).max(200).trim() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const updated = await storage.updateUser(req.user!.id, { name: parsed.data.name });
    res.json(sanitizeUser(updated));
  });

  // GET /api/mentor/activity-summary — returns last-active date + unread count per mentee for the current mentor
  app.get("/api/mentor/activity-summary", requireRole("mentor", "admin"), async (req, res) => {
    const summary = await storage.getMenteeActivitySummary(req.user!.id);
    res.json(summary);
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

async function seed() {
    await db.insert(tracks).values({ id: "A", name: "Track A", status: "published" }).onConflictDoNothing();
    await migrateFilesystemImages();

    // NOTE: do NOT delete prelim modules — admin can create up to 3 (or more)

    // Seed users if needed
    const users = await storage.getAllUsers();
    if (users.length === 0) {
        if (process.env.NODE_ENV !== "production") {
            // Development-only: seed demo accounts with known credentials
            console.log("Seeding demo users (development only)...");
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
                startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            });
        } else {
            // Production: create admin only from explicit environment variables
            const adminEmail = process.env.ADMIN_EMAIL;
            const adminPassword = process.env.ADMIN_PASSWORD;
            if (adminEmail && adminPassword) {
                console.log("Creating initial admin account from environment variables...");
                const adminHash = await hashPassword(adminPassword);
                await storage.createUser({
                    name: "Admin",
                    email: adminEmail.toLowerCase().trim(),
                    password: adminHash,
                    role: "admin",
                    startDate: new Date(),
                });
            } else {
                console.error(
                    "SECURITY WARNING: Production deployment has no users and ADMIN_EMAIL/ADMIN_PASSWORD " +
                    "environment variables are not set. The application is running without an administrator " +
                    "account. Set ADMIN_EMAIL and ADMIN_PASSWORD before restarting to create the initial admin."
                );
            }
        }
    }

    // If ADMIN_EMAIL + ADMIN_PASSWORD are set, always sync the admin password on startup.
    // This lets you recover access by setting these env vars and redeploying.
    {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (adminEmail && adminPassword) {
            const existing = await storage.getUserByUsername(adminEmail.toLowerCase().trim());
            if (existing && existing.role === "admin") {
                const newHash = await hashPassword(adminPassword);
                await storage.updateUser(existing.id, { password: newHash });
                console.log(`Admin password synced from environment variable for ${adminEmail}.`);
            }
        }
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

    // Shared resource IDs must survive restarts. Seed only a fresh database.
    if ((await storage.getAllPracticeResources()).length === 0) {

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
            {
                name: "Forgiveness Prayer for Adults",
                type: "prayer" as const,
                order: 7,
                subtitle: "Releasing others through grace",
                content: `**Forgiveness Prayer for Adults**

This prayer guides you through the sacred act of releasing those who have hurt you, drawing on the grace of Christ to free your heart from the burden of resentment and anger.

[View & Download the Full Prayer (PDF)](https://uploads.weconnect.com/mce/f333160e6b20ba37686da89bbe5fab728a7d3d24/Forgiveness%20Prayer%20for%20Adults.pdf)

---

**Why Forgiveness Matters**

Forgiveness is not condoning what was done. It is the decision to release another person from the debt we feel they owe us — and in doing so, to free ourselves. As Christ forgave from the Cross, He invites us to follow Him into this profound act of mercy.

**Before You Begin**

Find a quiet place. Take a few slow breaths. Ask the Holy Spirit to be present and to guide your heart through each name and each wound.

**The Prayer**

Heavenly Father, I come before You in the name of Jesus. I acknowledge that I have been hurt by *(name the person or persons)*, and I have carried this wound in my heart.

Lord, I choose now, by an act of my will, to forgive *(name)* for *(name the offense)*. I release them from any judgment I have held against them. I cancel the debt I believe they owe me.

I ask You, Lord, to heal the wound this has caused in me. Take from me any anger, bitterness, or resentment that remains. Fill those places with Your peace and Your love.

I bless *(name)* in the name of Jesus, and I place them into Your hands.

In Jesus' name, Amen.

---

*For the complete guided version of this prayer, open the PDF above.*`,
            },
        ];

        for (const resource of canonicalResources) {
            await storage.createPracticeResource(resource);
        }
        console.log(`Practice resources reset: ${canonicalResources.length} resources loaded.`);
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
            centralTheme: "Goal of 30 Days",
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

    // Canonical default testimony parts map (position → parts with correct unlock keys per spec)
    // Person 1: prelim + week-1-last
    // Person 2: week-2-first + week-2-last
    // Person 3: week-3-first + week-3-last
    // Person 4: week-4-first + week-4-last
    // Person 5: week-5-first + week-5-last
    const canonicalPartsMap: Record<number, Array<{ partNumber: number; title: string; unlockKey: string }>> = {
      1: [
        { partNumber: 1, title: "Before the Program", unlockKey: "prelim" },
        { partNumber: 2, title: "After Week 1", unlockKey: "week-1-last" },
      ],
      2: [
        { partNumber: 1, title: "Beginning Week 2", unlockKey: "week-2-first" },
        { partNumber: 2, title: "Completing Week 2", unlockKey: "week-2-last" },
      ],
      3: [
        { partNumber: 1, title: "Beginning Week 3", unlockKey: "week-3-first" },
        { partNumber: 2, title: "Completing Week 3", unlockKey: "week-3-last" },
      ],
      4: [
        { partNumber: 1, title: "Beginning Week 4", unlockKey: "week-4-first" },
        { partNumber: 2, title: "Completing Week 4", unlockKey: "week-4-last" },
      ],
      5: [
        { partNumber: 1, title: "Beginning Week 5", unlockKey: "week-5-first" },
        { partNumber: 2, title: "Completing Week 5", unlockKey: "week-5-last" },
      ],
    };

    const defaultTestimonies = [
      { position: 1, personName: "Person 1", description: "A story of healing and hope through the preliminary formation.", thumbnailUrl: "", fullVideoUrl: "" },
      { position: 2, personName: "Person 2", description: "Encountering God's mercy through Week 2 of the program.", thumbnailUrl: "", fullVideoUrl: "" },
      { position: 3, personName: "Person 3", description: "Finding freedom through Week 3 of the journey.", thumbnailUrl: "", fullVideoUrl: "" },
      { position: 4, personName: "Person 4", description: "Transformation through surrender in Week 4.", thumbnailUrl: "", fullVideoUrl: "" },
      { position: 5, personName: "Person 5", description: "Walking in renewed life through Week 5.", thumbnailUrl: "", fullVideoUrl: "" },
    ];

    for (const t of defaultTestimonies) {
      let [record] = await db.select().from(testimonies).where(eq(testimonies.position, t.position));
      if (!record) {
        [record] = await db.insert(testimonies).values(t).returning();
      }

      // Seed default parts only if they don't already exist — never overwrite admin edits
      const canonical = canonicalPartsMap[t.position] ?? [];
      const existingParts = await db.select().from(testimonyParts).where(eq(testimonyParts.testimonyId, record.id));

      for (const cp of canonical) {
        const match = existingParts.find(p => p.partNumber === cp.partNumber);
        if (!match) {
          // Only insert if the part doesn't exist yet — never overwrite admin edits
          await db.insert(testimonyParts).values({
            testimonyId: record.id,
            partNumber: cp.partNumber,
            title: cp.title,
            videoUrl: "",
            unlockKey: cp.unlockKey,
          });
        }
      }
    }
    console.log("Testimonies seeded/corrected.");

    // One-time migration: remove action/knowledge_check/scenario slides from Track A
    await db.execute(sql`
      UPDATE track_a_content
      SET slides = (
        SELECT COALESCE(json_agg(slide ORDER BY idx), '[]'::json)
        FROM json_array_elements(slides) WITH ORDINALITY AS t(slide, idx)
        WHERE slide->>'type' NOT IN ('action', 'knowledge_check', 'scenario')
      )
      WHERE track_id = 'A' AND slides IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM json_array_elements(slides) s
          WHERE s->>'type' IN ('action', 'knowledge_check', 'scenario')
        )
    `);

    console.log("Seeding complete.");

    // Startup migration: if no cohort records exist but cohort_start_date is set,
    // create an "Initial Cohort" and assign all existing users to it
    const existingCohorts = await storage.listCohorts();
    if (existingCohorts.length === 0) {
      const startDate = await storage.getCohortSetting("cohort_start_date");
      if (startDate) {
        const initialCohort = await storage.createCohort("Initial Cohort", new Date(startDate));
        await db.update(usersTable)
          .set({ cohortId: initialCohort.id })
          .where(sql`${usersTable.role} IN ('participant', 'mentor')`);
        console.log(`Created Initial Cohort (id=${initialCohort.id}) and assigned participants/mentors to it.`);
      }
    }
}
