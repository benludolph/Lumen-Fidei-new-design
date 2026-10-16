import type { Express } from "express";
import { api } from "@shared/routes";
import { storage } from "../../storage";

export function registerResourceRoutes(app: Express) {
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

}
