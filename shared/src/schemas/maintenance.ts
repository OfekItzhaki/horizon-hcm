import { z } from 'zod';

// Maintenance request schema
export const maintenanceRequestSchema = z.object({
  buildingId: z.string().uuid('Invalid building ID'),
  apartmentId: z.string().uuid('Invalid apartment ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['plumbing', 'electrical', 'hvac', 'structural', 'cleaning', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  photos: z.array(z.string().url()).max(5, 'Maximum 5 photos allowed'),
});

// Maintenance comment schema
export const maintenanceCommentSchema = z.object({
  maintenanceRequestId: z.string().uuid('Invalid maintenance request ID'),
  content: z.string().min(1, 'Comment cannot be empty'),
});

// Maintenance status update schema
export const maintenanceStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'rejected', 'cancelled']),
  notes: z.string().optional(),
});

export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>;
export type MaintenanceCommentInput = z.infer<typeof maintenanceCommentSchema>;
export type MaintenanceStatusUpdateInput = z.infer<typeof maintenanceStatusUpdateSchema>;
