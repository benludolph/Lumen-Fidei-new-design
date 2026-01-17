import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Authentication
  setupAuth(app);

  // === Users ===
  
  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Only admin or mentors can view list
    if (req.user!.role === 'participant') return res.sendStatus(403);

    const role = req.query.role as "participant" | "mentor" | undefined;
    
    // Mentors only see their own mentees
    if (req.user!.role === 'mentor') {
      const allUsers = await storage.getAllUsers();
      const mentees = allUsers.filter(u => u.mentorId === req.user!.id);
      return res.json(mentees);
    }
    
    // Admin sees all
    if (role) {
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } else {
      const users = await storage.getAllUsers();
      res.json(users);
    }
  });

  app.post(api.users.create.path, async (req, res) => {
    // Only admin can create users usually, but for demo maybe open? 
    // Let's restrict to admin for now, or allow open registration for 'participant'
    // For simplicity, let's allow open registration but force role='participant' if not admin
    
    // Actually, prompt says Admin creates users. So strict check.
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
       // Allow creating the FIRST admin if no users exist? 
       const allUsers = await storage.getAllUsers();
       if (allUsers.length > 0) {
           return res.status(403).json({ message: "Only admins can create users" });
       }
    }

    try {
      const input = api.users.create.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already taken" });
      }
      
      const user = await storage.createUser(input);
      res.status(201).json(user);
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
    
    const updated = await storage.updateUser(userId, input);
    res.json(updated);
  });

  // === Content ===
  
  app.get(api.content.list.path, async (req, res) => {
      // Only admin/mentor might want full list?
      const content = await storage.getAllDailyContent();
      res.json(content);
  });

  app.get(api.content.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const day = Number(req.params.day);
    
    // Time-gating logic
    if (req.user!.role === 'participant') {
      const startDate = new Date(req.user!.startDate || Date.now());
      const now = new Date();
      // Difference in days
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const currentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimum day 1
      
      if (day > currentDay) {
        return res.status(403).json({ message: "This day is locked." });
      }
    }

    const content = await storage.getDailyContent(day);
    if (!content) return res.sendStatus(404);
    
    res.json(content);
  });

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

  app.post(api.answers.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const input = api.answers.create.input.parse(req.body);
    
    const answer = await storage.createUserAnswer({
      ...input,
      userId: req.user!.id
    });
    
    res.status(201).json(answer);
  });

  // === Chat ===

  app.get(api.chat.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const otherUserId = Number(req.params.otherUserId);
    
    // Access control: Participants only with their mentor. Mentors only with their mentees.
    if (req.user!.role === 'participant') {
        if (otherUserId !== req.user!.mentorId) {
            // Allow looking up if they HAVE a mentor? Or just return 403?
            // If they don't have a mentor, they can't chat.
            if (!req.user!.mentorId) return res.status(403).json({message: "No mentor assigned"});
             if (otherUserId !== req.user!.mentorId) return res.sendStatus(403);
        }
    } else if (req.user!.role === 'mentor') {
        const otherUser = await storage.getUser(otherUserId);
        if (otherUser?.mentorId !== req.user!.id) return res.sendStatus(403);
    }
    
    const messages = await storage.getMessages(req.user!.id, otherUserId);
    res.json(messages);
  });

  app.post(api.chat.send.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const input = api.chat.send.input.parse(req.body);
    
    // Same access control as above
    if (req.user!.role === 'participant') {
        if (input.receiverId !== req.user!.mentorId) return res.sendStatus(403);
    } else if (req.user!.role === 'mentor') {
         const receiver = await storage.getUser(input.receiverId);
         if (receiver?.mentorId !== req.user!.id) return res.sendStatus(403);
    }

    const message = await storage.createMessage({
      senderId: req.user!.id,
      receiverId: input.receiverId,
      content: input.content
    });
    
    res.status(201).json(message);
  });
  
  // Seed Data
  await seed();

  return httpServer;
}

async function seed() {
    const existing = await storage.getAllDailyContent();
    if (existing.length > 0) return;
    
    console.log("Seeding daily content...");
    
    // Create Admin if not exists
    const users = await storage.getAllUsers();
    if (users.length === 0) {
        await storage.createUser({
            name: "Admin User",
            email: "admin@example.com",
            password: "admin", // In real app, hash this
            role: "admin",
            startDate: new Date(),
        });
        
        // Create a Mentor
         const mentor = await storage.createUser({
            name: "Mentor Mike",
            email: "mentor@example.com",
            password: "password",
            role: "mentor",
            startDate: new Date(),
        });
        
        // Create a Participant
        await storage.createUser({
            name: "Participant Paul",
            email: "paul@example.com",
            password: "password",
            role: "participant",
            track: "A",
            mentorId: mentor.id,
            startDate: new Date(), // Starts today
        });
    }

    const scriptures = [
        "Genesis 1:1 - In the beginning God created the heavens and the earth.",
        "Psalm 23:1 - The Lord is my shepherd; I shall not want.",
        "John 3:16 - For God so loved the world...",
        "Romans 8:28 - And we know that in all things God works for the good...",
        "Philippians 4:13 - I can do all things through Christ who strengthens me.",
        "Jeremiah 29:11 - For I know the plans I have for you..." // Day 6
    ];
    
    const meditations = [
        "Reflect on the power of creation in your own life.",
        "Consider how God guides you daily.",
        "Meditate on the depth of God's love.",
        "Trust in the greater plan.",
        "Find strength in your faith today.",
        "Write a reflection on your first week."
    ];

    for (let i = 1; i <= 30; i++) {
        const isReflection = i % 6 === 0;
        await storage.createDailyContent({
            dayNumber: i,
            morningScripture: scriptures[(i-1) % scriptures.length],
            morningMeditation: meditations[(i-1) % meditations.length],
            eveningCatechism: `Catechism lesson for Day ${i}.`,
            eveningAssignment: isReflection ? "Weekly Reflection" : `Complete the daily assignment for Day ${i}.`,
            isReflectionDay: isReflection
        });
    }
    console.log("Seeding complete.");
}
