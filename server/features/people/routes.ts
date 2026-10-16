import type { Express } from "express";
import type { RouteDependencies } from "../shared";
import { api } from "@shared/routes";
import { z } from "zod";
import { storage } from "../../storage";
import { currentTrackId } from "../../track-context";

export function registerPeopleRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireAuth" | "requireRole" | "sanitizeUser" | "sanitizeUsers" | "hashPassword" | "validateTrackAssignment">) {
  const { requireAuth, requireRole, sanitizeUser, sanitizeUsers, hashPassword, validateTrackAssignment } = dependencies;

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

}

export function registerPeopleDeletionRoutes(app: Express) {
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

}

export function registerPeopleDetailsRoutes(app: Express, dependencies: Pick<RouteDependencies, "computeCurrentProgramDay">) {
  const { computeCurrentProgramDay } = dependencies;

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

}

export function registerMentorActivityRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireRole">) {
  const { requireRole } = dependencies;

  // GET /api/mentor/activity-summary — returns last-active date + unread count per mentee for the current mentor
  app.get("/api/mentor/activity-summary", requireRole("mentor", "admin"), async (req, res) => {
    const summary = await storage.getMenteeActivitySummary(req.user!.id);
    res.json(summary);
  });

}
