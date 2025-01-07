import { NextApiRequest, NextApiResponse } from 'next';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 5, // Number of points
  duration: 60, // Per 60 seconds by IP
});

/**
 * Enforces rate limiting for Next.js API routes.
 * @param req Next.js API request object
 * @param res Next.js API response object
 */
export default async function rateLimit(req: NextApiRequest, res: NextApiResponse) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    await rateLimiter.consume(ip.toString()); // Consume a point for this IP
  } catch (err) {
    res.status(429).json({ message: 'Too many requests. Please try again later.' });
    throw err; // Ensures the calling code knows rate limiting has failed
  }
}
