import { z } from 'zod';

// Announcement schema
export const announcementSchema = z.object({
  buildingId: z.string().uuid('Invalid building ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['urgent', 'normal', 'low']).default('normal'),
  targetAudience: z.object({
    type: z.enum(['all', 'owners', 'tenants', 'specific']),
    apartmentIds: z.array(z.string().uuid()).optional(),
  }),
  requiresConfirmation: z.boolean().default(false),
  scheduledFor: z.date().optional(),
});

// Message schema
export const messageSchema = z.object({
  buildingId: z.string().uuid('Invalid building ID'),
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2000 characters'),
  attachments: z
    .array(
      z.object({
        type: z.enum(['image', 'file']),
        url: z.string().url(),
        name: z.string(),
        size: z.number(),
      })
    )
    .optional(),
});

// Poll schema
export const pollSchema = z
  .object({
    buildingId: z.string().uuid('Invalid building ID'),
    question: z.string().min(1, 'Question is required'),
    options: z
      .array(z.string().min(1, 'Option cannot be empty'))
      .min(2, 'Poll must have at least 2 options'),
    type: z.enum(['single_choice', 'multiple_choice']).default('single_choice'),
    startDate: z.date(),
    endDate: z.date(),
    allowedRoles: z.array(z.string()).optional(),
    anonymous: z.boolean().default(false),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

// Vote schema
export const voteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  optionIds: z.array(z.string().uuid()).min(1, 'You must select at least one option'),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type PollInput = z.infer<typeof pollSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
