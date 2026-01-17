import { z } from 'zod';
import { insertUserSchema, insertDailyContentSchema, insertUserAnswerSchema, insertMessageSchema, users, dailyContent, userAnswers, messages } from './schema';

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
