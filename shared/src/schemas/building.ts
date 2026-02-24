import { z } from 'zod';

// Building schema
export const buildingSchema = z.object({
  name: z.string().min(1, 'Building name is required'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  contactEmail: z.string().email('Invalid email format'),
  contactPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

// Apartment schema
export const apartmentSchema = z.object({
  buildingId: z.string().uuid('Invalid building ID'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  floor: z.number().int('Floor must be an integer'),
  size: z.number().positive('Size must be a positive number'),
});

// Resident schema
export const residentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  apartmentId: z.string().uuid('Invalid apartment ID'),
  buildingId: z.string().uuid('Invalid building ID'),
  role: z.enum(['owner', 'tenant'], {
    errorMap: () => ({ message: 'Role must be either owner or tenant' }),
  }),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  moveInDate: z.date(),
  moveOutDate: z.date().optional(),
});

export type BuildingInput = z.infer<typeof buildingSchema>;
export type ApartmentInput = z.infer<typeof apartmentSchema>;
export type ResidentInput = z.infer<typeof residentSchema>;
