import { z } from 'zod';

// Invoice schema
export const invoiceSchema = z.object({
  buildingId: z.string().uuid('Invalid building ID'),
  apartmentId: z.string().uuid('Invalid apartment ID'),
  amount: z.number().positive('Amount must be a positive number'),
  currency: z.string().default('ILS'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.date().refine((date) => date > new Date(), {
    message: 'Due date must be in the future',
  }),
});

// Payment schema
export const paymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  amount: z.number().positive('Amount must be a positive number'),
  method: z.enum(['credit_card', 'bank_transfer', 'cash']),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
});

// Card number validation (Luhn algorithm)
export const cardNumberSchema = z.string().refine((val) => {
  const digits = val.replace(/\s/g, '');
  if (!/^\d+$/.test(digits)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    const char = digits[i];
    if (!char) continue;
    let digit = parseInt(char, 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}, 'Invalid card number');

// Expiry date validation (MM/YY format, must be in future)
export const expiryDateSchema = z.string().refine((val) => {
  const match = val.match(/^(\d{2})\/(\d{2})$/);
  if (!match || !match[1] || !match[2]) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10) + 2000;

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const expiry = new Date(year, month - 1);

  return expiry > now;
}, 'Card has expired or invalid format (MM/YY)');

// CVV validation (3 or 4 digits)
export const cvvSchema = z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits');

// Complete payment form schema
export const paymentFormSchema = z
  .object({
    invoiceId: z.string().uuid('Invalid invoice ID'),
    amount: z.number().positive('Amount must be a positive number'),
    method: z.enum(['credit_card', 'bank_transfer', 'cash']),
    cardNumber: cardNumberSchema.optional(),
    expiryDate: expiryDateSchema.optional(),
    cvv: cvvSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.method === 'credit_card') {
        return data.cardNumber && data.expiryDate && data.cvv;
      }
      return true;
    },
    {
      message: 'Card details are required for credit card payments',
    }
  );

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type PaymentFormInput = z.infer<typeof paymentFormSchema>;
