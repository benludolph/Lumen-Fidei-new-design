import type { Express, RequestHandler } from "express";
import type { Multer } from "multer";
import type { User } from "@shared/schema";

// Implementations remain centralized in server/routes.ts. Passing the original
// instances preserves limiter state, helper behavior, and avoids circular imports.
export interface RouteDependencies {
  requireAuth: RequestHandler;
  requireRole: (...roles: string[]) => RequestHandler;
  writeLimiter: RequestHandler;
  messageLimiter: RequestHandler;
  uploadLimiter: RequestHandler;
  upload: Multer;
  stripHtml: (text: string) => string;
  sanitizeUser: (user: User) => Omit<User, "password">;
  sanitizeUsers: (users: User[]) => Omit<User, "password">[];
  computeCurrentProgramDay: (cohortStartDateStr: string | null) => number;
  effectiveCurrentDay: (user: Express.User | undefined, globalCurrentDay: number) => number;
  hashPassword: typeof import("../auth").hashPassword;
  validateTrackAssignment: typeof import("../tracks").validateTrackAssignment;
}
