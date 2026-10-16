import type { Express } from "express";
import type { RouteDependencies } from "../shared";
import { z } from "zod";
import { trackDb as db } from "../../track-db";
import { currentTrackId } from "../../track-context";
import { prelimModules, trackAContent, trackAModules, moduleOverlays, practiceResources, cohortSettings } from "@shared/schema";

export function registerBackupRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireRole">) {
  const { requireRole } = dependencies;

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

}
