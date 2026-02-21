import { z } from 'zod';

// Meeting schema
export const meetingSchema = z.object({
  buildingId: z.string().uuid('Invalid building ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  date: z.date().refine((date) => date > new Date(), {
    message: 'Meeting date must be in the future',
  }),
  location: z.string().min(1, 'Location is required'),
  agenda: z.string().min(1, 'Agenda is required'),
  attendeeIds: z.array(z.string().uuid()).optional(),
});

// RSVP schema
export const rsvpSchema = z.object({
  meetingId: z.string().uuid('Invalid meeting ID'),
  status: z.enum(['attending', 'not_attending', 'maybe']),
});

// Meeting minutes schema
export const meetingMinutesSchema = z.object({
  meetingId: z.string().uuid('Invalid meeting ID'),
  content: z.string().min(1, 'Minutes content is required'),
  documents: z.array(z.string().uuid()).optional(),
});

export type MeetingInput = z.infer<typeof meetingSchema>;
export type RSVPInput = z.infer<typeof rsvpSchema>;
export type MeetingMinutesInput = z.infer<typeof meetingMinutesSchema>;
