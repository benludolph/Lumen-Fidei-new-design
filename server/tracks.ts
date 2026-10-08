import type { Express, Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { tracks, users, trackASnapshots, trackAContent, trackAModules, prelimModules, cohortSettings } from "@shared/schema";
import { withTrack } from "./track-context";

export async function validateTrackAssignment(track: string | null | undefined, variantId?: number | null) {
  if (!track) {
    if (variantId) throw new Error("A content variant requires a track assignment.");
    return;
  }
  const [record] = await db.select().from(tracks).where(eq(tracks.id, track));
  if (!record || record.status !== "published") throw new Error("Assign a published track.");
  if (track !== "A" && (await trackReadiness(track)).length) throw new Error("This track needs valid content and configuration before assignment.");
  if (variantId) {
    const [variant] = await db.select().from(trackASnapshots).where(and(
      eq(trackASnapshots.id, variantId), eq(trackASnapshots.trackId, track),
      eq(trackASnapshots.isPublishedVariant, true),
    ));
    if (!variant) throw new Error("Choose a published variant belonging to this track.");
  }
}

export async function trackReadiness(id: string): Promise<string[]> {
  const [modules, lessons, prelims, settings] = await Promise.all([
    db.select().from(trackAModules).where(eq(trackAModules.trackId, id)),
    db.select().from(trackAContent).where(eq(trackAContent.trackId, id)),
    db.select().from(prelimModules).where(eq(prelimModules.trackId, id)),
    db.select().from(cohortSettings).where(eq(cohortSettings.trackId, id)),
  ]);
  const errors: string[] = [];
  if (!modules.length) errors.push("Add at least one module.");
  if (!lessons.some(l => l.dayNumber > 0)) errors.push("Add at least one lesson.");
  const weeks = new Set(modules.map(m => m.weekNumber));
  if (modules.some(m => !m.title.trim())) errors.push("Give each module a title.");
  if (lessons.some(l => !l.centralTheme.trim() || !l.slides?.length)) errors.push("Each lesson needs a title and at least one slide.");
  if (lessons.some(l => l.dayNumber > 0 && !weeks.has(l.weekNumber))) errors.push("Assign every lesson to a module in this track.");
  const days = lessons.filter(l => l.dayNumber > 0).map(l => l.dayNumber).sort((a,b) => a-b);
  if (days.length > 30 || days.some((day, i) => day !== i + 1)) errors.push("Lesson days must be consecutive, beginning at 1, with at most 30 days.");
  if (prelims.some(p => !p.title.trim() || !p.slides?.length)) errors.push("Complete or remove empty preliminary modules.");
  const start = settings.find(s => s.key === "cohort_start_date")?.value;
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !Number.isFinite(Date.parse(start))) errors.push("Set this track's start date in Settings.");
  return errors;
}

export function registerTrackRoutes(app: Express) {
  app.get("/api/tracks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const all = await db.select().from(tracks).orderBy(tracks.createdAt);
    if (req.user!.role === "admin") return res.json(all);
    if (req.user!.role === "mentor") {
      const mentees = await db.select({ track: users.track }).from(users).where(eq(users.mentorId, req.user!.id));
      const allowed = new Set(["A", ...mentees.map(m => m.track)]);
      return res.json(all.filter(t => allowed.has(t.id) && t.status === "published"));
    }
    res.json(all.filter(t => t.id === req.user!.track && t.status === "published"));
  });
  app.post("/api/tracks", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") return res.sendStatus(403);
    const parsed = z.object({ name: z.string().trim().min(1).max(100) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a track name (1–100 characters)." });
    const [track] = await db.insert(tracks).values({ id: randomUUID(), name: parsed.data.name }).returning();
    res.status(201).json(track);
  });
  app.patch("/api/tracks/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") return res.sendStatus(403);
    const id = String(req.params.id);
    const parsed = z.object({ name: z.string().trim().min(1).max(100).optional(), status: z.enum(["draft", "published"]).optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid track settings." });
    const [existing] = await db.select().from(tracks).where(eq(tracks.id, id));
    if (!existing) return res.sendStatus(404);
    if (parsed.data.status === "published") {
      const errors = await trackReadiness(id);
      if (errors.length) return res.status(400).json({ message: errors.join(" "), errors });
    }
    if (parsed.data.status === "draft") {
      const assigned = await db.select({ id: users.id }).from(users).where(eq(users.track, id)).limit(1);
      if (assigned.length) return res.status(409).json({ message: "Reassign participants before making their track unavailable." });
    }
    const [updated] = await db.update(tracks).set(parsed.data).where(eq(tracks.id, id)).returning();
    res.json(updated);
  });
}

// Global account/personal services remain available without a curriculum assignment.
const globalPath = /^\/(?:user(?:s)?(?:\/|$)|login$|logout$|register$|auth\/|messages(?:\/|$)|images\/|(?:profile|user-profile)(?:\/|$)|workbook(?:\/(?:entries|attest|summary|streak))|practice-resources(?:\/|$)|admin\/(?:upload-|mentor\/|users\/))/;

export async function trackScopeMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return next();
  try {
    const user = req.user!;
    let id = user.track || "A";
    if (user.role === "admin" || user.role === "mentor") {
      id = String(req.headers["x-track-id"] || user.track || "A");
      const targetId = Number(req.query.userId || req.path.match(/^\/(?:admin\/users|mentor\/mentees)\/(\d+)/)?.[1]);
      if (targetId) {
        const [target] = await db.select({ track: users.track, mentorId: users.mentorId }).from(users).where(eq(users.id, targetId));
        if (target && (user.role === "admin" || target.mentorId === user.id)) id = target.track || "A";
      }
      if (user.role === "mentor" && id !== "A") {
        const assigned = await db.select({ id: users.id }).from(users).where(and(eq(users.mentorId, user.id), eq(users.track, id))).limit(1);
        if (!assigned.length) return res.status(403).json({ message: "This track is not assigned to your mentees." });
      }
    } else if (req.headers["x-track-id"] && req.headers["x-track-id"] !== id && !globalPath.test(req.path)) {
      return res.status(403).json({ message: "Track access denied." });
    }
    if (!globalPath.test(req.path)) {
      const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
      if (!track || (!user.track && user.role === "participant")) return res.status(403).json({ message: "No track assigned.", code: "NO_TRACK" });
      if (id !== "A" && user.role !== "admin" && (await trackReadiness(id)).length) return res.status(403).json({ message: "This track is temporarily unavailable while its content is updated.", code: "TRACK_INVALID" });
      if (track.status !== "published" && user.role !== "admin") return res.status(403).json({ message: "This track is not available yet.", code: "TRACK_DRAFT" });
    }
    return withTrack(id, () => next());
  } catch (error) { next(error); }
}
