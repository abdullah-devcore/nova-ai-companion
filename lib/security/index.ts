import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Rate limiting middleware
 * Simple in-memory rate limiter (should use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  req: NextRequest,
  limit: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const now = Date.now();

  let entry = rateLimitStore.get(ip);

  // Reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(ip, entry);
  }

  entry.count++;

  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);

  return { allowed, remaining };
}

/**
 * Input validation schemas
 */
export const schemas = {
  chatMessage: z.object({
    content: z.string().min(1).max(10000),
    files: z.array(z.string()).optional(),
  }),

  fileUpload: z.object({
    filename: z.string().max(255),
    mimeType: z.string(),
    fileSize: z.number().max(50 * 1024 * 1024),
  }),

  folderCreate: z.object({
    name: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    parentFolderId: z.string().uuid().optional(),
  }),

  memoryCreate: z.object({
    content: z.string().min(1).max(1000),
    type: z.enum(["user_fact", "preference", "goal", "skill", "context"]),
    importance_score: z.number().min(0).max(1).optional(),
  }),

  shareCreate: z.object({
    chatId: z.string().uuid(),
    expiresIn: z.number().min(1).max(365).optional(),
    password: z.string().max(255).optional(),
  }),
};

/**
 * Validate and sanitize input
 */
export function validateInput<T>(schema: z.ZodSchema, data: unknown): T {
  return schema.parse(data) as T;
}

/**
 * Sanitize text to prevent XSS
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Check for SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/gi,
    /(\bDROP\b.*\b(TABLE|DATABASE)\b)/gi,
    /(\bINSERT\b.*\bINTO\b)/gi,
    /(\bDELETE\b.*\bFROM\b)/gi,
    /(\bUPDATE\b.*\bSET\b)/gi,
    /(--|#|\/\*|\*\/)/,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Create rate limit response headers
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", resetTime.toString());
  return response;
}

/**
 * Check if user has required role/permissions
 */
export async function checkPermission(
  userId: string,
  requiredPermission: string
): Promise<boolean> {
  // This would be implemented based on your auth system
  // For now, returning true (implement based on your needs)
  return true;
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  userId: string,
  eventType: string,
  details: Record<string, any>
): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${eventType}`, {
    userId,
    details,
  });

  // In production, send to security monitoring service
  // e.g., Sentry, CloudWatch, etc.
}

/**
 * Validate JWT token (basic example)
 */
export function validateToken(token: string): { valid: boolean; userId?: string } {
  try {
    // This would use your actual JWT library
    // For now, basic validation
    if (!token || token.split(".").length !== 3) {
      return { valid: false };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false };
  }
}
