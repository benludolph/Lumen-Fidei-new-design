import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import type { User } from "@shared/schema";
import rateLimit from "express-rate-limit";
import { dailyContentData, practiceResourcesData } from "./content-data";

// Rate limiters for abuse protection
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login/register attempts per 15 minutes
  message: { message: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

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

  // Apply rate limiting to all API routes
  app.use("/api", generalLimiter);
  
  // Apply stricter rate limiting to auth endpoints
  app.use("/api/register", authLimiter);
  app.use("/api/login", authLimiter);

  // === Users ===
  
  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const role = req.query.role as "participant" | "mentor" | undefined;
    const all = req.query.all === "true";
    
    // Participants can only see their own mentor
    if (req.user!.role === 'participant') {
      if (req.user!.mentorId) {
        const mentor = await storage.getUser(req.user!.mentorId);
        if (mentor) {
          return res.json(sanitizeUsers([mentor]));
        }
      }
      return res.json([]);
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

  app.get(api.content.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const day = Number(req.params.day);
    
    // Time-gating logic using cohort-based start date
    if (req.user!.role === 'participant') {
      const cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
      
      let currentDay = 0;
      if (cohortStartDateStr) {
        const startParts = cohortStartDateStr.split('-').map(Number);
        const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        currentDay = Math.min(Math.max(diffDays + 1, 0), 30);
      }
      
      // Only allow access to current day (not past, not future)
      if (day !== currentDay || currentDay === 0) {
        return res.status(403).json({ message: "This day is locked." });
      }
    }

    const content = await storage.getDailyContent(day);
    if (!content) return res.sendStatus(404);
    
    res.json(content);
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

  app.post(api.answers.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const input = api.answers.create.input.parse(req.body);
    
    const answer = await storage.createUserAnswer({
      ...input,
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

  app.post(api.chat.send.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const input = api.chat.send.input.parse(req.body);
    const receiver = await storage.getUser(input.receiverId);
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });
    
    // Access control:
    // - Participants can only message their assigned mentor
    // - Mentors can message their mentees OR admins
    // - Admins can message anyone
    if (req.user!.role === 'participant') {
      if (input.receiverId !== req.user!.mentorId) {
        return res.status(403).json({ message: "You can only message your assigned mentor" });
      }
    } else if (req.user!.role === 'mentor') {
      // Mentors can message their mentees or admins
      const isMentee = receiver.mentorId === req.user!.id;
      const isAdmin = receiver.role === 'admin';
      if (!isMentee && !isAdmin) {
        return res.status(403).json({ message: "You can only message your mentees or admin" });
      }
    }
    // Admin can message anyone - no restrictions

    const message = await storage.createMessage({
      senderId: req.user!.id,
      receiverId: input.receiverId,
      content: input.content
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
    const name = decodeURIComponent(String(req.params.name));
    const resource = await storage.getPracticeResourceByName(name);
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

  app.post(api.prayerCompletions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const input = api.prayerCompletions.create.input.parse(req.body);
    
    // Time-gating: Can only complete current cohort day
    if (req.user!.role === 'participant') {
      const cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
      
      let currentDay = 0;
      if (cohortStartDateStr) {
        const startParts = cohortStartDateStr.split('-').map(Number);
        const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        currentDay = Math.min(Math.max(diffDays + 1, 0), 30);
      }
      
      // Only allow completing current day
      if (input.dayNumber !== currentDay || currentDay === 0) {
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
    
    // Get cohort start date for calculating current day
    const cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate cohort-based current day
    let cohortCurrentDay = 0;
    if (cohortStartDateStr) {
      const startParts = cohortStartDateStr.split('-').map(Number);
      const cohortStartDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const diffTime = todayLocal.getTime() - cohortStartDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      cohortCurrentDay = Math.min(Math.max(diffDays + 1, 0), 30);
    }
    
    const progressData = users
      .filter(u => u.role === 'participant')
      .map(u => {
        // Use cohort-based current day for all users
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
          if (status.morning && status.evening) daysCompleted++;
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
    
    // Calculate current day based on cohort start date
    let currentDay = 0;
    if (startDateStr) {
      // Parse dates as local dates (without time) to avoid timezone issues
      const startParts = startDateStr.split('-').map(Number);
      const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      // Day 1 starts on the start date itself
      currentDay = Math.min(Math.max(diffDays + 1, 0), 30);
    }
    
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
    
    // Get cohort start date for calculating current day
    const cohortStartDate = await storage.getCohortSetting("cohort_start_date");
    let currentDay = 0;
    if (cohortStartDate) {
      const start = new Date(cohortStartDate);
      const today = new Date();
      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      currentDay = Math.max(0, Math.min(diffDays + 1, 30));
    }
    
    // Get prayer completions
    const prayerCompletions = await storage.getUserPrayerCompletions(userId);
    
    // Calculate days completed (unique days with at least one completion)
    const daysCompleted = new Set(prayerCompletions.map(c => c.dayNumber)).size;
    
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
    const agreementText = await storage.getCohortSetting("day0_agreement_text");
    res.json({ introVideoUrl, agreementText });
  });

  app.post(api.admin.day0Settings.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const { introVideoUrl, agreementText } = req.body;
    
    if (introVideoUrl !== undefined) {
      await storage.setCohortSetting("day0_intro_video_url", introVideoUrl);
    }
    if (agreementText !== undefined) {
      await storage.setCohortSetting("day0_agreement_text", agreementText);
    }
    
    res.json({ message: "Day 0 settings updated" });
  });

  // === Day 0 (User) ===
  
  app.get(api.day0.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const introVideoUrl = await storage.getCohortSetting("day0_intro_video_url");
    const agreementText = await storage.getCohortSetting("day0_agreement_text");
    const agreementSigned = !!req.user!.agreementSignedAt;
    
    res.json({ introVideoUrl, agreementText, agreementSigned });
  });

  app.post(api.day0.signAgreement.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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
    
    // Get cohort start date for calculating current day
    const cohortStartDateStr = await storage.getCohortSetting("cohort_start_date");
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let cohortCurrentDay = 0;
    if (cohortStartDateStr) {
      const startParts = cohortStartDateStr.split('-').map(Number);
      const cohortStartDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const diffTime = todayLocal.getTime() - cohortStartDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      cohortCurrentDay = Math.min(Math.max(diffDays + 1, 0), 30);
    }
    
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
          if (status.morning && status.evening) daysCompleted++;
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
  
  // Seed Data
  await seed();

  return httpServer;
}

async function seed() {
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

    // Seed practice resources if needed
    const existingResources = await storage.getAllPracticeResources();
    if (existingResources.length === 0) {
        console.log("Seeding practice resources...");
        
        // Prayer Against Retaliation
        await storage.createPracticeResource({
            name: "Prayer Against Retaliation",
            type: "prayer",
            content: `In the Name of Jesus Christ our Lord and Savior, by the intercession of the Immaculate Virgin Mary, Mother of Jesus, of Blessed Michael the Archangel, of the Blessed Apostles Peter and Paul, and all the Saints, and by the authority residing in my holy ministry, I invoke the blessing of God the Father Almighty, upon all my family members, relatives, friends, and acquaintances.

Lord Jesus, Thou art Almighty and there is none greater. Thou art all powerful, all knowing, and with the authority vested in me, I invoke the sevenfold gifts of the Holy Spirit: wisdom, understanding, counsel, fortitude, knowledge, piety, and fear of the Lord, as a binding and protective Shield for us against all evil that may attempt to retaliate against us, whether physical, emotional, psychological, or spiritual.

Lord, fill us with Your Holy Spirit and protect us from every evil force that may try to cause us harm because of this ministry of liberation. I ask this in Jesus' name. Amen.`,
            order: 1
        });
        
        // Miracle Prayer
        await storage.createPracticeResource({
            name: "Miracle Prayer",
            type: "prayer",
            content: `Lord Jesus, I come before You, just as I am, I am sorry for my sins, I repent of my sins, please forgive me. In Your Name, I forgive all others for what they have done against me. I renounce Satan, the evil spirits and all their works. I give You my entire self, Lord Jesus, I accept You as my Lord, God and Savior. Heal me, change me, strengthen me in body, soul and spirit.

Come Lord Jesus, cover me with Your Precious Blood, and fill me with Your Holy Spirit, I love You Lord Jesus, I praise You Jesus, I thank You Jesus, I shall follow You every day of my life. Amen.

Mary, my mother, Queen of Peace, all the Angels and Saints, please help me. Amen.`,
            order: 2
        });
        
        // Examen - St Ignatius
        await storage.createPracticeResource({
            name: "Examen – St Ignatius",
            type: "practice",
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
            duration: "10-15 minutes",
            order: 3
        });
        
        // Lectio Divina
        await storage.createPracticeResource({
            name: "Lectio Divina – 10 Minutes",
            type: "practice",
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
- Don't rush—allow silence between movements
- Trust that God is present and speaking to you`,
            duration: "10 minutes",
            order: 4
        });
        
        // Silence practice
        await storage.createPracticeResource({
            name: "Silence – 5 Minutes",
            type: "practice",
            content: `The practice of silence is a simple but powerful way to become aware of God's presence and open yourself to His voice. In our noisy world, silence is a gift we offer God.

**How to Practice:**

1. **Prepare** - Sit comfortably in a quiet place. Close your eyes or fix your gaze on a candle, crucifix, or icon.

2. **Breathe** - Take several slow, deep breaths. With each exhale, release any tension, worry, or distraction.

3. **Be Present** - Simply be with God. You don't need to say anything. God knows what's in your heart.

4. **Return Gently** - When thoughts arise (and they will), don't fight them. Acknowledge them and gently return your attention to God's presence.

5. **Close with Gratitude** - When the time is complete, thank God for this time together.

**Remember:** The goal is not to empty your mind, but to fill your heart with awareness of God. Silence creates space for God to work in ways words cannot.`,
            duration: "5 minutes",
            order: 5
        });
        
        // Rosary practice
        await storage.createPracticeResource({
            name: "Rosary – OP + 1 Decade",
            type: "practice",
            content: `The Rosary is a powerful meditation on the life of Christ through the eyes of Mary. "OP + 1 Decade" means the Opening Prayers plus one Decade.

**Opening Prayers (OP):**

1. **Sign of the Cross**
   In the name of the Father, and of the Son, and of the Holy Spirit. Amen.

2. **Apostles' Creed** (on the Crucifix)
   I believe in God, the Father almighty, Creator of heaven and earth...

3. **Our Father** (first large bead)
   Our Father, who art in heaven, hallowed be Thy name...

4. **Three Hail Marys** (three small beads)
   For faith, hope, and charity. Hail Mary, full of grace...

5. **Glory Be**
   Glory be to the Father, and to the Son, and to the Holy Spirit...

**One Decade:**

1. Announce the Mystery (Joyful, Luminous, Sorrowful, or Glorious depending on the day)
2. Pray the Our Father
3. Pray 10 Hail Marys while meditating on the Mystery
4. Pray the Glory Be
5. Optional: Fatima Prayer - "O my Jesus, forgive us our sins..."

**The Mysteries by Day:**
- Monday & Saturday: Joyful Mysteries
- Tuesday & Friday: Sorrowful Mysteries
- Wednesday & Sunday: Glorious Mysteries
- Thursday: Luminous Mysteries`,
            duration: "5-7 minutes",
            order: 6
        });
    }

    // Always upsert daily content from imported data to ensure production has the content
    console.log("Upserting daily content from imported data...");
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
            isReflectionDay: content.isReflectionDay
        });
    }
    
    // Upsert practice resources (prayers and guides) from imported data
    console.log("Upserting practice resources from imported data...");
    for (const resource of practiceResourcesData) {
        await storage.upsertPracticeResource({
            name: resource.name,
            type: resource.type,
            content: resource.content,
            duration: resource.duration,
            order: resource.order
        });
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
    
    console.log("Seeding complete.");
}
