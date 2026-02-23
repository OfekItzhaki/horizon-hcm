// Voting and Polls Types

export type PollStatus = 'upcoming' | 'active' | 'closed';

export interface Poll {
  id: string;
  buildingId: string;
  question: string;
  description?: string;
  options: PollOption[];
  type: 'single_choice' | 'multiple_choice';
  startDate: Date;
  endDate: Date;
  endsAt?: Date;
  allowedRoles: string[];
  anonymous: boolean;
  status: PollStatus;
  totalVotes?: number;
  userVote?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[]; // User IDs (empty if anonymous)
}

export interface Vote {
  id: string;
  pollId: string;
  userId: string;
  optionIds: string[];
  votedAt: Date;
}
