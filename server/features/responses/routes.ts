import type { Express } from "express";
import type { RouteDependencies } from "../shared";
import { api } from "@shared/routes";
import { z } from "zod";
import { storage } from "../../storage";
import { trackDb as db } from "../../track-db";
import { surveyResponses } from "@shared/schema";
import { and, eq } from "drizzle-orm";

export function registerSurveyRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireAuth" | "writeLimiter">) {
  const { requireAuth, writeLimiter } = dependencies;

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

}

export function registerGuidedPrayerResponseRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireAuth" | "writeLimiter" | "requireRole">) {
  const { requireAuth, writeLimiter, requireRole } = dependencies;

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

}

export function registerAdminSurveyRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireRole">) {
  const { requireRole } = dependencies;

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

}

export function registerAnswerRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireRole" | "stripHtml" | "writeLimiter">) {
  const { requireRole, stripHtml, writeLimiter } = dependencies;

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

}
