import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import type { User } from "@shared/schema";

// Helper to strip sensitive fields from user objects
function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...safeUser } = user;
  return safeUser;
}

function sanitizeUsers(users: User[]): Omit<User, 'password'>[] {
  return users.map(sanitizeUser);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Authentication
  setupAuth(app);

  // === Users ===
  
  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const role = req.query.role as "participant" | "mentor" | undefined;
    
    // Participants can only see their own mentor
    if (req.user!.role === 'participant') {
      if (req.user!.mentorId) {
        const mentor = await storage.getUser(req.user!.mentorId);
        if (mentor) {
          return res.json(sanitizeUsers([mentor]));
        }
      }
      return res.json([]);
    }
    
    // Mentors only see their own mentees
    if (req.user!.role === 'mentor') {
      const allUsers = await storage.getAllUsers();
      const mentees = allUsers.filter(u => u.mentorId === req.user!.id);
      return res.json(sanitizeUsers(mentees));
    }
    
    // Admin sees all
    if (role) {
      const users = await storage.getUsersByRole(role);
      res.json(sanitizeUsers(users));
    } else {
      const users = await storage.getAllUsers();
      res.json(sanitizeUsers(users));
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
      
      // Hash the password before storing
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword
      });
      res.status(201).json(sanitizeUser(user));
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
    res.json(sanitizeUser(updated));
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

  // === Track Requirements ===
  
  app.get(api.trackRequirements.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const track = req.params.track as "A" | "B" | "C";
    const reqs = await storage.getAllTrackRequirements(track);
    res.json(reqs);
  });

  app.get(api.trackRequirements.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const track = req.params.track as "A" | "B" | "C";
    const week = Number(req.params.week);
    const req_ = await storage.getTrackRequirements(track, week);
    if (!req_) return res.status(404).json({ message: "Requirements not found" });
    res.json(req_);
  });

  // === Practice Resources ===
  
  app.get(api.practiceResources.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const resources = await storage.getAllPracticeResources();
    res.json(resources);
  });

  app.get(api.practiceResources.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const name = decodeURIComponent(req.params.name);
    const resource = await storage.getPracticeResourceByName(name);
    if (!resource) return res.status(404).json({ message: "Practice resource not found" });
    res.json(resource);
  });

  // === Prayer Completions ===
  
  app.get(api.prayerCompletions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    let targetUserId = req.user!.id;
    
    // Mentors/Admins can view others' completions
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
    
    const completions = await storage.getUserPrayerCompletions(targetUserId);
    res.json(completions);
  });

  app.get(api.prayerCompletions.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const day = Number(req.params.day);
    const period = req.params.period as "morning" | "evening";
    
    const completion = await storage.getPrayerCompletion(req.user!.id, day, period);
    res.json(completion || null);
  });

  app.post(api.prayerCompletions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const input = api.prayerCompletions.create.input.parse(req.body);
    
    // Time-gating: Can only complete current day or earlier
    if (req.user!.role === 'participant') {
      const startDate = new Date(req.user!.startDate || Date.now());
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const currentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      
      if (input.dayNumber > currentDay) {
        return res.status(403).json({ message: "Cannot complete future days" });
      }
    }
    
    // Check if already completed
    const existing = await storage.getPrayerCompletion(req.user!.id, input.dayNumber, input.period);
    if (existing) {
      return res.status(400).json({ message: "Already completed" });
    }
    
    const completion = await storage.createPrayerCompletion({
      userId: req.user!.id,
      dayNumber: input.dayNumber,
      period: input.period
    });
    
    res.status(201).json(completion);
  });

  app.delete(api.prayerCompletions.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const day = Number(req.params.day);
    const period = req.params.period as "morning" | "evening";
    
    const existing = await storage.getPrayerCompletion(req.user!.id, day, period);
    if (!existing) {
      return res.status(404).json({ message: "Completion not found" });
    }
    
    await storage.deletePrayerCompletion(req.user!.id, day, period);
    res.json({ message: "Completion removed" });
  });

  // === Admin Routes ===

  app.post(api.admin.createContent.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const input = api.admin.createContent.input.parse(req.body);
    const content = await storage.upsertDailyContent(input);
    res.status(201).json(content);
  });

  app.delete(api.admin.deleteUser.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const userId = Number(req.params.id);
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    await storage.deleteUser(userId);
    res.json({ message: "User deleted" });
  });

  app.get(api.admin.progress.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const users = await storage.getAllUsers();
    const completions = await storage.getAllPrayerCompletions();
    
    const today = new Date();
    
    const progressData = users
      .filter(u => u.role === 'participant')
      .map(u => {
        // Calculate current day for this user
        const startDate = u.startDate ? new Date(u.startDate) : today;
        const diffTime = Math.abs(today.getTime() - startDate.getTime());
        const currentDay = Math.max(1, Math.min(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1, 30));
        
        // Get completions for this user
        const userCompletions = completions.filter(c => c.userId === u.id);
        
        // Count unique days where BOTH morning and evening are complete
        const dayCompletionMap = new Map<number, { morning: boolean, evening: boolean }>();
        userCompletions.forEach(c => {
          if (!dayCompletionMap.has(c.dayNumber)) {
            dayCompletionMap.set(c.dayNumber, { morning: false, evening: false });
          }
          const day = dayCompletionMap.get(c.dayNumber)!;
          if (c.period === 'morning') day.morning = true;
          if (c.period === 'evening') day.evening = true;
        });
        
        let daysCompleted = 0;
        dayCompletionMap.forEach((status) => {
          if (status.morning && status.evening) daysCompleted++;
        });
        
        // Check today's completion
        const todayStatus = dayCompletionMap.get(currentDay) || { morning: false, evening: false };
        
        // Find mentor name
        const mentor = users.find(m => m.id === u.mentorId);
        
        return {
          userId: u.id,
          userName: u.name,
          userEmail: u.email,
          role: u.role,
          track: u.track,
          mentorName: mentor?.name || null,
          startDate: u.startDate ? new Date(u.startDate).toISOString() : null,
          currentDay,
          daysCompleted,
          morningToday: todayStatus.morning,
          eveningToday: todayStatus.evening,
        };
      });
    
    res.json(progressData);
  });
  
  // Seed Data
  await seed();

  return httpServer;
}

