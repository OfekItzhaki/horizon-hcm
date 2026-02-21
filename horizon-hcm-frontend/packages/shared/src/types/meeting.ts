// Meeting Types

export type RSVPStatus = 'attending' | 'not_attending' | 'maybe' | 'pending';

export interface Meeting {
  id: string;
  buildingId: string;
  title: string;
  date: Date;
  location: string;
  agenda: string;
  agendaDocuments: string[]; // Document IDs
  attendees: Attendee[];
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
