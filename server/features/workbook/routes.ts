import type { Express } from "express";
import type { RouteDependencies } from "../shared";
import { z } from "zod";
import { storage } from "../../storage";
import { WORKBOOK_CATEGORY_SECTIONS, isActiveWorkbookSection } from "@shared/workbook-categories";
import { WORKBOOK_MAX_SECTION_ID } from "@shared/schema";

export function registerWorkbookModuleRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireAuth" | "requireRole" | "writeLimiter">) {
  const { requireAuth, requireRole, writeLimiter } = dependencies;

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

}

export function registerWorkbookEntryRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireAuth" | "writeLimiter">) {
  const { requireAuth, writeLimiter } = dependencies;

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
    if (!isActiveWorkbookSection(sectionId)) return res.status(410).json({ error: "This workbook section has been retired." });
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
    if (!isActiveWorkbookSection(sectionId)) return res.status(410).json({ error: "This workbook section has been retired." });
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
    if (!isActiveWorkbookSection(sectionId)) return res.status(410).json({ error: "This workbook section has been retired." });
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
    if (!isActiveWorkbookSection(sectionId)) return res.status(410).json({ error: "This workbook section has been retired." });
    if (isNaN(sectionId) || sectionId < 1 || sectionId > WORKBOOK_MAX_SECTION_ID) return res.sendStatus(400);
    await storage.clearWorkbookAttestation(req.user!.id, sectionId);
    res.sendStatus(204);
  });

}
