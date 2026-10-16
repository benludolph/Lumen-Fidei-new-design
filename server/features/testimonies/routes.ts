import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { storage } from "../../storage";

export function registerTestimonyRoutes(
  app: Express,
  requireAuth: RequestHandler,
  requireRole: (...roles: string[]) => RequestHandler,
) {
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
}