async function seed() {
    // Seed users if needed
    const users = await storage.getAllUsers();
    if (users.length === 0) {
        console.log("Seeding users...");
        
        // Hash passwords for security
        const adminHash = await hashPassword("admin");
        const passwordHash = await hashPassword("password");
        
        await storage.createUser({
            name: "Admin User",
            email: "admin@example.com",
            password: adminHash,
            role: "admin",
            startDate: new Date(),
        });
        
        const mentor = await storage.createUser({
            name: "Mentor Mike",
            email: "mentor@example.com",
            password: passwordHash,
            role: "mentor",
            startDate: new Date(),
        });
        
        await storage.createUser({
            name: "Participant Paul",
            email: "paul@example.com",
            password: passwordHash,
            role: "participant",
            track: "A",
            mentorId: mentor.id,
            startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Started 3 days ago
        });
    }

    // Seed track requirements if needed
    const existingReqs = await storage.getAllTrackRequirements("A");
    if (existingReqs.length === 0) {
        console.log("Seeding Track A requirements...");
        
        // Track A Week 1
        await storage.createTrackRequirement({
            track: "A",
            weekNumber: 1,
            morningPractices: ["Prayer Against Retaliation", "Miracle Prayer"],
            eveningPractices: ["Examen – St Ignatius", "Lectio Divina – 10 Minutes"],
            additionalRequirements: ["Abstinence Fridays Only", "Monthly Confession, or as Needed"]
        });
        
        // Track A Week 2
        await storage.createTrackRequirement({
            track: "A",
            weekNumber: 2,
            morningPractices: ["Prayer Against Retaliation", "Miracle Prayer"],
            eveningPractices: ["Examen – St Ignatius", "Silence – 5 Minutes", "Lectio Divina – 10 Minutes"],
            additionalRequirements: ["Abstinence Fridays Only", "Monthly Confession, or as Needed"]
        });
        
        // Track A Week 3
        await storage.createTrackRequirement({
            track: "A",
            weekNumber: 3,
            morningPractices: ["Prayer Against Retaliation", "Miracle Prayer"],
            eveningPractices: ["Examen – St Ignatius", "Silence – 5 Minutes", "Lectio Divina – 10 Minutes"],
            additionalRequirements: ["Abstinence Fridays Only", "Monthly Confession, or as Needed"]
        });
        
        // Track A Week 4
        await storage.createTrackRequirement({
            track: "A",
            weekNumber: 4,
            morningPractices: ["Prayer Against Retaliation", "Miracle Prayer", "Silence – 5 Minutes", "Lectio Divina – 10 Minutes"],
            eveningPractices: ["Rosary – OP + 1 Decade", "Examen – St Ignatius"],
            additionalRequirements: ["Abstinence Fridays Only", "Monthly Confession, or as Needed"]
        });
        
        // Track A Week 5
        await storage.createTrackRequirement({
            track: "A",
            weekNumber: 5,
            morningPractices: ["Prayer Against Retaliation", "Miracle Prayer", "Silence – 5 Minutes", "Lectio Divina – 10 Minutes"],
            eveningPractices: ["Rosary – OP + 1 Decade", "Examen – St Ignatius"],
            additionalRequirements: ["Abstinence Fridays Only", "Monthly Confession, or as Needed"]
        });
    }

    // Seed daily content if needed
    const existing = await storage.getAllDailyContent();
    if (existing.length === 0) {
        console.log("Seeding daily content...");
        
        const weekTitles = [
            "God's Loving Plan for Humanity",
            "Understanding God's Love",
            "Walking in Faith",
            "Prayer and Devotion",
            "Living Your Calling"
        ];
        
        // First, seed placeholder content for all 30 days
        for (let i = 1; i <= 30; i++) {
            const weekNumber = Math.ceil(i / 6);
            const isReflection = i % 6 === 0;
            
            await storage.createDailyContent({
                dayNumber: i,
                weekNumber: weekNumber,
                weekTitle: weekTitles[weekNumber - 1],
                morningScriptureRef: `Scripture Reference - Day ${i}`,
                morningScriptureText: `Scripture text for Day ${i} will be added.`,
                morningMeditation: `Morning meditation for Day ${i} will be added.`,
                morningPrayer: null,
                eveningCatechismRef: `CCC Reference - Day ${i}`,
                eveningCatechism: `Catechism content for Day ${i} will be added.`,
                eveningSummary: null,
                eveningQuestions: null,
                isReflectionDay: isReflection
            });
        }
        
        // Now update Day 1 with the actual content from the document
        await storage.upsertDailyContent({
            dayNumber: 1,
            weekNumber: 1,
            weekTitle: "God's Loving Plan for Humanity",
            morningScriptureRef: "John 14:23",
            morningScriptureText: "Jesus said to His disciples: \"Whoever loves Me will keep My word, and My Father will love him, and We will come to him and make Our dwelling with him.\"",
            morningMeditation: `Do you want our Lord to come to you and dwell within the depths of your soul? Presumably the answer is an easy "Yes." The way to make this happen is to love God and keep His word. When you do that, the Blessed Trinity will come and dwell within you.

It's interesting that the love of God appears to be contingent upon our love of Him. In other words, does God only love us when we love Him first? Strictly speaking, God loves us with a perfect love regardless of whether we love Him or not. But with that said, love takes on a whole new form when it is received and reciprocated. Therefore, when we choose to love God we suddenly realize that our love of Him opens the door for Him to come and dwell within us, transforming us and making our heart His holy sanctuary. What a glorious gift!

It's also interesting to note that love of God means, in part, that we are obedient to Him. But that's the nature of God. He is Love itself and, therefore, loving Him necessarily involves a complete submission of your will to His. Perfect obedience to Him in all things is a powerful way of loving Him. It's a way of allowing Him to dwell within you and, in that act, to take over your will. Only then can you love Him even more fully with your whole being.

Reflect, today, especially upon your desire to have the Most Holy Trinity come and dwell within your soul. This should be the primary goal of our lives. If God lives within us then all else in life will fall into place. All things will work for the good and God will be glorified in and through us. Make the choice to love Him through your obedience this day, and your relationship of love will grow by leaps and bounds.`,
            morningPrayer: `Lord, I do love You and desire to love You in a more perfect way this day. Help me to submit to Your perfect will in all things. Help me to embrace perfect obedience to You always. In that act of love and submission, come and make Your dwelling within me. Jesus, I trust in You.

—Philip Neri`,
            eveningCatechismRef: "CCC #214-227",
            eveningCatechism: `THE PROFESSION OF THE CHRISTIAN FAITH

God, "He Who Is", Is Truth and Love

God, "HE WHO IS", revealed himself to Israel as the One "abounding in steadfast love and faithfulness". These two terms express summarily the riches of the divine name. In all His works God displays, not only His kindness, goodness, grace and steadfast love, but also His trustworthiness, constancy, faithfulness and truth. "I give thanks to Your name for Your steadfast love and Your faithfulness." He is the Truth, for "God is light and in Him there is no darkness"; "God is love", as the apostle John teaches.

God Is Truth

"The sum of Your word is truth; and every one of Your righteous ordinances endures forever." "And now, O LORD God, You are God, and Your words are true"; this is why God's promises always come true. God is Truth itself, whose words cannot deceive. This is why one can abandon oneself in full trust to the truth and faithfulness of His Word in all things. The beginning of sin and of man's fall was due to a lie of the tempter who induced doubt of God's Word, kindness and faithfulness.

God's truth is His wisdom, which commands the whole created order and governs the world. God, who alone made heaven and earth, can alone impart true knowledge of every created thing in relation to Himself.

God is also truthful when he reveals Himself—the teaching that comes from God is "true instruction." When He sends His Son into the world it will be "to bear witness to the truth": "We know that the Son of God has come and has given us understanding, to know Him who is true."

God is Love

In the course of its history, Israel was able to discover that God had only one reason to reveal Himself to them, a single motive for choosing them from among all peoples as His special possession: His sheer gratuitous love. And thanks to the prophets Israel understood that it was again out of love that God never stopped saving them and pardoning their unfaithfulness and sins.

God's love for Israel is compared to a father's love for his son. His love for His people is stronger than a mother's for her children. God loves His people more than a bridegroom his beloved; His love will be victorious over even the worst infidelities and will extend to His most precious gift: "God so loved the world that He gave His only Son."

God's love is "everlasting": "For the mountains may depart and the hills be removed, but My steadfast love shall not depart from you." Through Jeremiah, God declares to His people, "I have loved you with an everlasting love; therefore I have continued my faithfulness to you."

But St. John goes even further when he affirms that "God is love." God's very being is love. By sending His only Son and the Spirit of Love in the fullness of time, God has revealed His innermost secret: God Himself is an eternal exchange of love, Father, Son and Holy Spirit, and He has destined us to share in that exchange.

The Implications of Faith in One God

Believing in God, the only One, and loving Him with all our being has enormous consequences for our whole life.

It means coming to know God's greatness and majesty: "Behold, God is great, and we know Him not." Therefore, we must "serve God first."

It means living in thanksgiving: if God is the only One, everything we are and have comes from Him: "What have you that you did not receive?" "What shall I render to the LORD for all His bounty to me?"

It means knowing the unity and true dignity of all men: everyone is made in the image and likeness of God.

It means making good use of created things: faith in God, the only One, leads us to use everything that is not God only insofar as it brings us closer to Him, and to detach ourselves from it insofar as it turns us away from Him:

My Lord and my God, take from me everything that distances me from You.
My Lord and my God, give me everything that brings me closer to You.
My Lord and my God, detach me from myself to give my all to You.

It means trusting God in every circumstance, even in adversity. A prayer of St. Teresa of Jesus wonderfully expresses this trust:

Let nothing trouble you. Let nothing frighten you.
Everything passes. God never changes.
Patience obtains all.
Whoever has God wants for nothing.
God alone is enough.`,
            eveningSummary: `God's Nature: God is love and truth and He wills our good. He is trustworthy and faithful and continually showers His mercy upon His children despite our unfaithfulness.

The Holy Trinity: The one true God is triune with three distinct persons, the Father, the Son, and the Holy Spirit. When we obey God's laws, Christ dwells in our hearts through the power of the Holy Spirit as granted through the Father's glory (Eph 3: 14–19).

God's Love for All Creation: God's love is perfect and everlasting. It is far greater than the love that any human can offer. It is sacrificial and is made manifest in the offering of His only son, Jesus, to die on the cross to atone for our sins and to bring us to salvation.

Misconceptions About God: People often believe that we must earn God's love. In fact, God's love is steadfast and always available to us, but we must be willing to repent of our sins and make our hearts a suitable home for Him so He can guide us in all things.`,
            eveningQuestions: [
                "Am I obeying all of God's commandments or do I sometimes choose to follow my will rather than His?",
                "Do I love God above all things and all people? If not, what or who have I placed before God in my heart? (e.g. money, power, beauty, spouse, children)",
                "Do I trust God in all circumstances of my life? If not, why not?",
                "What can I do to make my heart and soul a more fit dwelling place for God?"
            ],
            isReflectionDay: false
        });
    }
    
    console.log("Seeding complete.");
}
