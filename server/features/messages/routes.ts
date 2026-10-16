import type { Express } from "express";
import type { RouteDependencies } from "../shared";
import { api } from "@shared/routes";
import { storage } from "../../storage";

export function registerMessageRoutes(app: Express, dependencies: Pick<RouteDependencies, "messageLimiter" | "stripHtml">) {
  const { messageLimiter, stripHtml } = dependencies;

  // === Chat ===

  // Unread message count - must be BEFORE the :otherUserId route
  app.get(api.chat.unreadCount.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const count = await storage.getUnreadMessageCount(req.user!.id);
    res.json({ count });
  });

  app.get(api.chat.unreadByConversation.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const counts = await storage.getUnreadMessageCountsBySender(req.user!.id);
    res.json(counts);
  });

  // Mark messages as read for the current user. If a sender is supplied,
  // only that conversation is marked read; otherwise preserve the legacy
  // mark-all behavior for callers that still use this endpoint.
  app.post("/api/messages/mark-read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const senderId = Number(req.body?.senderId);
    if (Number.isInteger(senderId) && senderId > 0) {
      await storage.markMessagesAsRead(senderId, req.user!.id);
    } else {
      await storage.markAllMessagesAsRead(req.user!.id);
    }
    res.json({ success: true });
  });

  app.get(api.chat.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const otherUserId = Number(req.params.otherUserId);
    const otherUser = await storage.getUser(otherUserId);
    if (!otherUser) return res.status(404).json({ message: "User not found" });
    
    // Access control:
    // - Participants can only view messages with their mentor
    // - Mentors can view messages with their mentees OR admins
    // - Admins can view messages with anyone
    if (req.user!.role === 'participant') {
      if (!req.user!.mentorId) {
        return res.status(403).json({ message: "No mentor assigned" });
      }
      if (otherUserId !== req.user!.mentorId) {
        return res.status(403).json({ message: "You can only view messages with your mentor" });
      }
    } else if (req.user!.role === 'mentor') {
      const isMentee = otherUser.mentorId === req.user!.id;
      const isAdmin = otherUser.role === 'admin';
      if (!isMentee && !isAdmin) {
        return res.status(403).json({ message: "You can only view messages with your mentees or admin" });
      }
    }
    
    const messages = await storage.getMessages(req.user!.id, otherUserId);
    res.json(messages);
  });

  app.post(api.chat.send.path, messageLimiter, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const input = api.chat.send.input.parse(req.body);
    const receiver = await storage.getUser(input.receiverId);
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });
    
    if (req.user!.role === 'participant') {
      if (input.receiverId !== req.user!.mentorId) {
        return res.status(403).json({ message: "You can only message your assigned mentor" });
      }
    } else if (req.user!.role === 'mentor') {
      const isMentee = receiver.mentorId === req.user!.id;
      const isAdmin = receiver.role === 'admin';
      if (!isMentee && !isAdmin) {
        return res.status(403).json({ message: "You can only message your mentees or admin" });
      }
    }

    const message = await storage.createMessage({
      senderId: req.user!.id,
      receiverId: input.receiverId,
      content: stripHtml(input.content)
    });
    
    res.status(201).json(message);
  });

}

export function registerAdminMessageRoutes(app: Express, dependencies: Pick<RouteDependencies, "requireRole">) {
  const { requireRole } = dependencies;

  // === Admin Message Management ===

  app.get('/api/admin/messages/:userId1/:userId2', requireRole('admin'), async (req, res) => {
    const userId1 = Number(req.params.userId1);
    const userId2 = Number(req.params.userId2);
    if (isNaN(userId1) || isNaN(userId2)) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }
    const msgs = await storage.getMessagesBetweenUsers(userId1, userId2);
    res.json(msgs);
  });

  app.delete('/api/admin/messages/:userId1/:userId2', requireRole('admin'), async (req, res) => {
    const userId1 = Number(req.params.userId1);
    const userId2 = Number(req.params.userId2);
    if (isNaN(userId1) || isNaN(userId2)) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }
    const count = await storage.deleteMessagesBetweenUsers(userId1, userId2);
    res.json({ message: `Deleted ${count} messages`, count });
  });

}
