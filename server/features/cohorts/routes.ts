import type { Express } from "express";
import type { RouteDependencies } from "../shared";
import { api } from "@shared/routes";
import { z } from "zod";
import { storage } from "../../storage";

export function registerCohortListRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireRole">) {
  const { requireRole } = dependencies;

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

}

export function registerCohortSettingsRoutes(app: Express, dependencies: Pick<RouteDependencies, "computeCurrentProgramDay" | "effectiveCurrentDay">) {
  const { computeCurrentProgramDay, effectiveCurrentDay } = dependencies;

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

}

export function registerCohortCreationRoutes(app: Express) {
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

}
