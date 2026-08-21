import { z } from 'zod';
import { insertUserSchema, insertDailyContentSchema, insertUserAnswerSchema, insertMessageSchema, insertTrackRequirementsSchema, insertPrayerCompletionSchema, users, dailyContent, userAnswers, messages, trackRequirements, prayerCompletions, practiceResources, cohortSettings, programs, programReleases, programEnrollments, releaseLessonProgress } from './schema';

export type SafeUser = Omit<typeof users.$inferSelect, 'password'>;

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  })
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<SafeUser>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<SafeUser>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      input: z.object({ role: z.enum(["participant", "mentor"]).optional() }).optional(),
      responses: {
        200: z.array(z.custom<SafeUser>()),
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<SafeUser>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/users/:id',
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<SafeUser>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  content: {
    get: {
      method: 'GET' as const,
      path: '/api/content/:day',
      responses: {
        200: z.custom<typeof dailyContent.$inferSelect>(),
        403: errorSchemas.forbidden, // Future days locked
        404: errorSchemas.notFound,
      },
    },
    list: {
        method: 'GET' as const,
        path: '/api/content',
        responses: {
            200: z.array(z.custom<typeof dailyContent.$inferSelect>()),
        }
    }
  },
  answers: {
    list: {
      method: 'GET' as const,
      path: '/api/answers',
      input: z.object({ userId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof userAnswers.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/answers',
      input: z.object({ dayNumber: z.number(), content: z.string() }),
      responses: {
        201: z.custom<typeof userAnswers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  chat: {
    list: {
      method: 'GET' as const,
      path: '/api/messages/:otherUserId',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/messages',
      input: z.object({ receiverId: z.number(), content: z.string() }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    unreadCount: {
      method: 'GET' as const,
      path: '/api/messages/unread/count',
      responses: {
        200: z.object({ count: z.number() }),
      },
    },
    unreadByConversation: {
      method: 'GET' as const,
      path: '/api/messages/unread/by-conversation',
      responses: {
        200: z.record(z.string(), z.number()),
      },
    },
  },
  trackRequirements: {
    get: {
      method: 'GET' as const,
      path: '/api/track-requirements/:track/:week',
      responses: {
        200: z.custom<typeof trackRequirements.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/track-requirements/:track',
      responses: {
        200: z.array(z.custom<typeof trackRequirements.$inferSelect>()),
      },
    },
  },
  practiceResources: {
    list: {
      method: 'GET' as const,
      path: '/api/practice-resources',
      responses: {
        200: z.array(z.custom<typeof practiceResources.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/practice-resources/:idOrName',
      responses: {
        200: z.custom<typeof practiceResources.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  cohort: {
    getStartDate: {
      method: 'GET' as const,
      path: '/api/cohort/start-date',
      responses: {
        200: z.object({ startDate: z.string().nullable(), currentDay: z.number() }),
      },
    },
  },
  prayerCompletions: {
    list: {
      method: 'GET' as const,
      path: '/api/prayer-completions',
      input: z.object({ userId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof prayerCompletions.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/prayer-completions/:day/:period',
      responses: {
        200: z.custom<typeof prayerCompletions.$inferSelect>().nullable(),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/prayer-completions',
      input: z.object({ dayNumber: z.number(), period: z.enum(["morning", "evening"]) }),
      responses: {
        201: z.custom<typeof prayerCompletions.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/prayer-completions/:day/:period',
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
  admin: {
    createContent: {
      method: 'POST' as const,
      path: '/api/admin/content',
      input: insertDailyContentSchema,
      responses: {
        201: z.custom<typeof dailyContent.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    deleteUser: {
      method: 'DELETE' as const,
      path: '/api/users/:id',
      responses: {
        200: z.object({ message: z.string() }),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    cohortSettings: {
      get: {
        method: 'GET' as const,
        path: '/api/admin/cohort-settings',
        responses: {
          200: z.object({ startDate: z.string().nullable() }),
          403: errorSchemas.forbidden,
        },
      },
      update: {
        method: 'POST' as const,
        path: '/api/admin/cohort-settings',
        input: z.object({ startDate: z.string() }),
        responses: {
          200: z.object({ startDate: z.string() }),
          400: errorSchemas.validation,
          403: errorSchemas.forbidden,
        },
      },
    },
    progress: {
      method: 'GET' as const,
      path: '/api/admin/progress',
      responses: {
        200: z.array(z.object({
          userId: z.number(),
          userName: z.string(),
          userEmail: z.string(),
          role: z.string(),
          track: z.string().nullable(),
          mentorName: z.string().nullable(),
          startDate: z.string().nullable(),
          currentDay: z.number(),
          daysCompleted: z.number(),
          morningToday: z.boolean(),
          eveningToday: z.boolean(),
        })),
        403: errorSchemas.forbidden,
      },
    },
    resetPassword: {
      method: 'POST' as const,
      path: '/api/admin/users/:id/reset-password',
      input: z.object({ newPassword: z.string().min(6) }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    userDetails: {
      method: 'GET' as const,
      path: '/api/admin/users/:id/details',
      responses: {
        200: z.object({
          user: z.object({
            id: z.number(),
            name: z.string(),
            email: z.string(),
            role: z.string(),
            track: z.string().nullable(),
            mentorId: z.number().nullable(),
            mentorName: z.string().nullable(),
            startDate: z.string().nullable(),
            currentDay: z.number(),
            daysCompleted: z.number(),
            totalPossibleDays: z.number(),
            graduationEligible: z.boolean(),
          }),
          answers: z.array(z.object({
            id: z.number(),
            dayNumber: z.number(),
            content: z.string(),
            createdAt: z.string(),
            questions: z.array(z.string()).nullable(),
          })),
          prayerCompletions: z.array(z.object({
            dayNumber: z.number(),
            period: z.string(),
            completedAt: z.string(),
          })),
        }),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    startNewCohort: {
      method: 'POST' as const,
      path: '/api/admin/cohort/start-new',
      input: z.object({ 
        name: z.string().min(1),
        startDate: z.string(),
        clearCompletions: z.boolean().optional()
      }),
      responses: {
        200: z.object({ 
          message: z.string(), 
          startDate: z.string(),
          completionsCleared: z.number()
        }),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    listCohorts: {
      method: 'GET' as const,
      path: '/api/admin/cohorts',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          name: z.string(),
          startDate: z.string(),
          endDate: z.string().nullable(),
          status: z.enum(["active", "archived"]),
          createdAt: z.string(),
        })),
        403: errorSchemas.forbidden,
      },
    },
    getActiveCohort: {
      method: 'GET' as const,
      path: '/api/admin/cohorts/active',
      responses: {
        200: z.object({
          id: z.number(),
          name: z.string(),
          startDate: z.string(),
          endDate: z.string().nullable(),
          status: z.enum(["active", "archived"]),
          createdAt: z.string(),
        }).nullable(),
        403: errorSchemas.forbidden,
      },
    },
    exportUsers: {
      method: 'GET' as const,
      path: '/api/admin/export/users',
      responses: {
        200: z.string(), // CSV content
        403: errorSchemas.forbidden,
      },
    },
    exportAnswers: {
      method: 'GET' as const,
      path: '/api/admin/export/answers',
      responses: {
        200: z.string(), // CSV content
        403: errorSchemas.forbidden,
      },
    },
    exportProgress: {
      method: 'GET' as const,
      path: '/api/admin/export/progress',
      responses: {
        200: z.string(), // CSV content
        403: errorSchemas.forbidden,
      },
    },
    backup: {
      method: 'GET' as const,
      path: '/api/admin/backup',
      responses: {
        200: z.object({
          version: z.literal(1),
          exportedAt: z.string(),
          data: z.object({
            prelim_modules: z.array(z.record(z.string(), z.unknown())),
            track_a_content: z.array(z.record(z.string(), z.unknown())),
            track_a_modules: z.array(z.record(z.string(), z.unknown())),
            daily_content: z.array(z.record(z.string(), z.unknown())),
            module_overlays: z.array(z.record(z.string(), z.unknown())),
            practice_resources: z.array(z.record(z.string(), z.unknown())),
            cohort_settings: z.array(z.record(z.string(), z.unknown())),
            uploaded_images: z.array(z.record(z.string(), z.unknown())).optional(),
          }),
        }),
        403: errorSchemas.forbidden,
      },
    },
    restore: {
      method: 'POST' as const,
      path: '/api/admin/restore',
      input: z.object({
        version: z.literal(1),
        exportedAt: z.string(),
        data: z.object({
          prelim_modules: z.array(z.record(z.string(), z.unknown())),
          track_a_content: z.array(z.record(z.string(), z.unknown())),
          track_a_modules: z.array(z.record(z.string(), z.unknown())),
          daily_content: z.array(z.record(z.string(), z.unknown())),
          module_overlays: z.array(z.record(z.string(), z.unknown())),
          practice_resources: z.array(z.record(z.string(), z.unknown())),
          cohort_settings: z.array(z.record(z.string(), z.unknown())),
          uploaded_images: z.array(z.record(z.string(), z.unknown())).optional(),
        }),
      }),
      responses: {
        200: z.object({ message: z.string(), counts: z.record(z.number()) }),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
  },
};

// ─── Programs & Releases API Contracts ───────────────────────────────────────

export const programsApi = {
  // Programs CRUD
  listPrograms: {
    method: 'GET' as const,
    path: '/api/admin/programs',
    responses: {
      200: z.array(z.custom<typeof programs.$inferSelect>()),
      403: errorSchemas.forbidden,
    },
  },
  getProgram: {
    method: 'GET' as const,
    path: '/api/admin/programs/:id',
    responses: {
      200: z.custom<typeof programs.$inferSelect>(),
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
    },
  },
  createProgram: {
    method: 'POST' as const,
    path: '/api/admin/programs',
    input: z.object({
      key: z.string().min(1).regex(/^\S+$/),
      name: z.string().min(1),
      description: z.string().optional(),
    }),
    responses: {
      201: z.custom<typeof programs.$inferSelect>(),
      400: errorSchemas.validation,
      403: errorSchemas.forbidden,
      409: z.object({ message: z.string() }),
    },
  },
  updateProgram: {
    method: 'PATCH' as const,
    path: '/api/admin/programs/:id',
    input: z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
    responses: {
      200: z.custom<typeof programs.$inferSelect>(),
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
    },
  },
  deleteProgram: {
    method: 'DELETE' as const,
    path: '/api/admin/programs/:id',
    responses: {
      200: z.object({ message: z.string() }),
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
      409: z.object({ message: z.string() }), // has published releases
    },
  },

  // Releases
  listReleases: {
    method: 'GET' as const,
    path: '/api/admin/programs/:programId/releases',
    responses: {
      200: z.array(z.custom<typeof programReleases.$inferSelect>()),
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
    },
  },
  getRelease: {
    method: 'GET' as const,
    path: '/api/admin/programs/:programId/releases/:releaseId',
    responses: {
      200: z.custom<typeof programReleases.$inferSelect>(),
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
    },
  },
  createDraftRelease: {
    method: 'POST' as const,
    path: '/api/admin/programs/:programId/releases',
    input: z.object({
      label: z.string().optional(),
      curriculum: z.record(z.unknown()), // raw doc; server validates fully
    }),
    responses: {
      201: z.custom<typeof programReleases.$inferSelect>(),
      400: errorSchemas.validation,
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
    },
  },
  updateDraftRelease: {
    method: 'PATCH' as const,
    path: '/api/admin/programs/:programId/releases/:releaseId',
    input: z.object({
      label: z.string().optional(),
      curriculum: z.record(z.unknown()).optional(),
    }),
    responses: {
      200: z.custom<typeof programReleases.$inferSelect>(),
      400: errorSchemas.validation,
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
      409: z.object({ message: z.string() }), // not a draft
    },
  },
  validateRelease: {
    method: 'POST' as const,
    path: '/api/admin/programs/:programId/releases/:releaseId/validate',
    responses: {
      200: z.object({ valid: z.boolean(), errors: z.array(z.string()).optional() }),
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
    },
  },
  publishRelease: {
    method: 'POST' as const,
    path: '/api/admin/programs/:programId/releases/:releaseId/publish',
    responses: {
      200: z.custom<typeof programReleases.$inferSelect>(),
      400: errorSchemas.validation,
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
      409: z.object({ message: z.string() }), // not a draft
    },
  },
  rollbackRelease: {
    method: 'POST' as const,
    path: '/api/admin/programs/:programId/releases/:releaseId/rollback',
    responses: {
      200: z.custom<typeof programReleases.$inferSelect>(), // new draft created from prior release
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
      409: z.object({ message: z.string() }),
    },
  },

  // Enrollments
  listEnrollments: {
    method: 'GET' as const,
    path: '/api/admin/programs/:programId/enrollments',
    responses: {
      200: z.array(z.custom<typeof programEnrollments.$inferSelect>()),
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
    },
  },
  getProgramProgress: {
    method: 'GET' as const,
    path: '/api/admin/programs/:programId/progress',
    responses: {
      200: z.array(z.object({
        enrollmentId: z.number(),
        userId: z.number(),
        userName: z.string(),
        userEmail: z.string(),
        releaseId: z.number(),
        releaseNumber: z.number(),
        releaseLabel: z.string().nullable(),
        status: z.string(),
        completedLessons: z.number(),
        totalLessons: z.number(),
        percent: z.number(),
        lastActivityAt: z.string().nullable(),
      })),
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
    },
  },
  assignEnrollment: {
    method: 'POST' as const,
    path: '/api/admin/programs/:programId/enrollments',
    input: z.object({
      userId: z.number().int().positive(),
      releaseId: z.number().int().positive().optional(), // defaults to latest published
      cohortId: z.number().int().positive(),
    }),
    responses: {
      201: z.custom<typeof programEnrollments.$inferSelect>(),
      400: errorSchemas.validation,
      403: errorSchemas.forbidden,
      404: errorSchemas.notFound,
      409: z.object({ message: z.string() }), // already enrolled
    },
  },
  listMyEnrollments: {
    method: 'GET' as const,
    path: '/api/programs/my-enrollments',
    responses: {
      200: z.array(z.object({
        program: z.custom<typeof programs.$inferSelect>(),
        enrollment: z.custom<typeof programEnrollments.$inferSelect>(),
        release: z.custom<typeof programReleases.$inferSelect>(),
        progress: z.array(z.custom<typeof releaseLessonProgress.$inferSelect>()),
      })),
      401: errorSchemas.unauthorized,
    },
  },
  getEffectiveEnrollment: {
    method: 'GET' as const,
    path: '/api/programs/:programId/my-enrollment',
    responses: {
      200: z.object({
        enrollment: z.custom<typeof programEnrollments.$inferSelect>(),
        release: z.custom<typeof programReleases.$inferSelect>(),
      }).nullable(),
      401: errorSchemas.unauthorized,
    },
  },

  // Release-aware lesson progress (new program system)
  getLessonProgress: {
    method: 'GET' as const,
    path: '/api/programs/progress/:enrollmentId/:lessonKey',
    responses: {
      200: z.custom<typeof releaseLessonProgress.$inferSelect>().nullable(),
      401: errorSchemas.unauthorized,
      403: errorSchemas.forbidden,
    },
  },
  upsertLessonProgress: {
    method: 'PUT' as const,
    path: '/api/programs/progress/:enrollmentId/:lessonKey',
    input: z.object({
      slideIndex: z.number().int().min(0),
      completed: z.boolean().optional(),
    }),
    responses: {
      200: z.custom<typeof releaseLessonProgress.$inferSelect>(),
      400: errorSchemas.validation,
      401: errorSchemas.unauthorized,
      403: errorSchemas.forbidden,
    },
  },

  // Track A import
  importTrackA: {
    method: 'POST' as const,
    path: '/api/admin/programs/import-track-a',
    responses: {
      200: z.object({
        program: z.custom<typeof programs.$inferSelect>(),
        release: z.custom<typeof programReleases.$inferSelect>(),
        created: z.boolean(),
      }),
      400: errorSchemas.validation,
      403: errorSchemas.forbidden,
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ContentBackup = {
  version: 1;
  exportedAt: string;
  data: {
    prelim_modules: Record<string, unknown>[];
    track_a_content: Record<string, unknown>[];
    track_a_modules: Record<string, unknown>[];
    daily_content: Record<string, unknown>[];
    module_overlays: Record<string, unknown>[];
    practice_resources: Record<string, unknown>[];
    cohort_settings: Record<string, unknown>[];
    uploaded_images?: Record<string, unknown>[];
  };
};

// Type exports
export type LoginRequest = z.infer<typeof api.auth.login.input>;
export type User = typeof users.$inferSelect;
export type SendMessageRequest = z.infer<typeof api.chat.send.input>;
export type CreateUserRequest = z.infer<typeof api.users.create.input>;
export type UpdateUserRequest = z.infer<typeof api.users.update.input>;
export type CreateAnswerRequest = z.infer<typeof api.answers.create.input>;
