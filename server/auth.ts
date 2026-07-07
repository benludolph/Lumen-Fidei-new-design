import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { pool } from "./db";
import { type User as SchemaUser } from "@shared/schema";

export function sanitizeUser(user: SchemaUser): Omit<SchemaUser, 'password'> {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      email: string;
      password: string;
      role: "participant" | "mentor" | "admin" | "superuser";
      track: "A" | "B" | "C" | null;
      mentorId: number | null;
      startDate: Date | null;
      profilePhotoUrl: string | null;
      contentVariantSnapshotId: number | null;
    }
  }
}

async function ensureSessionTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
    );
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `);
}

export async function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }

  const isProduction = app.get("env") === "production";
  if (isProduction) {
    app.set("trust proxy", 1);
  }

  // Use PostgreSQL session store in production so sessions survive autoscale
  // restarts and are shared across all instances. Fall back to MemoryStore in dev.
  let store: session.Store;
  if (isProduction && process.env.DATABASE_URL) {
    // Create the session table ourselves so connect-pg-simple doesn't need
    // to read table.sql from node_modules (which is absent after bundling).
    await ensureSessionTable();
    const PgSession = connectPgSimple(session);
    store = new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: false,
      ttl: 86400, // 24 hours in seconds
    });
  } else {
    const MemoryStore = createMemoryStore(session);
    store = new MemoryStore({ checkPeriod: 86400000 });
  }

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret || "spiritual-program-dev-secret-only",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 86400000, // 24 hours
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    },
    store,
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Normalize email to lowercase for case-insensitive login
        const normalizedEmail = username.toLowerCase().trim();
        const user = await storage.getUserByUsername(normalizedEmail);
        if (!user) {
          return done(null, false, { message: "Incorrect email." });
        }
        // Check password - always compare against bcrypt hash
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Incorrect password." });
        }
        if (!user.isActive) {
          return done(null, false, { message: "This account has been deactivated. Please contact your program administrator." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (user && !user.isActive) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SchemaUser | false, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json(sanitizeUser(user));
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  // Current user route
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(sanitizeUser(req.user as SchemaUser));
    }
    res.status(401).json({ message: "Not authenticated" });
  });
}
