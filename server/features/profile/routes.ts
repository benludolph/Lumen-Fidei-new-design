import type { Express } from "express";
import type { RouteDependencies } from "../shared";
import { z } from "zod";
import path from "path";
import { storage } from "../../storage";
import { trackDb as db } from "../../track-db";
import { uploadedImages } from "@shared/schema";

export function registerProfilePhotoRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireRole" | "uploadLimiter" | "upload">) {
  const { requireRole, uploadLimiter, upload } = dependencies;

  // === Mentor Profile Photo Upload ===

  // Mentor uploads their own profile photo
  app.post('/api/mentor/upload-photo', requireRole('mentor', 'admin'), uploadLimiter, upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    try {
      const ext = path.extname(req.file.originalname);
      const base = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `mentor_photo_${req.user!.id}_${Date.now()}${ext}`;
      const base64Data = req.file.buffer.toString("base64");

      await db.insert(uploadedImages).values({
        filename,
        mimeType: req.file.mimetype,
        data: base64Data,
      }).onConflictDoUpdate({
        target: uploadedImages.filename,
        set: { data: base64Data, mimeType: req.file.mimetype },
      });

      const photoUrl = `/api/images/${filename}`;
      await storage.updateUser(req.user!.id, { profilePhotoUrl: photoUrl });

      res.json({ url: photoUrl });
    } catch (error) {
      console.error("Mentor photo upload error:", error);
      res.status(500).json({ message: "Failed to save photo" });
    }
  });

  // Admin sets profile photo for any mentor
  app.post('/api/admin/mentor/:mentorId/upload-photo', requireRole('admin'), uploadLimiter, upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const mentorId = Number(req.params.mentorId);
    const mentor = await storage.getUser(mentorId);
    if (!mentor || (mentor.role !== 'mentor' && mentor.role !== 'admin')) {
      return res.status(404).json({ message: "Mentor not found" });
    }
    try {
      const ext = path.extname(req.file.originalname);
      const base = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `mentor_photo_${mentorId}_${Date.now()}${ext}`;
      const base64Data = req.file.buffer.toString("base64");

      await db.insert(uploadedImages).values({
        filename,
        mimeType: req.file.mimetype,
        data: base64Data,
      }).onConflictDoUpdate({
        target: uploadedImages.filename,
        set: { data: base64Data, mimeType: req.file.mimetype },
      });

      const photoUrl = `/api/images/${filename}`;
      await storage.updateUser(mentorId, { profilePhotoUrl: photoUrl });

      res.json({ url: photoUrl });
    } catch (error) {
      console.error("Admin mentor photo upload error:", error);
      res.status(500).json({ message: "Failed to save photo" });
    }
  });

}

export function registerProfileRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireAuth" | "writeLimiter" | "sanitizeUser">) {
  const { requireAuth, writeLimiter, sanitizeUser } = dependencies;

  // === User Profile ===

  // GET /api/user-profile — returns current user's profile, or empty defaults if not yet created
  app.get("/api/user-profile", requireAuth, async (req, res) => {
    const profile = await storage.getUserProfile(req.user!.id);
    if (!profile) {
      return res.json({
        id: null,
        userId: req.user!.id,
        familyMembers: [],
        spouseName: "",
        childrenNames: [],
        chronicIssues: [],
        chronicIdentityLabels: [],
        updatedAt: null,
        faithTradition: null,
        workbookIntroAcknowledged: false,
      });
    }
    res.json(profile);
  });

  // PUT /api/user-profile — upserts the current user's profile
  app.put("/api/user-profile", requireAuth, writeLimiter, async (req, res) => {
    const schema = z.object({
      familyMembers: z.array(z.string().max(200)).max(100),
      spouseName: z.string().max(300),
      childrenNames: z.array(z.string().max(200)).max(50),
      chronicIssues: z.array(z.string().max(500)).max(100),
      chronicIdentityLabels: z.array(z.string().max(300)).max(100),
      bio: z.string().max(2000).optional().nullable(),
      faithTradition: z.enum(["Yes", "No, I'm a Christian of another tradition", "No, I'm exploring faith"]).nullable().optional(),
      workbookIntroAcknowledged: z.boolean().optional(),
    }).partial();
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const profile = await storage.upsertUserProfile(req.user!.id, parsed.data);
    res.json(profile);
  });

  // PATCH /api/user/name — lets the current user update their own display name
  app.patch("/api/user/name", requireAuth, writeLimiter, async (req, res) => {
    const schema = z.object({ name: z.string().min(1).max(200).trim() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const updated = await storage.updateUser(req.user!.id, { name: parsed.data.name });
    res.json(sanitizeUser(updated));
  });

}
