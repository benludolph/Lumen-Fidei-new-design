import { z } from 'zod';
import { insertUserSchema, insertDailyContentSchema, insertUserAnswerSchema, insertMessageSchema, insertTrackRequirementsSchema, insertPrayerCompletionSchema, users, dailyContent, userAnswers, messages, trackRequirements, prayerCompletions, practiceResources, cohortSettings } from './schema';

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
        200: z.custom<typeof users.$inferSelect>(),
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
        200: z.custom<typeof users.$inferSelect>(),
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
        200: z.array(z.custom<typeof users.$inferSelect>()),
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/users/:id',
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
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
      path: '/api/practice-resources/:name',
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
            agreementSignedAt: z.string().nullable(),
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
    day0Settings: {
      get: {
        method: 'GET' as const,
        path: '/api/admin/day0-settings',
        responses: {
          200: z.object({ 
            introVideoUrl: z.string().nullable(), 
            agreementText: z.string().nullable() 
          }),
          403: errorSchemas.forbidden,
        },
      },
      update: {
        method: 'POST' as const,
        path: '/api/admin/day0-settings',
        input: z.object({ 
          introVideoUrl: z.string().optional(),
          agreementText: z.string().optional()
        }),
        responses: {
          200: z.object({ message: z.string() }),
          400: errorSchemas.validation,
          403: errorSchemas.forbidden,
        },
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
  },
  day0: {
    get: {
      method: 'GET' as const,
      path: '/api/day0',
      responses: {
        200: z.object({ 
          introVideoUrl: z.string().nullable(), 
          agreementText: z.string().nullable(),
          agreementSigned: z.boolean()
        }),
      },
    },
    signAgreement: {
      method: 'POST' as const,
      path: '/api/day0/sign-agreement',
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
      },
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

// Type exports
export type LoginRequest = z.infer<typeof api.auth.login.input>;
export type User = typeof users.$inferSelect;
export type SendMessageRequest = z.infer<typeof api.chat.send.input>;
export type CreateUserRequest = z.infer<typeof api.users.create.input>;
export type UpdateUserRequest = z.infer<typeof api.users.update.input>;
export type CreateAnswerRequest = z.infer<typeof api.answers.create.input>;
