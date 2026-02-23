// Meeting Types

export type RSVPStatus = 'attending' | 'not_attending' | 'maybe' | 'pending';

export interface Meeting {
  id: string;
  buildingId: string;
  title: string;
  description?: string;
  date: Date;
  scheduledAt: Date;
  location: string;
  duration?: number; // in minutes
  agenda: string | string[];
  agendaDocuments: string[]; // Document IDs
  attendees: Attendee[];
  attendeeCount?: number;
  status: number; // 0 = scheduled, 1 = in_progress, 2 = completed, 3 = cancelled
  userRsvp?: RSVPStatus;
  minutes?: string;
  minutesDocuments: string[]; // Document IDs
  minutesPublishedAt?: Date;
  minutesPublishedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
}

export interface Attendee {
  userId: string;
  name: string;
  email: string;
  rsvpStatus: RSVPStatus;
  rsvpAt?: Date;
}
