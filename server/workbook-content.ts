import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { workbookEditorialContent } from "../shared/schema";
import { DEFAULT_WORKBOOK_DOCUMENT, workbookDocumentSchema } from "../shared/workbook-content";

/** Global authored content, deliberately independent of participant and track records. */
export async function readWorkbookEditorialContent() {
  await db.insert(workbookEditorialContent).values({
    id: "workbook", draft: DEFAULT_WORKBOOK_DOCUMENT, applied: DEFAULT_WORKBOOK_DOCUMENT,
  }).onConflictDoNothing();
  const [row] = await db.select().from(workbookEditorialContent).where(eq(workbookEditorialContent.id, "workbook"));
  return row;
}
export function registerWorkbookContentRoutes(app: Express, requireAuth: RequestHandler, requireAdmin: RequestHandler, writeLimiter: RequestHandler) {
  app.get("/api/workbook/content", requireAuth, async (_req, res, next) => {
    try {
      const row = await readWorkbookEditorialContent();
      res.set("Cache-Control", "no-store").json({ document: row.applied, revision: row.revision });
    } catch (error) { next(error); }
  });
  app.get("/api/admin/workbook-content", requireAdmin, async (_req, res, next) => {
    try {
      const row = await readWorkbookEditorialContent();
      res.set("Cache-Control", "no-store").json({ draft: row.draft, applied: row.applied, revision: row.revision });
    } catch (error) { next(error); }
  });
  const revisionSchema = z.number().int().nonnegative();
  const saveSchema = z.object({ document: workbookDocumentSchema, revision: revisionSchema }).strict();
  const applySchema = z.object({ revision: revisionSchema }).strict();
  app.post("/api/admin/workbook-content/discard-draft", requireAdmin, writeLimiter, async (req, res, next) => {
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "A valid saved draft revision is required." });
    try {
      const result = await db.transaction(async tx => {
        const [row] = await tx.select().from(workbookEditorialContent).where(eq(workbookEditorialContent.id, "workbook")).for("update");
        if (!row || row.revision !== parsed.data.revision) return null;
        const document = workbookDocumentSchema.parse(row.applied);
        const [saved] = await tx.update(workbookEditorialContent).set({ draft: document, revision: row.revision + 1, updatedAt: new Date() }).where(eq(workbookEditorialContent.id, "workbook")).returning();
        return { draft: saved.draft, applied: saved.applied, revision: saved.revision };
      });
      if (!result) return res.status(409).json({ message: "This workbook was changed in another editor. Reload the latest draft before discarding it." });
      res.json(result);
    } catch (error) { next(error); }
  });
  app.put("/api/admin/workbook-content/draft", requireAdmin, writeLimiter, async (req, res, next) => {
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Workbook content is invalid. Check required fields and protected tokens.", issues: parsed.error.issues.map(issue => ({ path: issue.path, message: issue.message })) });
    try {
      const result = await db.transaction(async tx => {
        const [row] = await tx.select().from(workbookEditorialContent).where(eq(workbookEditorialContent.id, "workbook")).for("update");
        if (!row || row.revision !== parsed.data.revision) return null;
        const [saved] = await tx.update(workbookEditorialContent).set({ draft: parsed.data.document, revision: row.revision + 1, updatedAt: new Date() }).where(eq(workbookEditorialContent.id, "workbook")).returning();
        return { draft: saved.draft, applied: saved.applied, revision: saved.revision };
      });
      if (!result) return res.status(409).json({ message: "This workbook was changed in another editor. Reload the latest draft before saving." });
      res.json(result);
    } catch (error) { next(error); }
  });
  app.post("/api/admin/workbook-content/apply", requireAdmin, writeLimiter, async (req, res, next) => {
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "A valid saved draft revision is required." });
    try {
      const result = await db.transaction(async tx => {
        const [row] = await tx.select().from(workbookEditorialContent).where(eq(workbookEditorialContent.id, "workbook")).for("update");
        if (!row || row.revision !== parsed.data.revision) return null;
        const document = workbookDocumentSchema.parse(row.draft);
        const [saved] = await tx.update(workbookEditorialContent).set({ applied: document, revision: row.revision + 1, updatedAt: new Date() }).where(eq(workbookEditorialContent.id, "workbook")).returning();
        return { draft: saved.draft, applied: saved.applied, revision: saved.revision };
      });
      if (!result) return res.status(409).json({ message: "This workbook was changed in another editor. Reload before applying changes." });
      res.json(result);
    } catch (error) { next(error); }
  });
}
