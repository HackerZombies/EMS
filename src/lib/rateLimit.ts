import { NextApiRequest, NextApiResponse } from 'next';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 5, // Number of points
  duration: 60, // Per 60 seconds by IP
});

/**
 * Middleware to enforce rate limiting.
 * @param req Next.js API request object
 * @param res Next.js API response object
 * @param next Function to proceed to the next middleware or handler
 */
export default async function rateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    await rateLimiter.consume(ip.toString()); // Consume a point for this IP
    next(); // Proceed to the next middleware or API handler
  } catch (err) {
    res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }
}