import { z } from 'zod';
import DOMPurify from 'dompurify';

// Input validation schemas
export const restaurantFormSchema = z.object({
  name: z.string()
    .min(1, 'Restaurant name is required')
    .max(100, 'Restaurant name must be less than 100 characters')
    .refine(val => val.trim().length > 0, 'Restaurant name cannot be empty'),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .optional()
    .refine(val => !val || /^\+[1-9][0-9]{6,14}$/.test(val), 'Invalid phone number format'),
  whatsapp_number: z.string()
    .optional()
    .refine(val => !val || /^\+[1-9][0-9]{6,14}$/.test(val), 'Invalid WhatsApp number format'),
  currency: z.enum(['RWF', 'USD', 'EUR']),
  brand_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
});

export const menuItemSchema = z.object({
  name: z.string()
    .min(1, 'Item name is required')
    .max(100, 'Item name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  base_price: z.number()
    .min(0, 'Price must be positive')
    .max(1000000, 'Price is too high'),
  category_id: z.string().uuid('Invalid category ID'),
});

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters'),
  display_order: z.number().min(0).optional(),
});

// Security functions
export function sanitizeHtml(input: string): string {
  if (typeof window !== 'undefined' && DOMPurify) {
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }
  // Server-side fallback
  return input.replace(/[<>"\''&]/g, '');
}

export function validateWhatsappNumber(number: string): boolean {
  if (!number || number.trim() === '') return true; // Optional field
  return /^\+[1-9][0-9]{6,14}$/.test(number);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

export function sanitizeFileName(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// Rate limiting for client-side (simple implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// XSS prevention utilities
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function validateAndSanitizeInput(input: string, maxLength: number = 255): string {
  if (!input) return '';
  
  // Sanitize HTML
  let sanitized = sanitizeHtml(input);
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}